from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.auth.models import User
from app.datasets.models import AnalysisSession
from app.datasets.schemas import SessionCreate, SessionUpdate, SessionResponse

router = APIRouter()

@router.get("", response_model=List[SessionResponse])
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all analysis sessions for the current user."""
    sessions = (
        db.query(AnalysisSession)
        .filter(AnalysisSession.user_id == current_user.id)
        .options(selectinload(AnalysisSession.messages))
        .order_by(AnalysisSession.created_at.desc())
        .all()
    )
    return sessions

@router.post("", response_model=SessionResponse)
def create_session(
    session_in: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new analysis session."""
    session = AnalysisSession(
        title=session_in.title or "New Analysis",
        user_id=current_user.id
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an analysis session."""
    session = (
        db.query(AnalysisSession)
        .filter(AnalysisSession.id == session_id, AnalysisSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    return None

@router.put("/{session_id}", response_model=SessionResponse)
def update_session(
    session_id: int,
    session_in: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an analysis session's title."""
    session = (
        db.query(AnalysisSession)
        .filter(AnalysisSession.id == session_id, AnalysisSession.user_id == current_user.id)
        .options(selectinload(AnalysisSession.messages))
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.title = session_in.title
    db.commit()
    db.refresh(session)
    return session

