from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import data, ai , agent, sessions
from app.auth.routers import router as auth_router
from app.core.database import Base, engine

from app.core.config import settings

# Programmatically run Alembic migrations on startup
import os
from alembic import command
from alembic.config import Config

alembic_cfg = Config(os.path.join(os.path.dirname(os.path.dirname(__file__)), "alembic.ini"))
alembic_cfg.set_main_option("script_location", os.path.join(os.path.dirname(os.path.dirname(__file__)), "alembic"))
# Set the SQLAlchemy URL in the alembic config so it uses the correct DB (Postgres on Render, or SQLite locally)
alembic_cfg.set_main_option("sqlalchemy.url", settings.SQLALCHEMY_DATABASE_URI)

try:
    command.upgrade(alembic_cfg, "head")
except Exception as e:
    print(f"Warning: Alembic upgrade failed: {e}")
    # Fallback: Safely attempt to add missing columns to existing tables if Alembic crashed
    from sqlalchemy import text
    patch_queries = [
        "ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255) DEFAULT ''",
        "ALTER TABLE users ADD COLUMN name VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE",
        "ALTER TABLE users ADD COLUMN updated_at TIMESTAMP",
        "ALTER TABLE analysis_sessions ADD COLUMN sandbox_id VARCHAR(255)",
        "ALTER TABLE analysis_sessions ADD COLUMN sandbox_expires_at TIMESTAMP",
        "ALTER TABLE datasets ADD COLUMN original_filename VARCHAR(255) DEFAULT 'dataset'",
        "ALTER TABLE datasets ADD COLUMN file_format VARCHAR(20) DEFAULT 'csv'",
        "ALTER TABLE datasets ADD COLUMN file_size INTEGER",
        "ALTER TABLE datasets ADD COLUMN row_count INTEGER",
        "ALTER TABLE datasets ADD COLUMN col_count INTEGER",
    ]
    for query in patch_queries:
        try:
            with engine.begin() as conn:
                conn.execute(text(query))
        except Exception:
            pass

# Fallback to create_all for missing tables (e.g., initial local dev)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DataPilot AI API")

origins = settings.cors_origin_list + [
    "https://datapilot-app.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# We add prefix="/api" so the backend matches the frontend exactly
app.include_router(auth_router)
app.include_router(data.router)
app.include_router(sessions.router, prefix="/sessions")
app.include_router(ai.router)
app.include_router(agent.router)

@app.get("/")
def read_root():
    return {"status": "DataPilot API is running smoothly!"}