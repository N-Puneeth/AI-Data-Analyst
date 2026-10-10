from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import os
import uuid
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.auth.models import User
from app.datasets.models import Dataset, DatasetStatus
from app.datasets.schemas import DatasetResponse
from app.core.config import settings
from app.services.profiler import profile_dataset

router = APIRouter(tags=["Data and Datasets"])

@router.get("/datasets", response_model=List[DatasetResponse])
def list_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all datasets uploaded by the current user."""
    datasets = db.query(Dataset).filter(Dataset.owner_id == current_user.id).order_by(Dataset.created_at.desc()).all()
    return datasets

@router.post("/data/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a dataset, profile it, and persist to database."""
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only CSV or Excel files are allowed.")
    
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    try:
        contents = await file.read()
        
        # Save file locally
        with open(file_path, "wb") as f:
            f.write(contents)
            
        # Run profiler
        profile = profile_dataset(contents, file.filename)
        
        # Save to DB
        dataset = Dataset(
            name=file.filename,
            original_filename=file.filename,
            file_path=file_path,
            file_format=ext,
            file_size=len(contents),
            row_count=profile.get("row_count"),
            col_count=profile.get("col_count"),
            column_metadata=profile.get("columns"),
            profiling_summary=profile,
            status=DatasetStatus.COMPLETED,
            owner_id=current_user.id
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        
        return {
            "message": "Processed successfully!", 
            "summary": profile,
            "dataset_id": dataset.id
        }
        
    except Exception as e:
        # Clean up file if it was created
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Data Error: {str(e)}")

@router.delete("/datasets/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a dataset and its associated file."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    # Delete the file
    if os.path.exists(dataset.file_path):
        try:
            os.remove(dataset.file_path)
        except:
            pass
            
    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted successfully"}