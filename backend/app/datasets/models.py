from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class DatasetStatus(str, enum.Enum):
    UPLOADING = "UPLOADING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)           # User-friendly name
    file_path = Column(String, nullable=False)      # Path in S3 or local storage
    status = Column(Enum(DatasetStatus), default=DatasetStatus.UPLOADING)
    
    # JSONB allows us to store flexible, queryable JSON data (Pandas stats, chart config)
    metadata_summary = Column(JSONB, nullable=True) 
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to the user
    owner = relationship("User", back_populates="datasets")