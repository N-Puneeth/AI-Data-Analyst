from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload
from typing import Optional
import os
import uuid
from e2b_code_interpreter import Sandbox
import google.generativeai as genai
import textwrap

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.auth.models import User
from app.datasets.models import AnalysisSession, Dataset, DatasetStatus, ConversationMessage, MessageRole, AnalysisResult
from app.services.profiler import profile_dataset
from app.services.code_validator import validate_python_code

router = APIRouter(prefix="/agent", tags=["AI Code Agent"])

# Configure Gemini
api_key = settings.GEMINI_API_KEY
model = None
if api_key:
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel("gemini-1.5-pro-latest")
    except Exception as e:
        print(f"⚠️ Failed to init Gemini model: {e}")

@router.post("/analyze")
async def analyze_with_agent(
    prompt: str = Form(...),
    session_id: int = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    e2b_key = settings.E2B_API_KEY
    if not api_key or not e2b_key:
        raise HTTPException(status_code=500, detail="Missing API Keys in .env file.")
    if not model:
        raise HTTPException(status_code=500, detail="AI Model not configured.")
        
    # Get session
    session_record = db.query(AnalysisSession).filter(
        AnalysisSession.id == session_id,
        AnalysisSession.user_id == current_user.id
    ).options(selectinload(AnalysisSession.messages)).first()
    
    if not session_record:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    try:
        # 1. Connect to or create E2B Sandbox
        sandbox = None
        if session_record.sandbox_id:
            try:
                sandbox = Sandbox.connect(session_record.sandbox_id)
            except Exception:
                sandbox = None
                
        if not sandbox:
            print(f"🚀 [Session: {session_id}] Booting new Persistent Sandbox...")
            sandbox = Sandbox.create(timeout=3600)
            session_record.sandbox_id = sandbox.id
            db.commit()

        # 2. File upload logic
        dataset = None
        if file:
            # Uploading new dataset
            ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
            unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            local_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
            
            file_bytes = await file.read()
            with open(local_path, "wb") as f:
                f.write(file_bytes)
                
            # Profile dataset
            profile = profile_dataset(file_bytes, file.filename)
            
            # Create Dataset record
            dataset = Dataset(
                name=file.filename,
                original_filename=file.filename,
                file_path=local_path,
                file_format=ext,
                file_size=len(file_bytes),
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
            
            # Link to session
            session_record.dataset_id = dataset.id
            db.commit()
            
            # Upload to sandbox
            remote_path = f"/home/user/{file.filename}"
            sandbox.files.write(remote_path, file_bytes)
            
        else:
            if session_record.dataset_id:
                dataset = db.query(Dataset).filter(Dataset.id == session_record.dataset_id).first()
                if not dataset:
                    raise HTTPException(status_code=400, detail="Associated dataset not found.")
                
                remote_path = f"/home/user/{dataset.original_filename}"
                # Ensure it exists in sandbox
                try:
                    sandbox.files.read(remote_path)
                except Exception:
                    # Upload it again if sandbox was restarted
                    with open(dataset.file_path, "rb") as f:
                        sandbox.files.write(remote_path, f.read())
            else:
                 raise HTTPException(status_code=400, detail="No dataset uploaded to this session yet.")

        # 3. Construct prompt with context
        history = [
            {"role": "user" if m.role == MessageRole.USER else "model", "parts": [m.content]}
            for m in session_record.messages if m.role in (MessageRole.USER, MessageRole.AI)
        ]
        
        # Prepare system instructions based on dataset profile
        profile_info = ""
        if dataset and dataset.profiling_summary:
             cols = [c["name"] for c in dataset.profiling_summary.get("columns", [])]
             profile_info = f"Columns available: {cols}\nRow count: {dataset.row_count}\n"
             
        system_prompt = textwrap.dedent(f"""
        You are an elite Python Data Scientist. 
        Dataset path: '{remote_path}'
        Dataset Profile: {profile_info}
        User Request: {prompt}
        
        Write a complete, working Python script to analyze this data or answer the user's request.
        
        CRITICAL PYTHON RULES:
        1. Import pandas as pd, matplotlib.pyplot as plt, and seaborn as sns. Set theme to 'darkgrid'.
        2. Calculate metrics and explicitly use print() statements to output text insights.
        3. If charts are requested or relevant, use plt.show() to output them.
        4. Output ALL code in ONE SINGLE Markdown block (```python ... ```).
        5. NO RANDOM INDENTATION: Top-level code MUST start at the absolute beginning of the line (0 spaces).
        6. Return strictly Python code. No conversational text.
        """)
        
        # Create user message record
        user_msg = ConversationMessage(
            role=MessageRole.USER,
            content=prompt,
            session_id=session_id
        )
        db.add(user_msg)
        db.commit()

        print("🧠 Generating Python Code with Gemini...")
        chat = model.start_chat(history=history)
        ai_response = chat.send_message(system_prompt)
        raw_text = ai_response.text
        
        # Extract and validate code block
        from app.services.code_validator import extract_code_from_response
        extracted_code = extract_code_from_response(raw_text)
        
        # Validate the code
        python_code = validate_python_code(extracted_code, dataset_path=remote_path)
        
        print("⚙️ Executing AI Code in Persistent Sandbox...")
        execution = sandbox.run_code(python_code)
        
        if execution.error:
            error_msg = f"{execution.error.name} - {execution.error.value}"
            # Save error message
            err_msg = ConversationMessage(
                role=MessageRole.ERROR,
                content=f"Error executing code: {error_msg}",
                generated_code=python_code,
                execution_status="error",
                error_detail=error_msg,
                session_id=session_id
            )
            db.add(err_msg)
            db.commit()
            raise Exception(error_msg)
            
        print("🎨 Extracting Visualizations & Logs...")
        printed_logs = "\n".join(execution.logs.stdout) if execution.logs.stdout else ""
        
        base64_images = []
        for result in execution.results:
            if hasattr(result, 'png') and result.png:
                base64_images.append(result.png)
            elif hasattr(result, 'jpeg') and result.jpeg:
                base64_images.append(result.jpeg)
            elif hasattr(result, 'text') and result.text:
                printed_logs += f"\n{result.text}"
                
        final_insights = printed_logs.strip()
        if not final_insights:
            final_insights = "Execution finished successfully, but no text output was printed."
            
        # Create AI message record
        ai_msg = ConversationMessage(
            role=MessageRole.AI,
            content=final_insights,
            generated_code=python_code,
            execution_status="success",
            session_id=session_id
        )
        db.add(ai_msg)
        db.commit()
        db.refresh(ai_msg)
        
        # Create AnalysisResult record
        result_record = AnalysisResult(
            summary=final_insights,
            session_id=session_id,
            message_id=ai_msg.id,
            dataset_id=dataset.id if dataset else None
        )
        db.add(result_record)
        db.commit()

        print("✅ Execution Complete!")
        return {
            "message": "Analysis executed successfully!",
            "insights": final_insights,
            "ai_code_written": python_code,
            "images": base64_images,
            "session_id": session_id
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Code Error: {str(e)}")