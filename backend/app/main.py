from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import data, ai , agent, sessions
from app.auth.routers import router as auth_router
from app.core.database import Base, engine

# 👇 THIS LINE BUILDS THE SQLITE DATABASE FILE 👇
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DataPilot AI API")

origins = [
    "http://localhost:5173",
    "https://datapilot-app.onrender.com"  # No trailing slash at the end!
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # <-- Pass the list here
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