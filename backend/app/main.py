from fastapi import FastAPI

app = FastAPI(
    title="AI Data Analyst Platform",
    description="AI-powered analytics platform",
    version="1.0.0"
)


@app.get("/")
async def root():
    return {
        "message": "AI Data Analyst Platform Backend Running"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy"
    }