from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
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

# تحديث الـ Schema لتستقبل المتغيرات بشكل صحيح وبدون أخطاء
class ChatRequest(BaseModel):
    subject_code: str
    message: Optional[str] = None  # يدعم الإرسال المباشر أو عبر الـ history
    history: List[Dict[str, str]]

@app.post("/ask")
async def ask_assistant(request: ChatRequest):
    if not request.history and not request.message:
        raise HTTPException(status_code=400, detail="Chat history or message cannot be empty.")
    
    try:
        # 1. استخراج سؤال الطالب (سواء من الرسالة المباشرة أو آخر رسالة بالتاريخ)
        if request.message:
            last_user_message = request.message
            previous_history = request.history
        else:
            last_user_message = request.history[-1]["content"]
            previous_history = request.history[:-1]
        
        # 2. تحديد مسار كتب المادة بناءً على كود المادة القادم من الفرونت اند
        # هنا الـ AI Engine سيقرأ مجلد المواد المخصص، مثلاً: ./subjects/AEL 101/
        subject_folder = f"./subjects/{request.subject_code}/"
        print(f"Loading books context for subject: {request.subject_code} from {subject_folder}")
        
        # 3. استدعاء Gemini لتوليد الإجابة الأكاديمية بناءً على كتب المادة
        ai_answer = generate_academic_response(
            user_query=last_user_message,
            chat_history=previous_history,
            context_from_books=subject_folder # يمرر المسار لمحرك البحث FAISS/الكتب داخل ai_engine
        )
        
        return {"answer": ai_answer, "subject_code": request.subject_code}
        
    except Exception as e:
        print(f"Error in /ask endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))