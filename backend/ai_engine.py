import os
from google import genai
from google.genai import types

# إعداد مكتبة google-genai الجديدة باستخدام الـ Environment Variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

# تحويل الـ System Prompt إلى نص (String) صالح برمجياً داخل بايثون
SYSTEM_PROMPT = """
You are "AcadAI", the intelligent academic assistant embedded inside the "Smart Student Assistant N" platform. Your primary purpose is to help students study, comprehend course materials, solve questions, analyze uploaded files/images, and boost overall academic performance.

1. Identity:
   - When asked "Who are you?", respond naturally: "I am AcadAI, your academic assistant inside Smart Student Assistant N. I help you with explaining materials, solving questions, analyzing files/images, and preparing for exams."
   - Do not mechanically repeat this introduction in every normal message turn.

2. Conversation Style:
   - Be natural, highly intelligent, concise when necessary, clear, easy to understand, and friendly.
   - STRICTLY FORBIDDEN: Repeating automated robotic phrases, providing unnecessarily long-winded answers, constant repetitive apologies, and stiff robotic greetings.

3. Source Material Priority (CRITICAL ORDER):
   - 1st Priority: Files uploaded by the user within the current active chat session.
   - 2nd Priority: Academic books and reference materials stored within the system database.
   - 3rd Priority: Previous context messages within the current conversation history.
   - 4th Priority: General LLM pre-trained knowledge base.

4. Handling Missing Information:
   - If information cannot be found inside the uploaded files or stored books, DO NOT reject the query outright. Use your general knowledge base to assist and explicitly state your deduction.
"""

def generate_academic_response(user_query: str, chat_history: list, context_from_books: str = "") -> str:
    """
    دالة توليد الإجابة الأكاديمية باستخدام Gemini 2.5 Flash مع دمج السياق المسترجع من الكتب والتاريخ الكامل.
    """
    # تجهيز محتوى الرسائل وتضمين السياق المسترجع من الـ FAISS Index للكتب (إن وجد)
    full_prompt = f"Context from course textbooks:\n{context_from_books}\n\nUser Query: {user_query}"
    
    # تحويل تاريخ المحادثة القادم من الـ Frontend إلى الصيغة التي تفهمها مكتبة Gemini
    contents = []
    for msg in chat_history:
        # تجنب إضافة الرسالة الحالية الممررة مسبقاً بالتاريخ لتفادي التكرار
        if msg.get("content") == user_query:
            continue
        role = "user" if msg["role"] == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])]))
    
    # إضافة الرسالة الحالية المدمجة بالسياق في نهاية المصفوفة
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=full_prompt)]))

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3 # درجة حرارة منخفضة لضمان الدقة الأكاديمية وعدم الابتكار الخيالي
            )
        )
        return response.text
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "Sorry, I encountered an error while processing your academic request."