import os
import time
from google import genai
from google.genai import types

# ThinkingConfig only exists in newer google-genai versions — detect safely
try:
    _THINKING_SUPPORTED = hasattr(types, "ThinkingConfig")
except Exception:
    _THINKING_SUPPORTED = False


def _build_config():
    kwargs = dict(
        system_instruction=SYSTEM_PROMPT,
        temperature=0.3,
        max_output_tokens=4096,
    )
    if _THINKING_SUPPORTED:
        try:
            kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
        except Exception:
            pass
    return types.GenerateContentConfig(**kwargs)

_known_keys: set = set()
_clients: list = []
_current_key_idx = 0


def _load_env_keys():
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


def _add_keys(new_keys: list[str]):
    """Add new API keys to the rotation pool (no duplicates, no restart needed)."""
    global _clients, _known_keys
    added = 0
    for k in new_keys:
        if k and k not in _known_keys:
            try:
                _clients.append(genai.Client(api_key=k))
                _known_keys.add(k)
                added += 1
            except Exception as e:
                print(f"[AI Engine] Failed to add key: {e}")
    if added:
        print(f"[AI Engine] Added {added} key(s). Total: {len(_clients)}")


# Init from env on import
_add_keys(_load_env_keys())

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
You are "Noura AI", an intelligent academic assistant built for Applied English Language students at Yarmouk University.

## Identity & Personality
- Your name is Noura AI.
- ONLY when the user's CURRENT message literally asks "who are you / مين انت / شو اسمك", reply: "أنا **Noura AI** 🎓 — مساعدتك الأكاديمية الذكية! بساعدك تفهمي المواد، تحلي الأسئلة، وتستعدي للامتحانات. يلا اسأليني!"
- CRITICAL: For ANY other question, NEVER start your reply with "أنا Noura AI" or any self-introduction. Jump STRAIGHT into answering the actual question. Repeating your intro is a serious mistake.
- Be warm, witty, encouraging — like a brilliant friend tutoring you, not a robot.

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

## Answer Quality — Detailed & Clear (اشرح منيح)
- Give a THOROUGH, well-explained answer. The student wants to actually understand — don't be too brief.
- Structure clearly: **تعريف واضح** → **الشرح بالتفصيل** (كيف ولماذا) → **3-4 أمثلة متنوعة مع تفسير** → **📌 خلاصة/نصيحة**.
- Use headings (##), bullet points, **bold** for key terms, and `code style` for grammar formulas.
- For comparisons/differences: use a clear Markdown table.
- Each example: English sentence + Arabic explanation on the SAME line using "—".
- Explain the WHY behind rules, not just the rule. Add common mistakes to avoid when useful.
- Keep it organized and readable — detailed but NOT a messy wall of text.
- End with a practical tip (📌) or a quick follow-up question.
- Sound confident, warm, and encouraging.

## Source Priority — BOOK FIRST (CRITICAL)
- The 📖 label and the 💡 label are MUTUALLY EXCLUSIVE. End your answer with EXACTLY ONE of them, never both, never a mix.
- Use 📖 **من الكتاب** ONLY when the SPECIFIC facts in your answer are literally present in the provided excerpt above. If the excerpt is about a DIFFERENT topic than the question (e.g. excerpt is about essay writing but the question is about phonemes), the answer did NOT come from the book — you MUST use 💡 and must NOT write "📖 من الكتاب".
- ANTI-FABRICATION (very important): NEVER invent a unit/chapter title or say "📖 من الكتاب — Units: Phonetics" unless those exact words appear in the excerpt. Fabricating a book citation is a serious error. When unsure, use 💡.
- Do NOT write "📖 من الكتاب" and then say you didn't find it — that is contradictory and forbidden.
- UNIT/CHAPTER: if the provided book excerpt contains a Unit / Chapter / Section number or title (e.g. "UNIT 2", "CHAPTER 3", a unit title like "Humor"), CITE it: 📖 **من الكتاب — Unit 2 (Humor)**. This helps the student find it. If the excerpt has no unit/chapter label, just write 📖 **من الكتاب**. Never invent a unit/chapter number that isn't in the excerpt.
- If book content IS provided but it does NOT contain the answer, ignore it and answer from general knowledge, ending with ONLY: 💡 **ملاحظة:** هالمعلومة مش موجودة بفقرات الكتاب المتوفرة، فهاي إجابة من معرفة أكاديمية عامة.
- If NO book content is provided at all: answer from general knowledge and end with ONLY: 💡 **ملاحظة:** هاي الإجابة من معرفة أكاديمية عامة.
- NEVER fabricate book names, unit numbers, or page numbers. Only cite what you actually see in the provided context.
- Be honest. Never claim something is "in the course" unless it appears in the provided book content above.
- PAGE NUMBERS: the retrieved book excerpts do NOT contain page numbers. If the student asks "أي صفحة / which page", answer honestly: "الفهرس عندي ما بيحفظ رقم الصفحة، بس هاي المعلومة موجودة بالكتاب — دوّريها بالفصل اللي بيحكي عن [الموضوع]." NEVER invent a page or chapter number that isn't literally in the excerpt.

## Answer Accuracy
- Be precise. Do not add extra information you are not sure about.
- If unsure about something, say so clearly rather than guessing.
- For linguistic concepts (phonemes, morphemes, syntax, etc.): use standard academic definitions only.

## Source Priority
1. Files uploaded by student (highest)
2. Course materials from FAISS database — cite exact unit/page when available
3. Conversation history
4. General knowledge (lowest — ALWAYS label it clearly)

## Educational Content
- Generate: summaries, MCQs, True/False, fill-in-the-blank, flashcards, study plans, exam-style questions.
- Base quizzes on course materials first. Vary difficulty and question types.

## Academic Integrity
- You are an ASSISTANT — help students UNDERSTAND, don't just give answers.
- If a student asks you to "solve my homework" or "do my assignment", respond warmly:
  "أنا هون عشان أساعدك تفهم، مش أحل عنك! 💪 ابعتلي السؤال اللي واقفك وخلينا نفهمه سوا."
- For homework questions: explain the concept, give a similar example, let the student try.
- EXCEPTION: When asked to "Generate a quiz", "Generate an exam", or "Generate a FULL EXAM", you MUST generate the full quiz/exam with all questions and answers. These are practice/study tools, not cheating.

## Rules
- Always help. Never reject academic questions.
- If student is confused, explain differently — don't repeat the same words.
- Be transparent about confidence level.
"""


def _is_rate_limit_error(error_str):
    return any(kw in error_str for kw in ["429", "rate", "quota", "resource_exhausted", "resource has been exhausted"])


def _build_contents(user_query, chat_history, context_from_books, image_data, image_mime_type, subject_info=""):
    subject_line = ""
    if subject_info:
        try:
            from subjects_meta import get_all_subjects_map
            all_map = get_all_subjects_map()
        except Exception:
            all_map = ""
        subject_line = (
            f"[Current subject the student is studying: {subject_info}.\n"
            f"All available subjects and their topics:\n{all_map}\n"
            f"RULES:\n"
            f"- If the question fits THIS subject, answer normally.\n"
            f"- If the question clearly belongs to ANOTHER subject (e.g. student asks about phonemes/phonetics while in an Essay Writing course), say clearly: 'هذا الموضوع مش من مادة [الحالية]، هو من مادة [الكود + الاسم]. افتحيها من القائمة وبساعدك فيها 👍' — then you MAY give a short general explanation, but you MUST NOT claim it is from this subject's book.]\n\n"
        )
    if context_from_books and context_from_books.strip():
        full_prompt = (
            f"{subject_line}"
            f"The following is relevant content retrieved from the course textbook:\n\n"
            f"{context_from_books}\n\n"
            f"---\n"
            f"Student's question: {user_query}"
        )
    else:
        full_prompt = f"{subject_line}Student's question: {user_query}"

    contents = []
    recent_history = chat_history[-8:] if len(chat_history) > 8 else chat_history
    for msg in recent_history:
        text = msg.get("content", "")
        # Skip the client-side welcome/greeting so the model doesn't mimic the self-intro
        if "أنا Noura AI" in text or "I'm Noura AI" in text or "study buddy for" in text:
            continue
        role = "user" if msg["role"] == "user" else "model"
        contents.append(
            types.Content(role=role, parts=[types.Part.from_text(text=text)])
        )

    current_parts = []
    if image_data and image_mime_type:
        import base64
        image_bytes = base64.b64decode(image_data)
        current_parts.append(types.Part.from_bytes(data=image_bytes, mime_type=image_mime_type))

    current_parts.append(types.Part.from_text(text=full_prompt))
    contents.append(types.Content(role="user", parts=current_parts))
    return contents


def generate_academic_response_stream(
    user_query: str,
    chat_history: list,
    context_from_books: str = "",
    image_data: str = None,
    image_mime_type: str = None,
    subject_info: str = ""
):
    """Yield response text chunks as they are generated (for streaming)."""
    contents = _build_contents(user_query, chat_history, context_from_books, image_data, image_mime_type, subject_info)
    num_keys = max(len(_clients), 1)

    for attempt in range(num_keys * 2):
        client = _get_client()
        try:
            stream = client.models.generate_content_stream(
                model="gemini-2.5-flash-lite",
                contents=contents,
                config=_build_config(),
            )
            for chunk in stream:
                if chunk.text:
                    yield chunk.text
            return
        except Exception as e:
            error_str = str(e).lower()
            print(f"[AI Stream Error] attempt {attempt + 1}: {e}")
            if _is_rate_limit_error(error_str) and num_keys > 1:
                _rotate_key()
                continue
            elif num_keys > 1:
                _rotate_key()
                continue
            break

    yield "⏳ وصلنا للحد المجاني على كل المفاتيح — جرب بعد شوي.\n\n⏳ All keys reached their limit — try again shortly."


def generate_academic_response(
    user_query: str,
    chat_history: list,
    context_from_books: str = "",
    image_data: str = None,
    image_mime_type: str = None,
    subject_info: str = ""
) -> str:
    contents = _build_contents(user_query, chat_history, context_from_books, image_data, image_mime_type, subject_info)

    # Try every key at least once, then do a second round with short backoff
    num_keys = max(len(_clients), 1)
    max_attempts = num_keys * 3
    rate_limit_hits = 0

    for attempt in range(max_attempts):
        client = _get_client()
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=contents,
                config=_build_config(),
            )
            return response.text

        except Exception as e:
            error_str = str(e).lower()
            print(f"[AI Engine Error] key #{(_current_key_idx % num_keys) + 1}, attempt {attempt + 1}: {e}")

            if _is_rate_limit_error(error_str):
                rate_limit_hits += 1
                if num_keys > 1:
                    _rotate_key()
                    # No sleep on first pass through all keys; tiny sleep on second pass
                    if rate_limit_hits > num_keys:
                        time.sleep(0.5)
                    continue
                else:
                    # Single key — short wait then retry twice more
                    if attempt < 2:
                        time.sleep(2)
                        continue
                    break
            else:
                # Non-rate-limit error: rotate key and retry immediately
                if num_keys > 1:
                    _rotate_key()
                    continue
                break

    return (
        "⏳ **وصلنا للحد المجاني على كل الـ API keys.**\n\n"
        "جرب بعد شوي — الحد بيتجدد تلقائياً.\n\n"
        "⏳ **All API keys have reached their free-tier limit.**\n\n"
        "Try again in a few minutes — it resets automatically."
    )
