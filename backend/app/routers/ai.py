from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

model = None
if api_key:
    genai.configure(api_key=api_key)
    try:
        print("🔄 Scanning for available AI models...")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                model_name = m.name.replace("models/", "")
                if "vision" not in model_name:
                    try:
                        temp_model = genai.GenerativeModel(model_name)
                        temp_model.generate_content("test")
                        model = temp_model
                        print(f"✅ AI Connected Successfully: {model_name}")
                        break 
                    except Exception:
                        continue
    except Exception as e:
        print(f"⚠️ Failed to scan models: {e}")

router = APIRouter(prefix="/ai", tags=["AI Analysis"])

class ChatRequest(BaseModel):
    prompt: str
    context: dict
    history: list = []

@router.post("/chat")
async def chat_with_data(req: ChatRequest):
    if not api_key or not model: 
        raise HTTPException(status_code=500, detail="API Key missing or model failed to load.")

    # NATURAL PERSONA PROMPT: No rigid templates, just elite instructions.
    system_prompt = f"""
    You are DataPilot AI, an elite enterprise data scientist. 
    Analyze this dataset summary: {req.context}
    
    Provide a direct, highly professional analytical report in clean Markdown format.
    Use headers (###), bullet points, and bold text for key metrics.
    Cover the dataset overview, key statistical findings, missing data, and the main actionable takeaway.
    
    CRITICAL RULE: Output ONLY the final professional report. DO NOT output your internal thoughts, constraints, meta-data, or preamble. Do not repeat the prompt.
    """

    try:
        chat = model.start_chat(history=[])
        chat.send_message(system_prompt)
        response = chat.send_message(req.prompt)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {str(e)}")