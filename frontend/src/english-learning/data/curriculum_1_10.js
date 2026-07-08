export const DAYS_1_10 = [
  {
    id: 1,
    title: "First Impressions",
    titleAr: "أول لقاء",
    subtitle: "Saying Hello & Introducing Yourself",
    subtitleAr: "قول مرحباً والتعريف بالنفس",
    vocabulary: {
      intro: "يا صديقي، الكلمات هي وقود لغتك — انطقها معي بصوت عالٍ!",
      words: [
        { word: "Hello", ipa: "/həˈloʊ/", arabic: "مرحباً", phonetic: "هَلو", example: "Hello! Nice to meet you.", exampleAr: "مرحباً! سعيد بلقائك." },
        { word: "Name", ipa: "/neɪm/", arabic: "اسم", phonetic: "نِيْم", example: "My name is Sara.", exampleAr: "اسمي سارة." },
        { word: "I am", ipa: "/aɪ æm/", arabic: "أنا أكون", phonetic: "آي آم", example: "I am a student.", exampleAr: "أنا طالب." },
        { word: "Student", ipa: "/ˈstjuːdənt/", arabic: "طالب", phonetic: "سْتيودَنْت", example: "She is a good student.", exampleAr: "هي طالبة جيدة." },
        { word: "Teacher", ipa: "/ˈtiːtʃər/", arabic: "معلم", phonetic: "تِيتشَر", example: "He is my teacher.", exampleAr: "هو معلمي." },
        { word: "Friend", ipa: "/frend/", arabic: "صديق", phonetic: "فْرِيند", example: "This is my friend.", exampleAr: "هذا صديقي." }
      ],
      mimicChallenge: ["Student", "Teacher", "Friend"],
      mimicTip: "اضغط على T في Teacher، واجعل D في Friend خفيفة جداً"
    },
    grammar: {
      patterns: [{
        name: "Verb To Be — I am / She is / He is",
        explanation: "عندما تريد تخبر أحداً عن هويتك أو صفتك، نستخدم فعل الكينونة. الأمر بسيط: أنا = I am، هو = He is، هي = She is. لا تقلق — سيصير طبيعياً بعد التدريب!",
        formula: "Subject + am / is / are + (Name / Job / Adjective)",
        examples: ["I am Sara.", "He is a teacher.", "She is my friend."],
        exercises: [
          { question: "رتّب الكلمات: (am / a / student / I)", answer: "I am a student." },
          { question: "أكمل: She ___ a professional teacher.", answer: "is" },
          { question: "صحّح الخطأ: 'I is Nour.'", answer: "I am Nour. (نستخدم am مع I دائماً، مش is)" }
        ]
      }]
    },
    reading: {
      passage: "Hello! My name is Sara. I am a student. I am from Jordan. This is my friend Adam. He is a teacher.",
      breakdown: [
        { sentence: "Hello! My name is Sara.", words: [{ w: "Hello", ar: "مرحباً" }, { w: "My", ar: "ملكي (خاصتي)" }, { w: "name", ar: "اسم" }, { w: "is", ar: "يكون" }, { w: "Sara", ar: "سارة" }], meaning: "مرحباً! اسمي سارة." },
        { sentence: "I am a student.", words: [{ w: "I", ar: "أنا" }, { w: "am", ar: "أكون" }, { w: "a", ar: "أداة نكرة" }, { w: "student", ar: "طالب" }], meaning: "أنا طالبة." },
        { sentence: "I am from Jordan.", words: [{ w: "I", ar: "أنا" }, { w: "am", ar: "أكون" }, { w: "from", ar: "من" }, { w: "Jordan", ar: "الأردن" }], meaning: "أنا من الأردن." },
        { sentence: "This is my friend Adam.", words: [{ w: "This", ar: "هذا" }, { w: "is", ar: "يكون" }, { w: "my", ar: "ملكي" }, { w: "friend", ar: "صديق" }, { w: "Adam", ar: "آدم" }], meaning: "هذا صديقي آدم." },
        { sentence: "He is a teacher.", words: [{ w: "He", ar: "هو" }, { w: "is", ar: "يكون" }, { w: "a", ar: "أداة" }, { w: "teacher", ar: "معلم" }], meaning: "هو معلم." }
      ]
    },
    listening: {
      context: "تخيل أنك في أول يوم بالمعهد وهذا الشخص يقدم نفسه لك",
      text: "Hi. I am Adam. I am your new teacher. Nice to meet you here.",
      fillText: "Hi. I _____ Adam. I am your _____ teacher. Nice to _____ you here.",
      blanks: [
        { before: "Hi. I", blank: "am", after: "Adam." },
        { before: "I am your", blank: "new", after: "teacher." },
        { before: "Nice to", blank: "meet", after: "you here." }
      ]
    },
    shadowing: {
      chunk: "Nice to meet you",
      nativeForm: "naɪs tə ˈmiːtʃu",
      explanation: "المتحدثون الأصليون ما ينطقون كل كلمة لحالها. 'Nice to meet you' تتحول لـ 'نايس تو ميتشو' لأن T في meet + Y في you = صوت 'تش' خفيف جداً. هذا هو سر الطلاقة!",
      steps: [
        "استمع للمقطع 3 مرات كاملة بدون ما تقول شيء — فقط استمع",
        "حرّك شفتيك مع الصوت بدون نبرة (Silent Shadowing) — تخيل أنك تمثّل",
        "الآن انطقها بسرعة طبيعية 5 مرات متتالية: نايس-تو-ميتشو"
      ],
      youtubeUrl: "https://www.youtube.com/results?search_query=nice+to+meet+you+english+pronunciation+beginner+BBC"
    },
    writing: {
      challenges: [
        "اكتب جملة تقدم فيها نفسك بالكامل: اسمك + بلدك (مثال: My name is ... I am from ...)",
        "اكتب جملة تذكر فيها وظيفتك أو دراستك (مثال: I am a student / I am a teacher)"
      ],
      companionPrompt: `You are an encouraging, friendly English Speaking Tutor for a complete beginner who just finished "A1 Day 1" (Greetings & Introductions).
RULES:
1. ONLY use these words: Hello, Hi, name, I am, my, student, teacher, friend, nice to meet you, from, where are you from
2. Keep sentences very short — max 5-7 words each
3. If student makes a grammar error (like "I is" or "my name Sara"), correct gently: "Almost! We say '...' 😊" then continue
4. Never use vocabulary not on the Day 1 list
5. Be warm, encouraging, and patient
6. Start the conversation by saying: "Hello! My name is Alex. I am a teacher. What is your name?"`
    }
  },

  {
    id: 2,
    title: "Numbers & Age",
    titleAr: "الأرقام والعمر",
    subtitle: "Counting 1–20 & Talking About Age",
    subtitleAr: "العدّ من 1 لـ 20 والتحدث عن العمر",
    vocabulary: {
      intro: "الأرقام هي أول شيء تحتاجه في أي لغة — يلا نحفظها بطريقة ممتعة!",
      words: [
        { word: "One / Two / Three", ipa: "/wʌn/ /tuː/ /θriː/", arabic: "واحد / اثنان / ثلاثة", phonetic: "وان / تو / ثري", example: "I have one brother and two sisters.", exampleAr: "عندي أخ واحد وأختان." },
        { word: "Ten", ipa: "/ten/", arabic: "عشرة", phonetic: "تِن", example: "I am ten years old.", exampleAr: "عمري عشر سنوات." },
        { word: "Twenty", ipa: "/ˈtwenti/", arabic: "عشرون", phonetic: "تْوينتي", example: "She is twenty years old.", exampleAr: "عمرها عشرون سنة." },
        { word: "Age", ipa: "/eɪdʒ/", arabic: "عمر", phonetic: "إيدج", example: "What is your age?", exampleAr: "كم عمرك؟" },
        { word: "Year", ipa: "/jɪər/", arabic: "سنة", phonetic: "يِير", example: "I am nineteen years old.", exampleAr: "عمري تسعة عشر سنة." },
        { word: "How old", ipa: "/haʊ oʊld/", arabic: "كم عمرك", phonetic: "هاو أولد", example: "How old are you?", exampleAr: "كم عمرك؟" }
      ],
      mimicChallenge: ["Thirteen", "Fifteen", "Twenty"],
      mimicTip: "انتبه: thirteen/fourteen/fifteen الضغط على -TEEN في النهاية، مش على الأول"
    },
    grammar: {
      patterns: [{
        name: "How old are you? — الإجابة بـ I am + number + years old",
        explanation: "سؤال العمر بالإنجليزية بسيط جداً! 'How old are you?' = كم عمرك؟ والإجابة: I am [رقم] years old. مثلاً: I am 20 years old. لاحظ: نستخدم 'are' مع you و'am' مع I",
        formula: "How old + are/is + Subject? → Subject + am/is + [number] + years old",
        examples: ["How old are you? — I am 19 years old.", "How old is she? — She is 25 years old.", "I am twenty years old."],
        exercises: [
          { question: "أكمل: How old ___ you?", answer: "are" },
          { question: "رتّب: (old / am / I / years / 18)", answer: "I am 18 years old." },
          { question: "ترجم: كم عمر أخوك؟", answer: "How old is your brother?" }
        ]
      }]
    },
    reading: {
      passage: "My name is Lina. I am eighteen years old. I have one sister. Her name is Rana. She is fifteen years old. We are students.",
      breakdown: [
        { sentence: "My name is Lina.", words: [{ w: "My", ar: "ملكي" }, { w: "name", ar: "اسم" }, { w: "is", ar: "يكون" }, { w: "Lina", ar: "لينا" }], meaning: "اسمي لينا." },
        { sentence: "I am eighteen years old.", words: [{ w: "I", ar: "أنا" }, { w: "am", ar: "أكون" }, { w: "eighteen", ar: "ثمانية عشر" }, { w: "years", ar: "سنوات" }, { w: "old", ar: "عمر (قديم)" }], meaning: "عمري ثمانية عشر سنة." },
        { sentence: "I have one sister.", words: [{ w: "I", ar: "أنا" }, { w: "have", ar: "عندي" }, { w: "one", ar: "واحدة" }, { w: "sister", ar: "أخت" }], meaning: "عندي أخت واحدة." },
        { sentence: "Her name is Rana.", words: [{ w: "Her", ar: "اسمها (ملكية للمؤنث)" }, { w: "name", ar: "اسم" }, { w: "is", ar: "يكون" }, { w: "Rana", ar: "رنا" }], meaning: "اسمها رنا." },
        { sentence: "We are students.", words: [{ w: "We", ar: "نحن" }, { w: "are", ar: "نكون" }, { w: "students", ar: "طلاب" }], meaning: "نحن طالبات." }
      ]
    },
    listening: {
      context: "شخصان يتعارفان في مقهى",
      text: "Hi! My name is Omar. I am twenty years old. I am a student. How old are you?",
      fillText: "Hi! My name is Omar. I am _____ years old. I am a _____. How _____ are you?",
      blanks: [
        { before: "I am", blank: "twenty", after: "years old." },
        { before: "I am a", blank: "student", after: "." },
        { before: "How", blank: "old", after: "are you?" }
      ]
    },
    shadowing: {
      chunk: "How old are you?",
      nativeForm: "haʊ oʊld ər jə?",
      explanation: "'How old are you?' في الكلام الطبيعي السريع تصبح 'هاو أولد أر يا؟' — حرف الـ e في are يختفي تقريباً وتصبح 'ər' خفيفة جداً. هذا طبيعي جداً في الإنجليزية المحكية!",
      steps: [
        "استمع للسؤال 3 مرات بالسرعة الطبيعية — لاحظ كيف كلمة 'are' خفيفة",
        "قل السؤال ببطء ثم زد السرعة تدريجياً",
        "الآن أجب على نفسك 5 مرات: 'How old are you? — I am [عمرك] years old'"
      ],
      youtubeUrl: "https://www.youtube.com/results?search_query=how+old+are+you+english+numbers+pronunciation+beginner"
    },
    writing: {
      challenges: [
        "اكتب جملتين: عمرك وعمر شخص من عائلتك (مثال: I am 20. My sister is 17.)",
        "اكتب السؤال وأجب عليه: How old are you? → I am ..."
      ],
      companionPrompt: `You are a friendly English tutor for a beginner who just finished "A1 Day 2" (Numbers & Age).
RULES:
1. ONLY use: numbers 1-20, age, years old, how old, I am, she/he is, have, sister, brother
2. Ask the student their age and the ages of their family members
3. If they write a number as a word incorrectly (e.g. "I am twenti"), gently correct: "Almost! It's spelled 'twenty' 😊"
4. Keep sentences under 8 words
5. Start: "Hello! How old are you? I am 25 years old."`
    }
  },

  {
    id: 3,
    title: "Colors & Adjectives",
    titleAr: "الألوان والصفات",
    subtitle: "Describing Things Around You",
    subtitleAr: "وصف الأشياء من حولك",
    vocabulary: {
      intro: "الألوان والصفات هي ألوان لغتك — بدونها الكلام رمادي وممل!",
      words: [
        { word: "Red", ipa: "/red/", arabic: "أحمر", phonetic: "رِد", example: "I have a red bag.", exampleAr: "عندي شنطة حمراء." },
        { word: "Blue", ipa: "/bluː/", arabic: "أزرق", phonetic: "بلو", example: "The sky is blue.", exampleAr: "السماء زرقاء." },
        { word: "Green", ipa: "/ɡriːn/", arabic: "أخضر", phonetic: "غرين", example: "I like green tea.", exampleAr: "أحب الشاي الأخضر." },
        { word: "Big", ipa: "/bɪɡ/", arabic: "كبير", phonetic: "بِغ", example: "This is a big house.", exampleAr: "هذا بيت كبير." },
        { word: "Small", ipa: "/smɔːl/", arabic: "صغير", phonetic: "سمول", example: "I have a small phone.", exampleAr: "عندي هاتف صغير." },
        { word: "Beautiful", ipa: "/ˈbjuːtɪfəl/", arabic: "جميل", phonetic: "بيوتيفول", example: "She has a beautiful smile.", exampleAr: "ابتسامتها جميلة." }
      ],
      mimicChallenge: ["Beautiful", "Green", "Small"],
      mimicTip: "Beautiful = ثلاث مقاطع فقط: BEW-ti-ful. لا تضيف مقطعاً رابعاً!"
    },
    grammar: {
      patterns: [{
        name: "Adjective + Noun — الصفة تأتي قبل الاسم دائماً",
        explanation: "في الإنجليزية، الصفة دائماً تجي قبل الاسم. مش زي العربية! نقول: a red bag (شنطة حمراء) — الأحمر قبل الشنطة. هذه القاعدة ثابتة 100%!",
        formula: "a/an + [Adjective] + [Noun]",
        examples: ["a big house — بيت كبير", "a small phone — هاتف صغير", "a beautiful flower — وردة جميلة"],
        exercises: [
          { question: "رتّب: (blue / a / car / I / have)", answer: "I have a blue car." },
          { question: "ترجم: عندي بيت كبير وسيارة صغيرة.", answer: "I have a big house and a small car." },
          { question: "صحّح: 'I have a bag red.'", answer: "I have a red bag. (الصفة قبل الاسم!)" }
        ]
      }]
    },
    reading: {
      passage: "I have a small room. My room is blue and white. I have a big bed and a small desk. My bag is red. I love my room!",
      breakdown: [
        { sentence: "I have a small room.", words: [{ w: "I", ar: "أنا" }, { w: "have", ar: "عندي" }, { w: "a", ar: "أداة نكرة" }, { w: "small", ar: "صغير" }, { w: "room", ar: "غرفة" }], meaning: "عندي غرفة صغيرة." },
        { sentence: "My room is blue and white.", words: [{ w: "My", ar: "غرفتي" }, { w: "room", ar: "غرفة" }, { w: "is", ar: "تكون" }, { w: "blue", ar: "أزرق" }, { w: "and", ar: "و" }, { w: "white", ar: "أبيض" }], meaning: "غرفتي زرقاء وبيضاء." },
        { sentence: "I have a big bed and a small desk.", words: [{ w: "big", ar: "كبير" }, { w: "bed", ar: "سرير" }, { w: "small", ar: "صغير" }, { w: "desk", ar: "مكتب" }], meaning: "عندي سرير كبير ومكتب صغير." },
        { sentence: "My bag is red.", words: [{ w: "My", ar: "ملكي" }, { w: "bag", ar: "حقيبة" }, { w: "is", ar: "تكون" }, { w: "red", ar: "أحمر" }], meaning: "حقيبتي حمراء." },
        { sentence: "I love my room!", words: [{ w: "I", ar: "أنا" }, { w: "love", ar: "أحب" }, { w: "my", ar: "ملكي" }, { w: "room", ar: "غرفة" }], meaning: "أحب غرفتي!" }
      ]
    },
    listening: {
      context: "طالبة تصف حقيبتها الجديدة لصديقتها",
      text: "Look! I have a new bag. It is big and green. I love the color green!",
      fillText: "Look! I have a _____ bag. It is big and _____. I _____ the color green!",
      blanks: [
        { before: "I have a", blank: "new", after: "bag." },
        { before: "It is big and", blank: "green", after: "." },
        { before: "I", blank: "love", after: "the color green!" }
      ]
    },
    shadowing: {
      chunk: "It is big and beautiful",
      nativeForm: "ɪts bɪɡ ən ˈbjuːtɪfəl",
      explanation: "'It is' في الكلام الطبيعي تتحول لـ 'It's' دائماً. و'and' تصبح 'ən' خفيفة جداً. إذن: 'It's big ən beautiful' — هكذا ينطقها الأصليون في الحياة اليومية!",
      steps: [
        "استمع: 'It is big and beautiful' بشكل رسمي — ثم 'It's big ən beautiful' بشكل طبيعي",
        "قل الجملة باستخدام أشياء في غرفتك: 'It's big and blue'",
        "صف 3 أشياء في غرفتك الآن بنفس النمط 5 مرات"
      ],
      youtubeUrl: "https://www.youtube.com/results?search_query=english+colors+adjectives+pronunciation+beginner+lesson"
    },
    writing: {
      challenges: [
        "صف غرفتك أو حقيبتك بجملتين (استخدم لونين وصفتين على الأقل)",
        "اكتب جملة عن لونك المفضل ولماذا تحبه"
      ],
      companionPrompt: `You are a fun English tutor for a beginner who finished "A1 Day 3" (Colors & Adjectives).
RULES:
1. ONLY use: red, blue, green, yellow, black, white, big, small, beautiful, new, old, I have, it is, my
2. Ask the student to describe objects around them using colors and adjectives
3. If they put the adjective after the noun (e.g. "bag red"), correct gently: "In English we say 'red bag' — adjective first! 😊"
4. Keep it fun and visual — ask about their phone, bag, shirt color
5. Start: "Hello! Look at my phone. It is big and black. What color is your phone?"`
    }
  },

  {
    id: 4,
    title: "Family Members",
    titleAr: "أفراد العائلة",
    subtitle: "Talking About Your Family",
    subtitleAr: "التحدث عن عائلتك",
    vocabulary: {
      intro: "العائلة هي أقرب شيء إلينا — يلا نتعلم كيف نتحدث عنها بالإنجليزية!",
      words: [
        { word: "Mother", ipa: "/ˈmʌðər/", arabic: "أم", phonetic: "مَذَر", example: "My mother is a teacher.", exampleAr: "أمي معلمة." },
        { word: "Father", ipa: "/ˈfɑːðər/", arabic: "أب", phonetic: "فاذَر", example: "My father is a doctor.", exampleAr: "أبي طبيب." },
        { word: "Brother", ipa: "/ˈbrʌðər/", arabic: "أخ", phonetic: "بْرَذَر", example: "I have one brother.", exampleAr: "عندي أخ واحد." },
        { word: "Sister", ipa: "/ˈsɪstər/", arabic: "أخت", phonetic: "سِستَر", example: "My sister is seventeen.", exampleAr: "أختي سبعة عشر." },
        { word: "Family", ipa: "/ˈfæməli/", arabic: "عائلة", phonetic: "فاميلي", example: "I love my family.", exampleAr: "أحب عائلتي." },
        { word: "Husband / Wife", ipa: "/ˈhʌzbənd/ /waɪf/", arabic: "زوج / زوجة", phonetic: "هَزبَند / وايف", example: "Her husband is an engineer.", exampleAr: "زوجها مهندس." }
      ],
      mimicChallenge: ["Mother", "Father", "Brother"],
      mimicTip: "المقطع 'ther' في Mother/Father/Brother = ذَر — النطق يشبه حرف الذال العربي لكن أخف"
    },
    grammar: {
      patterns: [{
        name: "Possessives — My / His / Her (الضمائر الملكية)",
        explanation: "عندما نتكلم عن العائلة، نحتاج الضمائر الملكية. My = ملكي، His = ملكه (للمذكر)، Her = ملكها (للمؤنث). مثلاً: My mother, His father, Her sister. بسيطة!",
        formula: "My / His / Her / Their + [family member]",
        examples: ["My mother is kind.", "His father is a doctor.", "Her sister is young."],
        exercises: [
          { question: "أكمل: ___ mother is a teacher. (أمه — للمذكر)", answer: "His mother is a teacher." },
          { question: "ترجم: أختها طالبة.", answer: "Her sister is a student." },
          { question: "رتّب: (is / my / kind / father)", answer: "My father is kind." }
        ]
      }]
    },
    reading: {
      passage: "This is my family. My father is Ali. He is a doctor. My mother is Hala. She is a teacher. I have two brothers and one sister. I love my family very much.",
      breakdown: [
        { sentence: "This is my family.", words: [{ w: "This", ar: "هذا/هذه" }, { w: "is", ar: "يكون" }, { w: "my", ar: "ملكي" }, { w: "family", ar: "عائلة" }], meaning: "هذه عائلتي." },
        { sentence: "My father is Ali.", words: [{ w: "My", ar: "ملكي" }, { w: "father", ar: "أب" }, { w: "is", ar: "يكون" }, { w: "Ali", ar: "علي" }], meaning: "أبي اسمه علي." },
        { sentence: "He is a doctor.", words: [{ w: "He", ar: "هو" }, { w: "is", ar: "يكون" }, { w: "a", ar: "أداة" }, { w: "doctor", ar: "طبيب" }], meaning: "هو طبيب." },
        { sentence: "I have two brothers and one sister.", words: [{ w: "I", ar: "أنا" }, { w: "have", ar: "عندي" }, { w: "two", ar: "اثنان" }, { w: "brothers", ar: "إخوة" }, { w: "one", ar: "واحدة" }, { w: "sister", ar: "أخت" }], meaning: "عندي أخوان وأخت واحدة." },
        { sentence: "I love my family very much.", words: [{ w: "I", ar: "أنا" }, { w: "love", ar: "أحب" }, { w: "my", ar: "ملكي" }, { w: "family", ar: "عائلة" }, { w: "very much", ar: "جداً" }], meaning: "أحب عائلتي جداً." }
      ]
    },
    listening: {
      context: "فتاة تتحدث عن عائلتها لزميلتها",
      text: "My family is small. I have one brother. His name is Sami. My mother is at home. My father is a teacher.",
      fillText: "My family is _____. I have one _____. His name is Sami. My _____ is at home.",
      blanks: [
        { before: "My family is", blank: "small", after: "." },
        { before: "I have one", blank: "brother", after: "." },
        { before: "My", blank: "mother", after: "is at home." }
      ]
    },
    shadowing: {
      chunk: "I love my family",
      nativeForm: "aɪ lʌv maɪ ˈfæməli",
      explanation: "في الكلام الطبيعي السريع، 'my family' تصبح 'maɪ fæmli' — حرف الـ a الثاني في family يختفي تقريباً. المتحدث الأصيل يقول: آي لَف ماي فاملي (بدون 'إي' في المنتصف)",
      steps: [
        "قل 'family' ببطء: FAM-i-ly (3 مقاطع)",
        "الآن بسرعة طبيعية: 'fæmli' — المقطع الوسط يصبح خفيفاً",
        "كرر 5 مرات: 'I love my family' بطريقة طبيعية وسريعة"
      ],
      youtubeUrl: "https://www.youtube.com/results?search_query=family+members+english+vocabulary+pronunciation+beginner"
    },
    writing: {
      challenges: [
        "اكتب 3-4 جمل تصف فيها عائلتك (كم أخ/أخت + وظيفة الأب/الأم)",
        "اكتب عن فرد واحد من عائلتك تحبه كثيراً وقل لماذا"
      ],
      companionPrompt: `You are a warm English tutor for a beginner who finished "A1 Day 4" (Family Members).
RULES:
1. ONLY use: mother, father, brother, sister, family, husband, wife, son, daughter, my, his, her, I have, I love, is, are
2. Ask the student about their family members — how many brothers/sisters, parents' jobs
3. If they mix up his/her (e.g. "her father" for a male), gently say: "For a man we say 'his' 😊 His father is..."
4. Be warm and interested in their answers
5. Start: "Hello! Tell me about your family. How many brothers and sisters do you have?"`
    }
  },

  {
    id: 5,
    title: "My Morning Routine",
    titleAr: "روتيني الصباحي",
    subtitle: "Daily Actions from Wake Up to School",
    subtitleAr: "أفعال يومية من الاستيقاظ للمدرسة",
    vocabulary: {
      intro: "كل يوم نكرر نفس الأفعال — يلا نتعلم كيف نحكي عنها بالإنجليزية!",
      words: [
        { word: "Wake up", ipa: "/weɪk ʌp/", arabic: "يستيقظ", phonetic: "وِيك آب", example: "I wake up at 7 every day.", exampleAr: "أستيقظ الساعة 7 كل يوم." },
        { word: "Eat breakfast", ipa: "/iːt ˈbrekfəst/", arabic: "يأكل الفطور", phonetic: "إيت بريكفَست", example: "I eat breakfast with my family.", exampleAr: "آكل الفطور مع عائلتي." },
        { word: "Shower", ipa: "/ˈʃaʊər/", arabic: "يستحم", phonetic: "شاور", example: "I shower every morning.", exampleAr: "أستحم كل صباح." },
        { word: "Go to school", ipa: "/ɡoʊ tə skuːl/", arabic: "يذهب للمدرسة", phonetic: "غو تو سكول", example: "I go to school at 8.", exampleAr: "أذهب للمدرسة الساعة 8." },
        { word: "Late", ipa: "/leɪt/", arabic: "متأخر", phonetic: "لِيت", example: "I am never late!", exampleAr: "لا أتأخر أبداً!" },
        { word: "Always", ipa: "/ˈɔːlweɪz/", arabic: "دائماً", phonetic: "أولوِيز", example: "I always drink coffee.", exampleAr: "دائماً أشرب القهوة." }
      ],
      mimicChallenge: ["Breakfast", "Always", "Wake up"],
      mimicTip: "Breakfast = BREK-fəst (مش brek-FAST) — الضغط على المقطع الأول دائماً"
    },
    grammar: {
      patterns: [{
        name: "Simple Present — أفعال الروتين اليومي",
        explanation: "لما نتكلم عن شيء نعمله كل يوم أو دائماً، نستخدم المضارع البسيط. مع I/You/We/They = الفعل عادي. مع He/She/It = نضيف S في النهاية! مثال: I wake up ← She wakeS up",
        formula: "I/You/We/They + [verb] / He/She/It + [verb+s]",
        examples: ["I wake up at 7.", "She wakes up at 8.", "He eats breakfast every day."],
        exercises: [
          { question: "صرّف: My brother ___ (eat) breakfast at 7.", answer: "eats (نضيف s لأنه هو — He)" },
          { question: "رتّب: (always / coffee / I / drink / morning / in the)", answer: "I always drink coffee in the morning." },
          { question: "صحّح: 'She wake up early.'", answer: "She wakes up early. (مع She نضيف s)" }
        ]
      }]
    },
    reading: {
      passage: "I wake up at six thirty every morning. I shower and eat breakfast. My breakfast is bread and tea. Then I go to school. I am never late. I love my morning routine!",
      breakdown: [
        { sentence: "I wake up at six thirty every morning.", words: [{ w: "wake up", ar: "أستيقظ" }, { w: "at", ar: "في" }, { w: "six thirty", ar: "6:30" }, { w: "every morning", ar: "كل صباح" }], meaning: "أستيقظ الساعة 6:30 كل صباح." },
        { sentence: "I shower and eat breakfast.", words: [{ w: "shower", ar: "أستحم" }, { w: "and", ar: "و" }, { w: "eat", ar: "آكل" }, { w: "breakfast", ar: "فطور" }], meaning: "أستحم وآكل الفطور." },
        { sentence: "My breakfast is bread and tea.", words: [{ w: "My", ar: "ملكي" }, { w: "breakfast", ar: "فطور" }, { w: "is", ar: "يكون" }, { w: "bread", ar: "خبز" }, { w: "and", ar: "و" }, { w: "tea", ar: "شاي" }], meaning: "فطوري خبز وشاي." },
        { sentence: "I am never late.", words: [{ w: "I am", ar: "أنا" }, { w: "never", ar: "أبداً" }, { w: "late", ar: "متأخر" }], meaning: "لا أتأخر أبداً." }
      ]
    },
    listening: {
      context: "طالب يصف صباحه لمعلمه",
      text: "I wake up at seven. I eat breakfast and go to school. I am always on time.",
      fillText: "I _____ up at seven. I eat breakfast and _____ to school. I am always on _____.",
      blanks: [
        { before: "I", blank: "wake", after: "up at seven." },
        { before: "I eat breakfast and", blank: "go", after: "to school." },
        { before: "I am always on", blank: "time", after: "." }
      ]
    },
    shadowing: {
      chunk: "I wake up early every morning",
      nativeForm: "aɪ weɪk ʌp ˈɜːrli ˈevri ˈmɔːrnɪŋ",
      explanation: "'every morning' في الكلام الطبيعي يصبح 'evri mornin' — الـ g في النهاية تختفي تقريباً. وكلمة 'every' تصبح 'evri' (بدون e في النهاية). هذا طبيعي!",
      steps: [
        "قل الجملة ببطء كامل مرة واحدة",
        "الآن بسرعة متوسطة — لاحظ كيف 'every morning' تتصل",
        "كرر 5 مرات بالسرعة الطبيعية وقل روتينك أنت"
      ],
      youtubeUrl: "https://www.youtube.com/results?search_query=morning+routine+english+vocabulary+daily+habits+beginner"
    },
    writing: {
      challenges: [
        "اكتب 4-5 جمل عن روتينك الصباحي (متى تستيقظ + ماذا تفعل + متى تذهب للمدرسة/العمل)",
        "اكتب عن روتين شخص في عائلتك — استخدم He/She مع الـ s"
      ],
      companionPrompt: `You are an energetic English tutor for a beginner who finished "A1 Day 5" (Morning Routine).
RULES:
1. ONLY use: wake up, eat breakfast, shower, go to school/work, late, always, never, every morning, at [time], then
2. Ask the student about their morning routine step by step
3. If they forget to add 's' for He/She (e.g. "she wake up"), correct gently: "For 'she' we add s: 'she wakes up' 😊"
4. Make it conversational and energetic
5. Start: "Good morning! What time do you wake up? I wake up at 6 every day!"`
    }
  },

  {
    id: 6,
    title: "Food & Drinks at the Café",
    titleAr: "الطعام والمشروبات في المقهى",
    subtitle: "Ordering & Talking About Food",
    subtitleAr: "الطلب والحديث عن الطعام",
    vocabulary: {
      intro: "الأكل موضوع الجميع يحبه — يلا نتعلم كيف نطلب طعامنا بالإنجليزية!",
      words: [
        { word: "Coffee", ipa: "/ˈkɒfi/", arabic: "قهوة", phonetic: "كوفي", example: "I want a coffee, please.", exampleAr: "أريد قهوة من فضلك." },
        { word: "Tea", ipa: "/tiː/", arabic: "شاي", phonetic: "تي", example: "Do you want tea or coffee?", exampleAr: "تريد شاي أو قهوة؟" },
        { word: "Sandwich", ipa: "/ˈsænwɪtʃ/", arabic: "ساندويش", phonetic: "ساندويتش", example: "I want a chicken sandwich.", exampleAr: "أريد ساندويش دجاج." },
        { word: "Hungry", ipa: "/ˈhʌŋɡri/", arabic: "جائع", phonetic: "هَنغري", example: "I am very hungry!", exampleAr: "أنا جائع جداً!" },
        { word: "Please", ipa: "/pliːz/", arabic: "من فضلك", phonetic: "بليز", example: "Water, please.", exampleAr: "ماء من فضلك." },
        { word: "How much", ipa: "/haʊ mʌtʃ/", arabic: "كم الثمن", phonetic: "هاو مَتش", example: "How much is the coffee?", exampleAr: "كم ثمن القهوة؟" }
      ],
      mimicChallenge: ["Sandwich", "Hungry", "Coffee"],
      mimicTip: "Sandwich = SAN-witch (ليس SAN-duh-witch) — 3 مقاطع فقط. والـ d تختفي تقريباً!"
    },
    grammar: {
      patterns: [{
        name: "I want / I would like — الطلب بأدب",
        explanation: "'I want' = أريد (مباشر). 'I would like' = أود أن (أكثر أدباً وطبيعية في المقاهي والمطاعم). في الحياة اليومية يستخدم الناس كليهما، لكن 'I'd like' أكثر礼أدباً!",
        formula: "I want + [food/drink] / I would like + [food/drink] + please",
        examples: ["I want a coffee.", "I'd like a sandwich, please.", "Can I have water, please?"],
        exercises: [
          { question: "اطلب بأدب: أريد شاي وساندويش.", answer: "I'd like a tea and a sandwich, please." },
          { question: "اسأل عن السعر: كم ثمن الساندويش؟", answer: "How much is the sandwich?" },
          { question: "رتّب: (like / I'd / coffee / a / please)", answer: "I'd like a coffee, please." }
        ]
      }]
    },
    reading: {
      passage: "I am at the café. I am very hungry. I want a chicken sandwich and a coffee. The coffee is hot. How much is my order? It is five dollars.",
      breakdown: [
        { sentence: "I am at the café.", words: [{ w: "I am", ar: "أنا" }, { w: "at", ar: "في" }, { w: "the", ar: "أداة التعريف" }, { w: "café", ar: "مقهى" }], meaning: "أنا في المقهى." },
        { sentence: "I am very hungry.", words: [{ w: "I am", ar: "أنا" }, { w: "very", ar: "جداً" }, { w: "hungry", ar: "جائع" }], meaning: "أنا جائع جداً." },
        { sentence: "I want a chicken sandwich and a coffee.", words: [{ w: "I want", ar: "أريد" }, { w: "chicken", ar: "دجاج" }, { w: "sandwich", ar: "ساندويش" }, { w: "coffee", ar: "قهوة" }], meaning: "أريد ساندويش دجاج وقهوة." },
        { sentence: "How much is my order?", words: [{ w: "How much", ar: "كم" }, { w: "is", ar: "يكون" }, { w: "my", ar: "ملكي" }, { w: "order", ar: "طلب" }], meaning: "كم ثمن طلبي؟" },
        { sentence: "It is five dollars.", words: [{ w: "It is", ar: "هو يكون" }, { w: "five", ar: "خمسة" }, { w: "dollars", ar: "دولارات" }], meaning: "بخمسة دولارات." }
      ]
    },
    listening: {
      context: "شخص يطلب في مقهى",
      text: "Hello! I'd like a coffee and a sandwich, please. How much is it? Thank you!",
      fillText: "Hello! I'd _____ a coffee and a sandwich, please. How _____ is it? _____ you!",
      blanks: [
        { before: "I'd", blank: "like", after: "a coffee and a sandwich, please." },
        { before: "How", blank: "much", after: "is it?" },
        { before: "", blank: "Thank", after: "you!" }
      ]
    },
    shadowing: {
      chunk: "I'd like a coffee, please",
      nativeForm: "aɪd laɪk ə ˈkɒfi pliːz",
      explanation: "'I would like' في الحياة تصبح 'I'd like' دائماً — المتحدث الأصيل لا يقول 'I would' في المقهى أبداً. والـ 'a' قبل coffee تصبح 'ə' خفيفة جداً. جربها: آيد لايك ə كوفي بليز",
      steps: [
        "قل 'I would like' ببطء — ثم 'I'd like' بسرعة. لاحظ الفرق",
        "تدرب على الجملة كاملة: I'd like a coffee, please",
        "الآن اطلب 3 أشياء مختلفة من القائمة باستخدام نفس النمط"
      ],
      youtubeUrl: "https://www.youtube.com/results?search_query=ordering+food+cafe+english+conversation+beginner+I'd+like"
    },
    writing: {
      challenges: [
        "اكتب حوار قصير في مقهى: أنت تطلب وشخص آخر يجيب (3-4 جمل)",
        "اكتب طعامك المفضل وشرابك المفضل واستخدم الصفات (مثال: I love cold water and a hot coffee)"
      ],
      companionPrompt: `You are a friendly café waiter AND English tutor for a beginner who finished "A1 Day 6" (Food & Café).
RULES:
1. ONLY use: coffee, tea, water, juice, sandwich, cake, hungry, please, thank you, how much, I want, I'd like, hot, cold, yes/no
2. Play the role of a café waiter: take the student's order, tell them the price
3. If they forget "please" or use "I want" instead of "I'd like", gently suggest the polite form
4. If they say something incorrect, repeat it correctly in your response naturally
5. Start: "Welcome to Noura Café! What would you like today? ☕"`
    }
  },

  {
    id: 7,
    title: "Days & Time",
    titleAr: "الأيام والوقت",
    subtitle: "Days of the Week & Telling the Time",
    subtitleAr: "أيام الأسبوع وقراءة الساعة",
    vocabulary: {
      intro: "الوقت هو أهم شيء في اللغة — بدونه ما تقدر تحدد موعد مع أحد!",
      words: [
        { word: "Monday", ipa: "/ˈmʌndeɪ/", arabic: "الاثنين", phonetic: "مَنداي", example: "School starts on Monday.", exampleAr: "المدرسة تبدأ الاثنين." },
        { word: "Friday", ipa: "/ˈfraɪdeɪ/", arabic: "الجمعة", phonetic: "فرايداي", example: "Friday is my favorite day!", exampleAr: "الجمعة هي يومي المفضل!" },
        { word: "Weekend", ipa: "/ˈwiːkend/", arabic: "نهاية الأسبوع", phonetic: "ويكِند", example: "I love the weekend.", exampleAr: "أحب عطلة نهاية الأسبوع." },
        { word: "O'clock", ipa: "/əˈklɒk/", arabic: "الساعة تماماً", phonetic: "أو-كلوك", example: "Class is at nine o'clock.", exampleAr: "الحصة الساعة التاسعة تماماً." },
        { word: "What time", ipa: "/wɒt taɪm/", arabic: "كم الساعة", phonetic: "وات تايم", example: "What time is it?", exampleAr: "كم الساعة؟" },
        { word: "Morning / Evening", ipa: "/ˈmɔːrnɪŋ/ /ˈiːvnɪŋ/", arabic: "صباح / مساء", phonetic: "مورنينغ / إيفنينغ", example: "Good morning! Good evening!", exampleAr: "صباح الخير! مساء الخير!" }
      ],
      mimicChallenge: ["Wednesday", "Thursday", "Weekend"],
      mimicTip: "Wednesday = WENZ-day (الـ d في المنتصف صامتة! لا تنطقها)"
    },
    grammar: {
      patterns: [{
        name: "What time is it? — قراءة الساعة",
        explanation: "لقراءة الساعة بالإنجليزية: إذا كانت الساعة تماماً قل [number] o'clock. إذا كان هناك دقائق، قل [hour]:[minutes]. مثال: 7:00 = It's seven o'clock. 7:30 = It's seven thirty.",
        formula: "It is + [hour] + o'clock / It is + [hour] + [minutes]",
        examples: ["It's eight o'clock.", "It's nine thirty.", "It's six fifteen."],
        exercises: [
          { question: "اقرأ الساعة: 10:00", answer: "It's ten o'clock." },
          { question: "اقرأ الساعة: 3:30", answer: "It's three thirty." },
          { question: "اسأل: كم الساعة؟", answer: "What time is it?" }
        ]
      }]
    },
    reading: {
      passage: "Today is Monday. It is eight o'clock in the morning. I go to school at eight thirty. My class is from nine to twelve. On Friday, I do not go to school. I love Friday!",
      breakdown: [
        { sentence: "Today is Monday.", words: [{ w: "Today", ar: "اليوم" }, { w: "is", ar: "يكون" }, { w: "Monday", ar: "الاثنين" }], meaning: "اليوم هو الاثنين." },
        { sentence: "It is eight o'clock in the morning.", words: [{ w: "It is", ar: "الساعة" }, { w: "eight", ar: "ثمانية" }, { w: "o'clock", ar: "تماماً" }, { w: "in the morning", ar: "صباحاً" }], meaning: "الساعة الثامنة صباحاً." },
        { sentence: "My class is from nine to twelve.", words: [{ w: "My class", ar: "حصتي" }, { w: "from", ar: "من" }, { w: "nine", ar: "تسعة" }, { w: "to", ar: "إلى" }, { w: "twelve", ar: "اثني عشر" }], meaning: "حصتي من التاسعة إلى الثانية عشرة." },
        { sentence: "On Friday, I do not go to school.", words: [{ w: "On Friday", ar: "يوم الجمعة" }, { w: "do not", ar: "لا" }, { w: "go", ar: "أذهب" }, { w: "to school", ar: "للمدرسة" }], meaning: "يوم الجمعة لا أذهب للمدرسة." }
      ]
    },
    listening: {
      context: "شخص يسأل عن موعد اجتماع",
      text: "What time is the meeting? It is on Wednesday at ten o'clock in the morning.",
      fillText: "What _____ is the meeting? It is on _____ at ten o'clock in the _____.",
      blanks: [
        { before: "What", blank: "time", after: "is the meeting?" },
        { before: "It is on", blank: "Wednesday", after: "at ten o'clock." },
        { before: "at ten o'clock in the", blank: "morning", after: "." }
      ]
    },
    shadowing: {
      chunk: "What time is it?",
      nativeForm: "wɒt taɪm ɪz ɪt?",
      explanation: "'What time is it?' في الكلام السريع تصبح 'Whaddime-izit?' — الـ t في 'what' تصبح 'd' ناعمة (flap t)، و'is it' تتصلان. هذا ما ستسمعه في الحياة الحقيقية!",
      steps: [
        "قل السؤال ببطء: 'What - time - is - it?'",
        "الآن بسرعة مع ربط الكلمات: 'Whadtime-izit?'",
        "تدرب: اسأل وأجب 5 مرات باستخدام أوقات مختلفة"
      ],
      youtubeUrl: "https://www.youtube.com/results?search_query=telling+the+time+in+english+beginner+days+of+week+pronunciation"
    },
    writing: {
      challenges: [
        "اكتب جدولك اليومي ليوم غد: اليوم + 3-4 أنشطة مع أوقاتها",
        "اكتب أي يوم هو يومك المفضل ولماذا (استخدم On [day], I ...)"
      ],
      companionPrompt: `You are a fun English tutor for a beginner who finished "A1 Day 7" (Days & Time).
RULES:
1. ONLY use: Monday-Sunday, today, morning, afternoon, evening, what time, o'clock, at, on, I go, I have, class, school
2. Ask the student about their weekly schedule — which days do they have school/work?
3. Practice telling the time together: ask "What time is your class?" and correct gently if needed
4. If they say "in Monday" instead of "on Monday", correct: "We use 'on' with days: on Monday 😊"
5. Start: "Hello! What day is today? And what time is it now?"`
    }
  },

  {
    id: 8,
    title: "Weather & Seasons",
    titleAr: "الطقس والفصول",
    subtitle: "Describing the Weather & How You Feel",
    subtitleAr: "وصف الطقس والتعبير عن الإحساس",
    vocabulary: {
      intro: "الطقس موضوع تحدث عنه الإنجليز دائماً — إنه أكثر موضوع شائع في المحادثات!",
      words: [
        { word: "Sunny", ipa: "/ˈsʌni/", arabic: "مشمس", phonetic: "سَني", example: "Today is sunny and warm.", exampleAr: "اليوم مشمس ودافئ." },
        { word: "Rainy", ipa: "/ˈreɪni/", arabic: "ممطر", phonetic: "رِيني", example: "It is rainy today. I need an umbrella.", exampleAr: "الجو ممطر. أحتاج مظلة." },
        { word: "Cold", ipa: "/koʊld/", arabic: "بارد", phonetic: "كولد", example: "It is very cold in winter.", exampleAr: "الجو بارد جداً في الشتاء." },
        { word: "Hot", ipa: "/hɒt/", arabic: "حار", phonetic: "هوت", example: "It is too hot today!", exampleAr: "الجو حار جداً اليوم!" },
        { word: "Season", ipa: "/ˈsiːzən/", arabic: "فصل", phonetic: "سيزَن", example: "My favorite season is spring.", exampleAr: "فصلي المفضل هو الربيع." },
        { word: "What's the weather like?", ipa: "/wɒts ðə ˈweðər laɪk/", arabic: "كيف الطقس؟", phonetic: "واتس ذا ويذَر لايك", example: "What's the weather like today?", exampleAr: "كيف الطقس اليوم؟" }
      ],
      mimicChallenge: ["Weather", "Umbrella", "Sunny"],
      mimicTip: "Weather = WETH-er (ذ + er). ليست 'wea-THER'. الضغط على المقطع الأول!"
    },
    grammar: {
      patterns: [{
        name: "It is + Weather Adjective — وصف الطقس",
        explanation: "لوصف الطقس بالإنجليزية نستخدم دائماً 'It is' أو 'It's' — مش 'The weather is sunny' فقط، يمكن نختصر ونقول 'It's sunny'. هذا الـ 'It' لا يشير لشيء محدد — هو فقط للطقس!",
        formula: "It is / It's + [weather adjective] + today / in [season]",
        examples: ["It's sunny today.", "It's cold in winter.", "It's very hot and dry."],
        exercises: [
          { question: "صف الطقس: 🌧️ + بارد", answer: "It's cold and rainy." },
          { question: "اسأل عن الطقس بطريقة صحيحة", answer: "What's the weather like today? / How's the weather?" },
          { question: "رتّب: (hot / it's / very / today)", answer: "It's very hot today." }
        ]
      }]
    },
    reading: {
      passage: "Today is winter. It is very cold and cloudy. I wear a big coat. I do not like cold weather. My favorite season is summer. In summer, it is hot and sunny. I love sunny days!",
      breakdown: [
        { sentence: "Today is winter.", words: [{ w: "Today", ar: "اليوم" }, { w: "is", ar: "يكون" }, { w: "winter", ar: "شتاء" }], meaning: "اليوم هو فصل الشتاء." },
        { sentence: "It is very cold and cloudy.", words: [{ w: "It is", ar: "الجو" }, { w: "very", ar: "جداً" }, { w: "cold", ar: "بارد" }, { w: "and", ar: "و" }, { w: "cloudy", ar: "غائم" }], meaning: "الجو بارد وغائم جداً." },
        { sentence: "I wear a big coat.", words: [{ w: "I wear", ar: "أرتدي" }, { w: "a big", ar: "كبير" }, { w: "coat", ar: "معطف" }], meaning: "أرتدي معطفاً كبيراً." },
        { sentence: "My favorite season is summer.", words: [{ w: "My favorite", ar: "المفضل لدي" }, { w: "season", ar: "فصل" }, { w: "is", ar: "يكون" }, { w: "summer", ar: "صيف" }], meaning: "فصلي المفضل هو الصيف." }
      ]
    },
    listening: {
      context: "شخص يتحدث في الهاتف عن الطقس",
      text: "Hello! What's the weather like there? Here it is sunny and hot. I love this weather!",
      fillText: "Hello! What's the _____ like there? Here it is _____ and hot. I _____ this weather!",
      blanks: [
        { before: "What's the", blank: "weather", after: "like there?" },
        { before: "Here it is", blank: "sunny", after: "and hot." },
        { before: "I", blank: "love", after: "this weather!" }
      ]
    },
    shadowing: {
      chunk: "What's the weather like today?",
      nativeForm: "wɒts ðə ˈweðər laɪk təˈdeɪ?",
      explanation: "هذه الجملة يستخدمها الإنجليز مئات المرات يومياً! 'What's' = What is (اختصار دائم). 'the weather' الـ th في weather = ذَ (ليست z ولا s). جربها: 'Wats-ðe-WEθer-like-tedAY?'",
      steps: [
        "تدرب على نطق 'weather' بشكل صحيح: WETH-er (ذ في المنتصف)",
        "قل الجملة كاملة 3 مرات ببطء ثم 3 مرات بسرعة",
        "الآن صف الطقس خارج نافذتك الآن بنفس النمط"
      ],
      youtubeUrl: "https://www.youtube.com/results?search_query=weather+vocabulary+english+beginner+seasons+pronunciation+BBC"
    },
    writing: {
      challenges: [
        "صف الطقس اليوم في 3 جمل (استخدم: It's + صفة، وتحدث عن ملابسك)",
        "اكتب عن فصلك المفضل ولماذا تحبه (2-3 جمل)"
      ],
      companionPrompt: `You are a weather enthusiast English tutor for a beginner who finished "A1 Day 8" (Weather & Seasons).
RULES:
1. ONLY use: sunny, rainy, cold, hot, windy, cloudy, season, summer, winter, spring, autumn, I love/like/don't like, today, it's, wear
2. Ask about today's weather and the student's favorite season
3. If they say "The weather is sunny" that's fine but also show them "It's sunny" as a natural alternative
4. React naturally to their weather descriptions: "Oh, it's cold there? I love cold weather!"
5. Start: "Hello! What's the weather like where you are today? ☀️🌧️"`
    }
  },

  {
    id: 9,
    title: "Jobs & Professions",
    titleAr: "المهن والوظائف",
    subtitle: "Talking About Work & What People Do",
    subtitleAr: "التحدث عن العمل وما يفعله الناس",
    vocabulary: {
      intro: "السؤال الأكثر شيوعاً في المحادثة: 'What do you do?' — يلا نتعلم كيف نجاوب!",
      words: [
        { word: "Doctor", ipa: "/ˈdɒktər/", arabic: "طبيب", phonetic: "دوكتَر", example: "My father is a doctor.", exampleAr: "أبي طبيب." },
        { word: "Engineer", ipa: "/ˌendʒɪˈnɪər/", arabic: "مهندس", phonetic: "إنجي-نير", example: "She is a civil engineer.", exampleAr: "هي مهندسة مدنية." },
        { word: "Nurse", ipa: "/nɜːrs/", arabic: "ممرض/ة", phonetic: "نُرس", example: "He is a nurse at the hospital.", exampleAr: "هو ممرض في المستشفى." },
        { word: "Chef", ipa: "/ʃef/", arabic: "طاهي / شيف", phonetic: "شيف", example: "The chef makes amazing food.", exampleAr: "الشيف يطبخ طعاماً رائعاً." },
        { word: "What do you do?", ipa: "/wɒt duː juː duː/", arabic: "ما هو عملك؟", phonetic: "وات دو يو دو", example: "What do you do for work?", exampleAr: "ما هو عملك؟" },
        { word: "I work at / in", ipa: "/aɪ wɜːrk æt/ɪn/", arabic: "أعمل في", phonetic: "آي وُرك ات/إن", example: "I work at a hospital.", exampleAr: "أعمل في مستشفى." }
      ],
      mimicChallenge: ["Engineer", "Doctor", "Nurse"],
      mimicTip: "Engineer = 3 مقاطع: en-ji-NEER. الضغط على المقطع الأخير وليس الأول!"
    },
    grammar: {
      patterns: [{
        name: "What do you do? — السؤال عن المهنة والإجابة",
        explanation: "هذا السؤال يبدو غريباً لكنه قياسي جداً: 'What do you do?' = ما هو عملك؟ الإجابة: 'I am a [job]' أو 'I work as a [job]' أو 'I work at [place]'. كل الطرق صحيحة!",
        formula: "What do you do? → I am a [job] / I work as a [job] / I work at [place]",
        examples: ["What do you do? — I am a teacher.", "I work as a nurse at a hospital.", "She works at a school."],
        exercises: [
          { question: "اسأل عن وظيفته: ما هو عمل أخيك؟", answer: "What does your brother do?" },
          { question: "أجب: أنا مهندس وأعمل في شركة كبيرة.", answer: "I am an engineer. I work at a big company." },
          { question: "ما الفرق: 'I am a doctor' و 'I work as a doctor'؟", answer: "كلاهما صحيح — نفس المعنى. 'I work as' أكثر رسمية قليلاً." }
        ]
      }]
    },
    reading: {
      passage: "My name is Nadia. I am a nurse. I work at a big hospital. My husband is an engineer. He works at a construction company. We both love our jobs. Our work is important!",
      breakdown: [
        { sentence: "I am a nurse.", words: [{ w: "I am", ar: "أنا" }, { w: "a", ar: "أداة" }, { w: "nurse", ar: "ممرضة" }], meaning: "أنا ممرضة." },
        { sentence: "I work at a big hospital.", words: [{ w: "I work", ar: "أعمل" }, { w: "at", ar: "في" }, { w: "a big", ar: "كبير" }, { w: "hospital", ar: "مستشفى" }], meaning: "أعمل في مستشفى كبير." },
        { sentence: "My husband is an engineer.", words: [{ w: "My husband", ar: "زوجي" }, { w: "is", ar: "يكون" }, { w: "an", ar: "أداة (قبل حرف علة)" }, { w: "engineer", ar: "مهندس" }], meaning: "زوجي مهندس." },
        { sentence: "He works at a construction company.", words: [{ w: "He works", ar: "يعمل" }, { w: "at", ar: "في" }, { w: "construction", ar: "إنشاء" }, { w: "company", ar: "شركة" }], meaning: "يعمل في شركة إنشاءات." }
      ]
    },
    listening: {
      context: "شخصان يتعارفان في حفلة",
      text: "Nice to meet you! What do you do? I am a teacher. I work at a school. What about you?",
      fillText: "Nice to meet you! What do you _____? I am a _____. I work at a school. What _____ you?",
      blanks: [
        { before: "What do you", blank: "do", after: "?" },
        { before: "I am a", blank: "teacher", after: "." },
        { before: "What about", blank: "you", after: "?" }
      ]
    },
    shadowing: {
      chunk: "What do you do for work?",
      nativeForm: "wɒt də jə duː fər wɜːrk?",
      explanation: "'What do you do?' في الكلام الطبيعي — 'do you' يتحول لـ 'də jə' (خفيف جداً). المتحدثون الأصيلون لا ينطقون كل حرف. جربها: 'Whadə-yə-doo-fer-work?' — الكلمات تتصل!",
      steps: [
        "قل 'do you' ببطء ثم بسرعة: 'doo-yoo' → 'də-jə'",
        "الآن الجملة كاملة بشكل رسمي ثم طبيعي",
        "تدرب مع شريك أو وحدك: اسأل وأجب 5 مرات"
      ],
      youtubeUrl: "https://www.youtube.com/results?search_query=jobs+professions+english+vocabulary+what+do+you+do+beginner"
    },
    writing: {
      challenges: [
        "اكتب عن وظيفتك الحالية أو الوظيفة التي تريد في المستقبل (2-3 جمل)",
        "اكتب عن وظيفة أحد والديك أو أحد أفراد عائلتك — استخدم He/She works"
      ],
      companionPrompt: `You are a curious English tutor for a beginner who finished "A1 Day 9" (Jobs & Professions).
RULES:
1. ONLY use: doctor, engineer, nurse, teacher, chef, police, driver, student, I am a, I work at/in, what do you do, where do you work
2. Ask the student about their job or dream job, and about family members' jobs
3. Remember: before vowel sounds use 'an' (an engineer, an artist) not 'a'
4. If they say "I am engineer" without article, gently say: "Don't forget the article! We say 'I am AN engineer' 😊"
5. Start: "Hello! I have a question for you — what do you do for work?"`
    }
  },

  {
    id: 10,
    title: "Places in the City",
    titleAr: "أماكن في المدينة",
    subtitle: "Finding Your Way Around Town",
    subtitleAr: "التعرف على أماكن المدينة",
    vocabulary: {
      intro: "تخيل أنك في مدينة جديدة — ستحتاج كل هذه الكلمات فوراً!",
      words: [
        { word: "Hospital", ipa: "/ˈhɒspɪtəl/", arabic: "مستشفى", phonetic: "هوسبيتَل", example: "The hospital is near here.", exampleAr: "المستشفى قريب من هنا." },
        { word: "Supermarket", ipa: "/ˈsuːpərmɑːrkɪt/", arabic: "سوبرماركت", phonetic: "سوبَرماركِت", example: "I go to the supermarket every week.", exampleAr: "أذهب للسوبرماركت كل أسبوع." },
        { word: "Bank", ipa: "/bæŋk/", arabic: "بنك", phonetic: "بانك", example: "The bank is next to the school.", exampleAr: "البنك بجانب المدرسة." },
        { word: "Park", ipa: "/pɑːrk/", arabic: "حديقة", phonetic: "بارك", example: "I walk in the park every evening.", exampleAr: "أتمشى في الحديقة كل مساء." },
        { word: "Is there a...?", ipa: "/ɪz ðer ə/", arabic: "هل يوجد...؟", phonetic: "إز ذير ا", example: "Is there a pharmacy near here?", exampleAr: "هل يوجد صيدلية قريبة؟" },
        { word: "Near / Far", ipa: "/nɪər/ /fɑːr/", arabic: "قريب / بعيد", phonetic: "نير / فار", example: "The school is near. The hospital is far.", exampleAr: "المدرسة قريبة. المستشفى بعيد." }
      ],
      mimicChallenge: ["Hospital", "Supermarket", "Is there a"],
      mimicTip: "Hospital = HOS-pi-tl (3 مقاطع). الـ al في النهاية تصبح 'tl' خفيفة جداً"
    },
    grammar: {
      patterns: [{
        name: "Is there a...? / There is a... — السؤال عن وجود مكان",
        explanation: "لتسأل إذا كان مكان موجود نقول: 'Is there a [place] near here?' والإجابة: 'Yes, there is a [place] on [street]' أو 'No, there isn't.' هذا القالب مهم جداً للحياة اليومية!",
        formula: "Is there a + [place] + near here? → Yes, there is / No, there isn't",
        examples: ["Is there a bank near here? — Yes, there is a bank on Main Street.", "Is there a park? — No, there isn't a park here.", "There is a hospital near the school."],
        exercises: [
          { question: "اسأل: هل يوجد مطعم قريب؟", answer: "Is there a restaurant near here?" },
          { question: "أجب بالنفي: لا يوجد مستشفى هنا.", answer: "No, there isn't a hospital here." },
          { question: "رتّب: (a / the school / bank / near / there is)", answer: "There is a bank near the school." }
        ]
      }]
    },
    reading: {
      passage: "I live in a small city. There is a big park near my house. There is also a supermarket and a bank. The hospital is a bit far. I go to the park every evening. I love my city!",
      breakdown: [
        { sentence: "I live in a small city.", words: [{ w: "I live", ar: "أسكن" }, { w: "in", ar: "في" }, { w: "a small", ar: "صغيرة" }, { w: "city", ar: "مدينة" }], meaning: "أسكن في مدينة صغيرة." },
        { sentence: "There is a big park near my house.", words: [{ w: "There is", ar: "يوجد" }, { w: "a big", ar: "كبيرة" }, { w: "park", ar: "حديقة" }, { w: "near", ar: "قريبة من" }, { w: "my house", ar: "بيتي" }], meaning: "يوجد حديقة كبيرة قريبة من بيتي." },
        { sentence: "The hospital is a bit far.", words: [{ w: "The hospital", ar: "المستشفى" }, { w: "is", ar: "يكون" }, { w: "a bit", ar: "قليلاً" }, { w: "far", ar: "بعيد" }], meaning: "المستشفى بعيد قليلاً." },
        { sentence: "I go to the park every evening.", words: [{ w: "I go", ar: "أذهب" }, { w: "to the park", ar: "للحديقة" }, { w: "every evening", ar: "كل مساء" }], meaning: "أذهب للحديقة كل مساء." }
      ]
    },
    listening: {
      context: "شخص يسأل عن الأماكن في حي جديد",
      text: "Excuse me! Is there a supermarket near here? Yes! There is one on Green Street. It is not far.",
      fillText: "Excuse me! Is there a _____ near here? Yes! There is one on Green _____. It is not _____.",
      blanks: [
        { before: "Is there a", blank: "supermarket", after: "near here?" },
        { before: "There is one on Green", blank: "Street", after: "." },
        { before: "It is not", blank: "far", after: "." }
      ]
    },
    shadowing: {
      chunk: "Is there a supermarket near here?",
      nativeForm: "ɪz ðər ə ˈsuːpərˌmɑːrkɪt nɪr hɪr?",
      explanation: "في الكلام الطبيعي: 'Is there a' تصبح كلمة واحدة تقريباً: 'ɪzðərə' (إزذيرا). و'near here' يتصلان: 'nɪrhɪr'. هكذا يسأل الناس في الشارع!",
      steps: [
        "تدرب على 'Is there a' كوحدة واحدة: إزذيرا",
        "الآن أضف المكان: إزذيرا-سوبَرماركِت-نير-هير؟",
        "اسأل عن 3 أماكن مختلفة في مدينتك باستخدام نفس الجملة"
      ],
      youtubeUrl: "https://www.youtube.com/results?search_query=places+in+the+city+english+vocabulary+beginner+there+is"
    },
    writing: {
      challenges: [
        "صف حيّك أو المنطقة التي تسكن فيها: ما الأماكن الموجودة قريباً؟ (4-5 جمل)",
        "اكتب حواراً قصيراً: شخص يسأل عن مكان في مدينتك وأنت تجيب"
      ],
      companionPrompt: `You are a helpful local guide English tutor for a beginner who finished "A1 Day 10" (Places in the City).
RULES:
1. ONLY use: hospital, supermarket, bank, park, restaurant, school, mosque, pharmacy, near, far, there is/isn't, is there a, on [street], next to, behind
2. Play the role of a local guide — the student is new to town and asking about places
3. If they say "Is there hospital?" (missing 'a'), correct: "We say 'Is there A hospital?' — don't forget the article! 😊"
4. Make it feel like a real interaction
5. Start: "Hello! Welcome to the city! Are you looking for something? I can help you find places nearby!"`
    }
  }
]
