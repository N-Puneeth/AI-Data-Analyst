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