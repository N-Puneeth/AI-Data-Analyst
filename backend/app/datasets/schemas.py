from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any
from datetime import datetime
from app.datasets.models import DatasetStatus, SessionStatus, MessageRole

class DatasetBase(BaseModel):
    name: str
    original_filename: str

class DatasetResponse(DatasetBase):
    id: int
    file_format: str
    file_size: Optional[int]
    row_count: Optional[int]
    col_count: Optional[int]
    status: DatasetStatus
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ConversationMessageResponse(BaseModel):
    id: int
    role: MessageRole
    content: Optional[str]
    generated_code: Optional[str]
    execution_status: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SessionCreate(BaseModel):
    title: Optional[str] = "New Analysis"

class SessionUpdate(BaseModel):
    title: str

class SessionResponse(BaseModel):
    id: int
    title: str
    status: SessionStatus
    dataset_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    messages: List[ConversationMessageResponse] = []

    model_config = ConfigDict(from_attributes=True)

