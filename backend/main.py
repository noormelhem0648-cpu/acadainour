from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
# استيراد الدالة المحدثة من ai_engine
from ai_engine import generate_academic_response 

app = FastAPI(title="Smart Student Assistant N Backend")

# تعريف الـ Schema الجديدة لاستقبال البيانات من الـ Frontend المحدث
class ChatRequest(BaseModel):
    subject_code: str
    history: List[Dict[str, str]] # يستقبل مصفوفة تحتوي على [{"role": "user", "content": "..."}, ...]

@app.post("/ask")
async def ask_assistant(request: ChatRequest):
    if not request.history:
        raise HTTPException(status_code=400, detail="Chat history cannot be empty.")
    
    # 1. استخراج آخر سؤال قام الطالب بكتابته
    last_user_message = request.history[-1]["content"]
    
    # 2. (خطوة اختيارية تبعاً لكودك الحالي): هنا يتم استدعاء الـ FAISS Index للبحث في كتب المادة
    # context_from_books = search_faiss_books(request.subject_code, last_user_message)
    context_from_books = "" # متغير مؤقت لحين ربط محرك الـ FAISS الخاص بكِ
    
    # 3. إرسال السؤال، التاريخ الكامل، وسياق الكتب إلى Gemini
    ai_answer = generate_academic_response(
        user_query=last_user_message,
        chat_history=request.history[:-1], # نمرر التاريخ السابق فقط بدون السؤال الأخير لأنه مدمج بالفكرة
        context_from_books=context_from_books
    )
    
    # 4. إرجاع الإجابة المنسقة للـ Frontend ليتم عرضها عبر الـ Markdown
    return {"answer": ai_answer}