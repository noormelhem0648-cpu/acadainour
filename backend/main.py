from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from ai_engine import generate_academic_response 

app = FastAPI(title="Smart Student Assistant N Backend")

# تفعيل الـ CORS لكي يسمح لموقع Vercel بالاتصال بـ Render بدون حظر
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # يسمح بجميع النطاقات لتجنب مشاكل الاتصال
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    subject_code: str
    history: List[Dict[str, str]]

@app.post("/ask")
async def ask_assistant(request: ChatRequest):
    if not request.history:
        raise HTTPException(status_code=400, detail="Chat history cannot be empty.")
    
    try:
        # 1. استخراج آخر سؤال أرسله الطالب
        last_user_message = request.history[-1]["content"]
        
        # 2. تجهيز مصفوفة التاريخ السابق (كل الرسائل ما عدا الأخيرة)
        previous_history = request.history[:-1]
        
        # 3. استدعاء Gemini لتوليد الإجابة
        ai_answer = generate_academic_response(
            user_query=last_user_message,
            chat_history=previous_history,
            context_from_books="" # يمكنك ربط محرك الـ FAISS هنا لاحقاً
        )
        
        return {"answer": ai_answer}
        
    except Exception as e:
        print(f"Error in /ask endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))