# Import all models here so Alembic can discover them
from app.core.database import Base  # noqa: F401
from app.auth.models import User  # noqa: F401
from app.datasets.models import (  # noqa: F401
    Dataset,
    AnalysisSession,
    ConversationMessage,
    AnalysisResult,
)