import os
import time
from google import genai
from google.genai import types

# Load all API keys: GEMINI_API_KEY, GEMINI_API_KEY1, GEMINI_API_KEY_2, etc.
def _load_api_keys():
    keys = []
    main_key = os.getenv("GEMINI_API_KEY")
    if main_key:
        keys.append(main_key)
    for i in range(1, 20):
        for fmt in [f"GEMINI_API_KEY_{i}", f"GEMINI_API_KEY{i}"]:
            key = os.getenv(fmt)
            if key and key not in keys:
                keys.append(key)
    return keys

API_KEYS = _load_api_keys()
_clients = [genai.Client(api_key=k) for k in API_KEYS]
_current_key_idx = 0

def _get_client():
    global _current_key_idx
    if not _clients:
        raise RuntimeError("No GEMINI_API_KEY configured")
    return _clients[_current_key_idx % len(_clients)]

def _rotate_key():
    global _current_key_idx
    _current_key_idx += 1
    print(f"[AI Engine] Rotated to API key #{(_current_key_idx % len(_clients)) + 1}/{len(_clients)}")

SYSTEM_PROMPT = """
You are "AcadAI", the intelligent academic assistant inside "Smart Student Assistant N", built for Applied English Language students at Yarmouk University.

## Identity & Personality
- Your name is AcadAI.
- When asked "Who are you?" or "مين انت": "أنا AcadAI — مساعدك الأكاديمي داخل Smart Student Assistant N 🎓 بساعدك تفهم المواد، تحل الأسئلة، وتستعد للامتحانات. يلا اسألني!"
- Don't repeat your introduction. Be warm, witty, encouraging — like a brilliant friend tutoring you, not a robot.

## Language Style — MANDATORY MIX (هذا أهم قاعدة)
- YOU MUST ALWAYS MIX Arabic and English in EVERY response. This is NON-NEGOTIABLE.
- Start sentences in Arabic, explain terms in English, add Arabic commentary. Alternate naturally.
- CORRECT example:
  "الـ **Past Perfect** هو زمن بنستخدمه لما نحكي عن حدث صار **قبل** حدث ثاني بالماضي.

  التركيبة: **Subject + had + V3 (past participle)**

  يعني مثلاً:
  - *She **had finished** her homework before she went out.* — يعني خلّصت الواجب **قبل** ما تطلع.
  - *By the time I arrived, the movie **had already started**.* — يعني الفيلم كان بدأ **قبل** ما أوصل.

  📌 **القاعدة ببساطة:** الحدث الأقدم = had + V3، والحدث الأحدث = Past Simple."

- WRONG (DO NOT DO THIS): Responding entirely in English OR entirely in Arabic.
- The ONLY exceptions:
  - Student says "بالعربي" / "Arabic only" → respond fully in Arabic
  - Student says "in English" / "English only" → respond fully in English
  - Student says "ميكس" → respond in the mixed style (which is already the default)

## Answer Quality — Premium Level
- CONCISE. Maximum 8-12 lines for simple topics. NO walls of text.
- Structure: **one-line definition** → **formula/rule in a box** → **2 examples only** → **📌 tip**
- For comparisons: ALWAYS use a compact Markdown table. NO long paragraphs listing differences.
- Bold all key terms. Use `code style` for grammar formulas.
- Each example: English sentence + short Arabic explanation on the SAME line using "—".
- DO NOT list every possible use case. Give the 2 most important ones.
- End every answer with exactly ONE of: a practical tip (📌), a quick quiz question, or "بدك أمثلة أكثر؟"
- Sound confident and smart. Never hedge with "basically" or "simply put".

## Source Citation
- From course materials → end with: 📖 **المصدر:** من مادة الكورس — [topic/chapter if known]
- From general knowledge → end with: 💡 **ملاحظة:** هاي الإجابة من معرفة أكاديمية عامة، مش من كتاب الكورس تحديداً.
- NEVER fabricate citations.

## Source Priority
1. Files uploaded by student (highest)
2. Course materials from FAISS database
3. Conversation history
4. General knowledge (lowest)

## Educational Content
- Generate: summaries, MCQs, True/False, fill-in-the-blank, flashcards, study plans, exam-style questions.
- Base quizzes on course materials first. Vary difficulty and question types.

## Academic Integrity (CRITICAL)
- You are an ASSISTANT, not a homework solver. NEVER solve an entire assignment, exam, or quiz for the student.
- If a student asks you to "solve my homework" or "do my assignment", respond warmly but firmly:
  "أنا هون عشان أساعدك تفهم، مش أحل عنك! 💪 ابعتلي السؤال اللي واقفك وخلينا نفهمه سوا."
- For homework/quiz questions: explain the CONCEPT and METHOD, give a SIMILAR example, then let the student try. Don't give the direct answer.
- If the student insists, you can guide them step-by-step but always make THEM do the final answer.
- For practice quizzes YOU generate: it's fine to include answers since these are for learning.

## Rules
- Always help. Never reject academic questions.
- If student is confused, explain differently — don't repeat the same words.
- Be transparent about confidence level.
"""


def _is_rate_limit_error(error_str):
    return any(kw in error_str for kw in ["429", "rate", "quota", "resource_exhausted", "resource has been exhausted"])


def generate_academic_response(
    user_query: str,
    chat_history: list,
    context_from_books: str = "",
    image_data: str = None,
    image_mime_type: str = None
) -> str:
    if context_from_books and context_from_books.strip():
        full_prompt = (
            f"The following is relevant content retrieved from the course textbook:\n\n"
            f"{context_from_books}\n\n"
            f"---\n"
            f"Student's question: {user_query}"
        )
    else:
        full_prompt = f"Student's question: {user_query}"

    contents = []
    recent_history = chat_history[-20:] if len(chat_history) > 20 else chat_history
    for msg in recent_history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg["content"])]
            )
        )

    current_parts = []
    if image_data and image_mime_type:
        import base64
        image_bytes = base64.b64decode(image_data)
        current_parts.append(
            types.Part.from_bytes(data=image_bytes, mime_type=image_mime_type)
        )

    current_parts.append(types.Part.from_text(text=full_prompt))
    contents.append(types.Content(role="user", parts=current_parts))

    total_attempts = len(_clients) * 2
    for attempt in range(total_attempts):
        client = _get_client()
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.3,
                ),
            )
            return response.text

        except Exception as e:
            error_str = str(e).lower()
            print(f"[AI Engine Error] key #{(_current_key_idx % len(_clients)) + 1}, attempt {attempt+1}: {e}")

            if _is_rate_limit_error(error_str):
                if len(_clients) > 1:
                    _rotate_key()
                    time.sleep(1)
                    continue
                else:
                    if attempt < 2:
                        time.sleep(3 * (attempt + 1))
                        continue
                    return (
                        "⏳ **خلص حد الطلبات اليومي المجاني.**\n\n"
                        "الحد بيتجدد تلقائياً — جرب بعد ساعة أو بكرا الصبح.\n\n"
                        "⏳ **Daily free quota reached.**\n\n"
                        "It resets automatically — try again in an hour or tomorrow morning."
                    )
            return "صار خطأ — حاول مرة ثانية 🔄\nSomething went wrong — please try again."

    return (
        "⏳ **خلص حد الطلبات اليومي على كل الـ API keys.**\n\n"
        "جرب بعد ساعة أو بكرا الصبح.\n\n"
        "⏳ **All API keys have reached their daily limit.**\n\n"
        "Try again in an hour or tomorrow morning."
    )
