from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from e2b_code_interpreter import Sandbox
import google.generativeai as genai
import os
import re
import textwrap
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

model = None
if api_key:
    genai.configure(api_key=api_key)
    try:
        print("🔄 Scanning for available AI models for the Agent...")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                model_name = m.name.replace("models/", "")
                if "vision" not in model_name:
                    try:
                        temp_model = genai.GenerativeModel(model_name)
                        temp_model.generate_content("test")
                        model = temp_model
                        print(f"✅ Agent AI Connected Successfully: {model_name}")
                        break 
                    except Exception:
                        continue
    except Exception as e:
        print(f"⚠️ Failed to scan models: {e}")

router = APIRouter(prefix="/agent", tags=["AI Code Agent"])

# GLOBAL SESSION STATE: This keeps the sandbox and AI memory alive between messages!
active_sessions = {}

@router.post("/analyze")
async def analyze_with_agent(
    prompt: str = Form(...),
    file: Optional[UploadFile] = File(None),
    session_id: str = Form("default_session")
):
    e2b_key = os.getenv("E2B_API_KEY")
    if not api_key or not e2b_key:
        raise HTTPException(status_code=500, detail="Missing API Keys in .env file.")
    if not model:
        raise HTTPException(status_code=500, detail="No compatible AI models found.")
        
    try:
        # 1. Check if this is a new session or an existing one
        if session_id not in active_sessions:
            print(f"🚀 [Session: {session_id}] Booting new Persistent Sandbox...")
            active_sessions[session_id] = {
                "sandbox": Sandbox.create(timeout=3600), # Stays alive for 1 hour
                "chat": model.start_chat(history=[]),    # Keeps conversational memory
                "remote_path": None
            }
            
        session = active_sessions[session_id]
        sandbox = session["sandbox"]
        chat = session["chat"]

        # 2. Upload file ONLY if a new file is provided
        if file:
            file_bytes = await file.read()
            filename = file.filename
            remote_path = f"/home/user/{filename}"
            sandbox.files.write(remote_path, file_bytes)
            session["remote_path"] = remote_path
            print(f"📁 [Session: {session_id}] Uploaded {filename} to Sandbox.")

        remote_path = session["remote_path"]
        if not remote_path:
             raise HTTPException(status_code=400, detail="No dataset uploaded to this session yet.")

        # 3. Prompt the AI (Now using chat.send_message so it remembers history!)
        system_prompt = textwrap.dedent(f"""
        You are an elite Python Data Scientist. 
        Dataset path: '{remote_path}'
        User Request: {prompt}
        
        Write a complete, working Python script to analyze this data or answer the user's request.
        
        CRITICAL PYTHON RULES:
        1. Import pandas as pd, matplotlib.pyplot as plt, and seaborn as sns. Set theme to 'darkgrid'.
        2. Calculate metrics and explicitly use print() statements to output text insights.
        3. If charts are requested or relevant, use plt.show() to output them.
        4. Output ALL code in ONE SINGLE Markdown block (```python ... ```).
        5. NO RANDOM INDENTATION: Top-level code MUST start at the absolute beginning of the line (0 spaces).
        6. Return strictly Python code. No conversational text.
        """)
        
        print("🧠 Generating Python Code with Gemini (with Chat History)...")
        ai_response = chat.send_message(system_prompt)
        raw_text = ai_response.text
        
        # Extract and format code block
        code_matches = re.findall(r'```(?:python)?(.*?)```', raw_text, re.DOTALL | re.IGNORECASE)
        if code_matches:
            extracted_code = "\n".join([textwrap.dedent(block).strip() for block in code_matches])
        else:
            extracted_code = textwrap.dedent(raw_text).strip()
            
        python_code = extracted_code
        
        print("⚙️ Executing AI Code in Persistent Sandbox...")
        execution = sandbox.run_code(python_code)
        
        if execution.error:
            raise Exception(f"{execution.error.name} - {execution.error.value}")
            
        print("🎨 Extracting Visualizations & Logs...")
        printed_logs = "\n".join(execution.logs.stdout) if execution.logs.stdout else ""
        
        base64_images = []
        for result in execution.results:
            if hasattr(result, 'png') and result.png:
                base64_images.append(result.png)
            elif hasattr(result, 'jpeg') and result.jpeg:
                base64_images.append(result.jpeg)
            elif hasattr(result, 'text') and result.text:
                printed_logs += f"\n{result.text}"
                
        final_insights = printed_logs.strip()
        if not final_insights:
            final_insights = "Execution finished successfully, but no text output was printed."
            
        print("✅ Execution Complete!")
        return {
            "message": "Analysis executed successfully!",
            "insights": final_insights,
            "ai_code_written": python_code,
            "images": base64_images
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Code Error: {str(e)}")