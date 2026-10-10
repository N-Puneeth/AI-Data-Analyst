from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, JSON, Text, Float
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
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_format = Column(String(20), nullable=False)  # csv, xlsx, xls
    file_size = Column(Integer, nullable=True)  # bytes
    row_count = Column(Integer, nullable=True)
    col_count = Column(Integer, nullable=True)
    column_metadata = Column(JSON, nullable=True)  # column names, types, stats
    profiling_summary = Column(JSON, nullable=True)  # missing data, duplicates, etc.
    status = Column(Enum(DatasetStatus), default=DatasetStatus.UPLOADING, nullable=False)

    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="datasets")
    sessions = relationship("AnalysisSession", back_populates="dataset", cascade="all, delete-orphan")


class SessionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    CLOSED = "CLOSED"


class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, default="New Analysis")
    status = Column(Enum(SessionStatus), default=SessionStatus.ACTIVE, nullable=False)

    # E2B sandbox tracking
    sandbox_id = Column(String(255), nullable=True)
    sandbox_expires_at = Column(DateTime(timezone=True), nullable=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="sessions")
    dataset = relationship("Dataset", back_populates="sessions")
    messages = relationship("ConversationMessage", back_populates="session", cascade="all, delete-orphan",
                            order_by="ConversationMessage.created_at")
    results = relationship("AnalysisResult", back_populates="session", cascade="all, delete-orphan")


class MessageRole(str, enum.Enum):
    USER = "user"
    AI = "ai"
    SYSTEM = "system"
    ERROR = "error"


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(Enum(MessageRole), nullable=False)
    content = Column(Text, nullable=True)
    generated_code = Column(Text, nullable=True)
    execution_status = Column(String(50), nullable=True)  # success, error, timeout
    error_detail = Column(Text, nullable=True)

    session_id = Column(Integer, ForeignKey("analysis_sessions.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("AnalysisSession", back_populates="messages")
    results = relationship("AnalysisResult", back_populates="message", cascade="all, delete-orphan")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    summary = Column(Text, nullable=True)
    result_metadata = Column(JSON, nullable=True)  # execution stats, timing, etc.

    # Chart references (stored as file paths, not base64 in DB)
    chart_paths = Column(JSON, nullable=True)  # list of file paths

    session_id = Column(Integer, ForeignKey("analysis_sessions.id", ondelete="CASCADE"), nullable=False)
    message_id = Column(Integer, ForeignKey("conversation_messages.id", ondelete="CASCADE"), nullable=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("AnalysisSession", back_populates="results")
    message = relationship("ConversationMessage", back_populates="results")