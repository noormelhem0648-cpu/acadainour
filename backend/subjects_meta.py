# Metadata for each subject so the AI knows what course it is helping with.
# Derived from the actual textbook used in each subject folder.
# name = the course topic; book = the textbook title.

SUBJECT_META = {
    "AEL101": {"name": "English Grammar", "book": "English Grammar (basics: tenses, sentence structure)"},
    "AEL103": {"name": "Vocabulary Building", "book": "English Vocabulary in Use (Upper-Intermediate)"},
    "AEL105": {"name": "Listening & Speaking", "book": "NorthStar 2 (Listening & Speaking)"},
    "AEL109": {"name": "Academic Writing (Paragraphs)", "book": "Longman Academic Writing Series 2"},
    "AEL110": {"name": "", "book": ""},
    "AEL209": {"name": "", "book": ""},
    "AEL211": {"name": "Advanced Listening, Speaking & Reading", "book": "NorthStar 4"},
    "AEL301": {"name": "Advanced English Grammar", "book": "Longman Student Grammar Workbook"},
    "AEL302": {"name": "Collocations & Idioms", "book": "Collocations in Use / English Idioms in Use"},
    "AEL307": {"name": "Introduction to Linguistics", "book": "Introduction to English Linguistics"},
    "AEL308": {"name": "Syntax", "book": "Syntax: An Introduction"},
    "AEL330": {"name": "Language & Culture", "book": "Language & Culture"},
    "AEL416": {"name": "Language & Society (Sociolinguistics)", "book": "Introducing Language and Society"},
    "AEL422": {"name": "Public Speaking", "book": "The Art of Public Speaking"},
}


def get_subject_info(subject_code: str) -> str:
    """Return a short human descriptor for the subject, or '' if unknown."""
    code = subject_code.replace(" ", "").upper()
    meta = SUBJECT_META.get(code)
    if not meta or not meta.get("name"):
        return ""
    return f"{meta['name']} (textbook: {meta['book']})"
