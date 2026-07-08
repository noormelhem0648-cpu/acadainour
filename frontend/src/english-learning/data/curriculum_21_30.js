export const DAYS_21_30 = [
  {
    id: 21,
    title: "At the Doctor",
    titleAr: "عند الطبيب",
    subtitle: "Making Appointments & Describing Symptoms",
    subtitleAr: "حجز موعد ووصف الأعراض",
    vocabulary: {
      intro: "الصحة أهم شيء — تعلم كيف تتحدث مع الطبيب بثقة!",
      words: [
        { word: "Appointment", ipa: "/əˈpɔɪntmənt/", arabic: "موعد", phonetic: "أبوينتمِنت", example: "I need to make an appointment.", exampleAr: "أحتاج لحجز موعد." },
        { word: "Prescription", ipa: "/prɪˈskrɪpʃən/", arabic: "وصفة طبية", phonetic: "بريسكريبشَن", example: "The doctor gave me a prescription.", exampleAr: "الطبيب أعطاني وصفة طبية." },
        { word: "Rest", ipa: "/rest/", arabic: "راحة / يرتاح", phonetic: "ريست", example: "You need to rest for two days.", exampleAr: "تحتاج للراحة يومين." },
        { word: "How long have you had...?", ipa: "/haʊ lɒŋ/", arabic: "منذ متى عندك...؟", phonetic: "هاو لونغ", example: "How long have you had this headache?", exampleAr: "منذ متى عندك هذا الصداع؟" },
        { word: "Allergy", ipa: "/ˈælərdʒi/", arabic: "حساسية", phonetic: "أليردجي", example: "I have an allergy to cats.", exampleAr: "عندي حساسية من القطط." },
        { word: "Feel better", ipa: "/fiːl ˈbetər/", arabic: "يشعر بتحسن", phonetic: "فيل بيتَر", example: "I hope you feel better soon!", exampleAr: "أتمنى أن تتحسن قريباً!" }
      ],
      mimicChallenge: ["Appointment", "Prescription", "Allergy"],
      mimicTip: "Appointment = ə-POINT-mənt (الضغط على POINT). Allergy = AL-er-jee (3 مقاطع)"
    },
    grammar: {
      patterns: [{
        name: "How long have you had...? — السؤال عن مدة المرض",
        explanation: "الطبيب دائماً يسأل: 'How long have you had this pain?' = منذ متى عندك هذا الألم؟ الإجابة: 'For [مدة]' أو 'Since [وقت]'. مثال: For two days. Since yesterday.",
        formula: "How long have you had + [symptom]? → For + [duration] / Since + [time]",
        examples: ["How long have you had this fever? — For three days.", "Since when do you have this pain? — Since yesterday morning.", "I have had a headache for two hours."],
        exercises: [
          { question: "اسأل: منذ متى عندك هذا الزكام؟", answer: "How long have you had this cold?" },
          { question: "أجب: منذ يومين.", answer: "For two days." },
          { question: "أجب: منذ أمس.", answer: "Since yesterday." }
        ]
      }]
    },
    reading: {
      passage: "I call the clinic to make an appointment. The doctor sees me at 10 o'clock. She asks: 'How long have you had this pain?' I say: 'For three days.' She examines me and gives me a prescription. She tells me to rest and drink water. I hope I feel better soon!",
      breakdown: [
        { sentence: "I call the clinic to make an appointment.", words: [{ w: "I call", ar: "أتصل" }, { w: "the clinic", ar: "العيادة" }, { w: "to make", ar: "لحجز" }, { w: "an appointment", ar: "موعد" }], meaning: "أتصل بالعيادة لحجز موعد." },
        { sentence: "How long have you had this pain?", words: [{ w: "How long", ar: "منذ متى" }, { w: "have you had", ar: "عندك" }, { w: "this pain", ar: "هذا الألم" }], meaning: "منذ متى عندك هذا الألم؟" },
        { sentence: "She tells me to rest and drink water.", words: [{ w: "She tells", ar: "تخبرني" }, { w: "me to rest", ar: "بالراحة" }, { w: "and drink", ar: "وشرب" }, { w: "water", ar: "ماء" }], meaning: "تخبرني بالراحة وشرب الماء." }
      ]
    },
    listening: {
      context: "في عيادة الطبيب",
      text: "Hello doctor. I have a stomachache and a fever. How long have you had this? For two days. I will give you a prescription. Rest at home please.",
      fillText: "Hello doctor. I have a stomachache and a _____. How long have you had this? For two _____. I will give you a _____. Rest at home please.",
      blanks: [
        { before: "stomachache and a", blank: "fever", after: "." },
        { before: "For two", blank: "days", after: "." },
        { before: "I will give you a", blank: "prescription", after: "." }
      ]
    },
    shadowing: {
      chunk: "I need to make an appointment",
      nativeForm: "aɪ niːd tə meɪk ən əˈpɔɪntmənt",
      explanation: "'I need to' في الكلام الطبيعي = 'I needta' (نيدتا) — to تصبح خفيفة ومتصلة بما قبلها. و'an appointment' — الـ an قبل الحرف الساكن تصبح 'ən' خفيفة",
      steps: ["تدرب: I need to (نيدتا) — قلها بسرعة", "أضف: make an appointment — واربطها: meɪk-ən-əpointment", "اتصل خيالياً بعيادة طبيب واحجز موعد باستخدام ما تعلمته"],
      youtubeUrl: "https://www.youtube.com/results?search_query=doctor+appointment+english+conversation+symptoms+beginner"
    },
    writing: {
      challenges: ["اكتب حواراً كاملاً في عيادة الطبيب: أنت المريض والطبيب (8-10 جمل)", "اكتب عن آخر مرة زرت فيها الطبيب — ما الأعراض؟ ماذا قال الطبيب؟"],
      companionPrompt: `You are a kind doctor AND English tutor for a beginner who finished "A1 Day 21" (Doctor's Visit).
RULES:
1. ONLY use: appointment, prescription, rest, allergy, fever, how long, since, for, feel better, medicine, examine, what's wrong, symptoms
2. Full doctor visit simulation: greeting → symptoms → duration → diagnosis → advice
3. Ask "How long have you had...?" naturally in the conversation
4. Correct medical vocabulary gently
5. Start: "Good morning! I'm Dr. Smith. What brings you in today? How can I help?"`
    }
  },

  {
    id: 22,
    title: "Asking for Directions",
    titleAr: "طلب الاتجاهات",
    subtitle: "Finding Your Way in Any City",
    subtitleAr: "إيجاد طريقك في أي مدينة",
    vocabulary: {
      intro: "تخيل أنك في مدينة جديدة وضائع — هذه الكلمات ستنقذك!",
      words: [
        { word: "Turn left / right", ipa: "/tɜːrn left/ /raɪt/", arabic: "اتجه يساراً / يميناً", phonetic: "تُرن ليفت / رايت", example: "Turn right at the corner.", exampleAr: "اتجه يميناً عند الزاوية." },
        { word: "Go straight", ipa: "/ɡoʊ streɪt/", arabic: "اسر مستقيماً", phonetic: "غو ستريت", example: "Go straight and you will see it.", exampleAr: "اسر مستقيماً وستراه." },
        { word: "Corner", ipa: "/ˈkɔːrnər/", arabic: "زاوية / ناصية", phonetic: "كورنَر", example: "The bank is on the corner.", exampleAr: "البنك على الزاوية." },
        { word: "Next to / Behind / In front of", ipa: "/nekst tuː/ /bɪˈhaɪnd/", arabic: "بجانب / خلف / أمام", phonetic: "نيكست تو / بيهايند / إن فرونت أوف", example: "The school is next to the park.", exampleAr: "المدرسة بجانب الحديقة." },
        { word: "Excuse me", ipa: "/ɪkˈskjuːz miː/", arabic: "عفواً / لو سمحت", phonetic: "إكسكيوز مي", example: "Excuse me, where is the hospital?", exampleAr: "عفواً، أين المستشفى؟" },
        { word: "You can't miss it!", ipa: "/juː kænt mɪs ɪt/", arabic: "لن تفوتك / ستجده سهلاً", phonetic: "يو كانت مِس إت", example: "It's the big red building. You can't miss it!", exampleAr: "إنه المبنى الأحمر الكبير. لن يفوتك!" }
      ],
      mimicChallenge: ["Straight", "Excuse me", "You can't miss it"],
      mimicTip: "Straight = STRATE (حرف واحد فقط — ليست strait-it). Excuse me = ik-SKYOOZ-me"
    },
    grammar: {
      patterns: [{
        name: "How do I get to...? / It's + preposition",
        explanation: "طريقتان لطلب الاتجاهات: 'How do I get to the station?' أو 'Where is the station?' والإجابة باستخدام حروف الجر: It's next to / behind / in front of / on the corner of / between [place] and [place].",
        formula: "How do I get to + [place]? / Where is + [place]? → Go straight / Turn + [direction] + at [landmark]",
        examples: ["How do I get to the train station?", "Turn left at the traffic lights.", "It's on the right, next to the supermarket."],
        exercises: [
          { question: "اسأل: كيف أصل لأقرب مستشفى؟", answer: "How do I get to the nearest hospital?" },
          { question: "أعط توجيه: اسر مستقيماً، ثم اتجه يساراً عند الإشارة الضوئية.", answer: "Go straight, then turn left at the traffic lights." },
          { question: "صف الموقع: المطعم بين البنك والمدرسة.", answer: "The restaurant is between the bank and the school." }
        ]
      }]
    },
    reading: {
      passage: "Excuse me! How do I get to the train station? Go straight for two blocks. Then turn left at the traffic lights. The station is on your right, next to the big hotel. You can't miss it! Thank you so much!",
      breakdown: [
        { sentence: "How do I get to the train station?", words: [{ w: "How do I", ar: "كيف" }, { w: "get to", ar: "أصل إلى" }, { w: "the train station", ar: "محطة القطار" }], meaning: "كيف أصل إلى محطة القطار؟" },
        { sentence: "Go straight for two blocks.", words: [{ w: "Go straight", ar: "اسر مستقيماً" }, { w: "for two blocks", ar: "لمسافة مبنيين" }], meaning: "اسر مستقيماً مسافة مبنيين." },
        { sentence: "The station is on your right, next to the big hotel.", words: [{ w: "on your right", ar: "على يمينك" }, { w: "next to", ar: "بجانب" }, { w: "the big hotel", ar: "الفندق الكبير" }], meaning: "المحطة على يمينك، بجانب الفندق الكبير." }
      ]
    },
    listening: {
      context: "شخص ضائع في مدينة جديدة",
      text: "Excuse me! Where is the nearest pharmacy? Go straight, then turn right. It is next to the bank. You can't miss it!",
      fillText: "Excuse me! Where is the nearest _____? Go straight, then turn _____. It is next to the bank. You can't _____ it!",
      blanks: [
        { before: "nearest", blank: "pharmacy", after: "?" },
        { before: "then turn", blank: "right", after: "." },
        { before: "You can't", blank: "miss", after: "it!" }
      ]
    },
    shadowing: {
      chunk: "Excuse me, how do I get to the station?",
      nativeForm: "ɪkˈskjuːz miː haʊ dʊ aɪ ɡet tə ðə ˈsteɪʃən",
      explanation: "'How do I get to' في الكلام الطبيعي = 'howdəI-geddə' — كل الكلمات تتصل وبعضها يتغير: 'get to' تصبح 'getta'. هذا ما ستسمعه في أي مدينة إنجليزية!",
      steps: ["تدرب على 'Excuse me' بنبرة مؤدبة للاستوقاف", "تدرب على 'How do I get to [place]?' كوحدة واحدة", "صف كيف تصل من بيتك إلى أقرب مكان مهم"],
      youtubeUrl: "https://www.youtube.com/results?search_query=asking+giving+directions+english+beginner+conversation+turn+left+right"
    },
    writing: {
      challenges: ["اكتب توجيهات كاملة لشخص يريد الوصول من بيتك إلى أقرب سوبرماركت (6-8 جمل)", "اكتب حواراً: شخص يسأل عن الطريق وأنت توجهه"],
      companionPrompt: `You are a helpful local guide AND English tutor for a beginner who finished "A1 Day 22" (Directions).
RULES:
1. ONLY use: turn left/right, go straight, corner, next to, behind, in front of, between, traffic lights, block, you can't miss it, excuse me, how do I get to, on your left/right
2. Create a neighborhood map scenario — help the student navigate to different places
3. If they confuse left/right or use wrong prepositions, correct gently with a visual cue
4. Make it feel like a real street conversation
5. Start: "Hello! You look a bit lost! Where are you trying to go? Maybe I can help!"`
    }
  },

  {
    id: 23,
    title: "Public Transport",
    titleAr: "المواصلات العامة",
    subtitle: "Buses, Trains & Getting Around",
    subtitleAr: "الحافلات والقطارات والتنقل",
    vocabulary: {
      intro: "المواصلات العامة في أي بلد — تحتاج هذه الكلمات من اليوم الأول!",
      words: [
        { word: "Bus / Train / Taxi", ipa: "/bʌs/ /treɪn/ /ˈtæksi/", arabic: "حافلة / قطار / تاكسي", phonetic: "بَس / تِرين / تاكسي", example: "I take the bus to school.", exampleAr: "آخذ الحافلة للمدرسة." },
        { word: "Ticket", ipa: "/ˈtɪkɪt/", arabic: "تذكرة", phonetic: "تِكِت", example: "One ticket to the city center, please.", exampleAr: "تذكرة واحدة لمركز المدينة من فضلك." },
        { word: "Station / Stop", ipa: "/ˈsteɪʃən/ /stɒp/", arabic: "محطة / موقف", phonetic: "ستِيشَن / ستوب", example: "The bus stop is near my house.", exampleAr: "موقف الحافلة قريب من بيتي." },
        { word: "Get on / Get off", ipa: "/ɡet ɒn/ /ɡet ɒf/", arabic: "يصعد / ينزل", phonetic: "غيت أون / غيت أوف", example: "Get on at the first stop, get off at the third.", exampleAr: "اصعد عند الموقف الأول، انزل عند الثالث." },
        { word: "How long does it take?", ipa: "/haʊ lɒŋ dʌz ɪt teɪk/", arabic: "كم يستغرق؟", phonetic: "هاو لونغ دَز إت تِيك", example: "How long does the bus ride take?", exampleAr: "كم يستغرق ركوب الحافلة؟" },
        { word: "Single / Return", ipa: "/ˈsɪŋɡəl/ /rɪˈtɜːrn/", arabic: "ذهاب فقط / ذهاب وإياب", phonetic: "سينغَل / ريتُرن", example: "A return ticket, please.", exampleAr: "تذكرة ذهاب وإياب من فضلك." }
      ],
      mimicChallenge: ["Station", "Ticket", "How long does it take"],
      mimicTip: "Station = STAY-shən (مش sta-TI-on). How long does it take = haulongdezittake (كله متصل!)"
    },
    grammar: {
      patterns: [{
        name: "How do I get to...? / Does this bus go to...?",
        explanation: "في وسائل النقل ستحتاج: 'Does this bus/train go to [place]?' = هل هذه الحافلة تذهب لـ...؟ الإجابة: 'Yes, it does' أو 'No, you need bus number [X]'. وأيضاً: 'How long does it take?' = كم يستغرق؟",
        formula: "Does this [bus/train] go to + [place]? → Yes, it does / No, take [number/line]",
        examples: ["Does this bus go to the city center? — Yes, it does.", "How long does it take? — About 20 minutes.", "Which bus goes to the airport?"],
        exercises: [
          { question: "اسأل: هل هذا القطار يذهب لمطار الملكة علياء؟", answer: "Does this train go to the airport?" },
          { question: "اسأل: كم يستغرق الوصول للمركز؟", answer: "How long does it take to get to the city center?" },
          { question: "اطلب تذكرة: تذكرة واحدة ذهاب وإياب لمحطة الشمال.", answer: "One return ticket to the north station, please." }
        ]
      }]
    },
    reading: {
      passage: "I take the bus to university every day. I buy a monthly ticket — it is cheap and easy. I get on at the first stop near my house. The ride takes about thirty minutes. I get off at the university stop. I love public transport!",
      breakdown: [
        { sentence: "I buy a monthly ticket — it is cheap and easy.", words: [{ w: "I buy", ar: "أشتري" }, { w: "a monthly ticket", ar: "تذكرة شهرية" }, { w: "cheap", ar: "رخيصة" }, { w: "easy", ar: "سهلة" }], meaning: "أشتري تذكرة شهرية — إنها رخيصة وسهلة." },
        { sentence: "I get on at the first stop near my house.", words: [{ w: "I get on", ar: "أصعد" }, { w: "at the first stop", ar: "عند الموقف الأول" }, { w: "near my house", ar: "قريب من بيتي" }], meaning: "أصعد عند الموقف الأول القريب من بيتي." },
        { sentence: "The ride takes about thirty minutes.", words: [{ w: "The ride", ar: "الرحلة" }, { w: "takes", ar: "تستغرق" }, { w: "about", ar: "تقريباً" }, { w: "thirty minutes", ar: "ثلاثين دقيقة" }], meaning: "الرحلة تستغرق تقريباً ثلاثين دقيقة." }
      ]
    },
    listening: {
      context: "في محطة الحافلات",
      text: "Excuse me, does this bus go to the city center? Yes it does! How long does it take? About 20 minutes. Thank you!",
      fillText: "Excuse me, does this bus go to the city _____? Yes it _____! How long does it _____? About 20 minutes.",
      blanks: [
        { before: "go to the city", blank: "center", after: "?" },
        { before: "Yes it", blank: "does", after: "!" },
        { before: "How long does it", blank: "take", after: "?" }
      ]
    },
    shadowing: {
      chunk: "Does this bus go to the city center?",
      nativeForm: "dʌz ðɪs bʌs ɡoʊ tə ðə ˈsɪti ˈsentər?",
      explanation: "'Does this bus' في الكلام الطبيعي = 'dəzðɪsbʌs' — كل الكلمات تتصل. و'go to' = 'gotta' خفيفة. هذه الجملة ستقولها في أي بلد تزوره!",
      steps: ["تدرب: Does this [bus/train] go to [place]?", "جرب مع وسائل نقل مختلفة: bus/train/metro", "تخيل أنك في محطة — اسأل واجب على نفسك"],
      youtubeUrl: "https://www.youtube.com/results?search_query=public+transport+english+conversation+bus+train+beginner+ticket"
    },
    writing: {
      challenges: ["اكتب كيف تذهب من بيتك إلى الجامعة/العمل يومياً (وسيلة النقل + الوقت + المحطات)", "اكتب حواراً في محطة تذاكر: تشتري تذكرة وتسأل عن المواعيد"],
      companionPrompt: `You are a bus driver AND English tutor for a beginner who finished "A1 Day 23" (Public Transport).
RULES:
1. ONLY use: bus, train, taxi, ticket, station, stop, get on/off, how long, single/return, does this go to, platform, schedule, price
2. Play transport scenarios: buying tickets, asking about routes, getting directions on the bus
3. Correct naturally: if they say "I take on the bus" → "We say 'I get ON the bus' or 'I take the bus'"
4. Make it feel like real travel
5. Start: "Welcome aboard! Where are you headed today?"`
    }
  },

  {
    id: 24,
    title: "At the Market",
    titleAr: "في السوق",
    subtitle: "Buying Food & Groceries",
    subtitleAr: "شراء الطعام والبقالة",
    vocabulary: {
      intro: "السوق والبقالة — هذا الدرس ستستخدمه كل يوم في حياتك!",
      words: [
        { word: "Apple / Banana / Orange", ipa: "/ˈæpəl/ /bəˈnɑːnə/ /ˈɒrɪndʒ/", arabic: "تفاحة / موزة / برتقالة", phonetic: "أبَل / بنانا / أورِنج", example: "I need two kilos of apples.", exampleAr: "أحتاج كيلوين من التفاح." },
        { word: "Kilo / Gram", ipa: "/ˈkiːloʊ/ /ɡræm/", arabic: "كيلو / غرام", phonetic: "كيلو / غرام", example: "Give me half a kilo of tomatoes.", exampleAr: "أعطني نصف كيلو طماطم." },
        { word: "Fresh", ipa: "/freʃ/", arabic: "طازج", phonetic: "فريش", example: "Are these vegetables fresh?", exampleAr: "هل هذه الخضروات طازجة؟" },
        { word: "I need / Give me", ipa: "/aɪ niːd/ /ɡɪv miː/", arabic: "أحتاج / أعطني", phonetic: "آي نيد / غِف مي", example: "I need bread and milk. Give me a liter of milk.", exampleAr: "أحتاج خبز وحليب. أعطني لتر حليب." },
        { word: "How much is...?", ipa: "/haʊ mʌtʃ ɪz/", arabic: "كم سعر...؟", phonetic: "هاو مَتش إز", example: "How much is a kilo of oranges?", exampleAr: "كم سعر كيلو البرتقال؟" },
        { word: "Change", ipa: "/tʃeɪndʒ/", arabic: "فكة / باقي المبلغ", phonetic: "تشِينج", example: "Here is your change.", exampleAr: "هذا باقي مبلغك." }
      ],
      mimicChallenge: ["Vegetables", "Fresh", "How much is it?"],
      mimicTip: "Vegetables = VEJ-tə-bəlz (3 مقاطع في الكلام العادي — ليس 4!)"
    },
    grammar: {
      patterns: [{
        name: "Countable vs Uncountable — كيف نسأل عن الكميات؟",
        explanation: "بعض الأشياء نعدها (apples, oranges = countable) وبعضها لا (water, milk, rice = uncountable). مع المعدود: 'How many?' ومع غير المعدود: 'How much?' مثال: How many apples? / How much milk?",
        formula: "How many + [countable]? / How much + [uncountable]?",
        examples: ["How many apples do you need? — Three.", "How much milk do you want? — One liter.", "Give me some bread and two oranges."],
        exercises: [
          { question: "many أو much؟ How ___ rice do you want?", answer: "much (rice = غير معدود)" },
          { question: "many أو much؟ How ___ eggs do you need?", answer: "many (eggs = معدودة)" },
          { question: "اطلب: أريد كيلو موز وزجاجة ماء.", answer: "I'd like a kilo of bananas and a bottle of water, please." }
        ]
      }]
    },
    reading: {
      passage: "I go to the market every Saturday. I buy fresh vegetables and fruit. Today I need tomatoes, apples, and milk. I ask the seller: 'How much is a kilo of tomatoes?' He says: 'Two dollars.' I give him five dollars and he gives me the change.",
      breakdown: [
        { sentence: "Today I need tomatoes, apples, and milk.", words: [{ w: "Today", ar: "اليوم" }, { w: "I need", ar: "أحتاج" }, { w: "tomatoes", ar: "طماطم" }, { w: "apples", ar: "تفاح" }, { w: "milk", ar: "حليب" }], meaning: "اليوم أحتاج طماطم وتفاح وحليب." },
        { sentence: "How much is a kilo of tomatoes?", words: [{ w: "How much", ar: "كم" }, { w: "is", ar: "سعر" }, { w: "a kilo", ar: "كيلو" }, { w: "of tomatoes", ar: "من الطماطم" }], meaning: "كم سعر كيلو الطماطم؟" },
        { sentence: "He gives me the change.", words: [{ w: "He gives", ar: "يعطيني" }, { w: "me", ar: "لي" }, { w: "the change", ar: "الباقي" }], meaning: "يعطيني باقي المبلغ." }
      ]
    },
    listening: {
      context: "في سوق الخضار",
      text: "Hello! How much are these apples? One dollar per kilo. Give me two kilos please. Here you go! Here is your change.",
      fillText: "Hello! How _____ are these apples? One dollar per _____. Give me two _____ please. Here you go! Here is your _____.",
      blanks: [
        { before: "How", blank: "much", after: "are these apples?" },
        { before: "One dollar per", blank: "kilo", after: "." },
        { before: "Give me two", blank: "kilos", after: "please." },
        { before: "Here is your", blank: "change", after: "." }
      ]
    },
    shadowing: {
      chunk: "How much is a kilo of oranges?",
      nativeForm: "haʊ mʌtʃ ɪz ə ˈkiːloʊ əv ˈɒrɪndʒɪz?",
      explanation: "'How much is a' في الكلام الطبيعي = 'haʊmʌtʃɪzə' — كل الكلمات تتصل. و'of' تصبح 'əv' خفيفة جداً. هذه الجملة ستستخدمها في كل سوق!",
      steps: ["تدرب: How much is a [product]? — قلها 5 مرات بمنتجات مختلفة", "تدرب على: Give me [quantity] of [product], please", "اعمل قائمة تسوق خيالية وتسوق معي بالإنجليزية"],
      youtubeUrl: "https://www.youtube.com/results?search_query=market+shopping+food+english+conversation+how+much+beginner"
    },
    writing: {
      challenges: ["اكتب قائمة تسوق من 8 أشياء بالإنجليزية مع الكميات (مثال: 2 kilos of apples)", "اكتب حواراً في السوق: تشتري الخضروات والفاكهة وتدفع"],
      companionPrompt: `You are a friendly market seller AND English tutor for a beginner who finished "A1 Day 24" (Market Shopping).
RULES:
1. ONLY use: apple, banana, orange, tomato, bread, milk, rice, fresh, kilo, gram, liter, how much, how many, I need/want, give me, change, price, total, cheap/expensive
2. Run a market scenario: the student shops and you're the seller
3. Teach how many vs how much naturally during the shopping
4. Be lively and market-like
5. Start: "Good morning! Welcome to my fresh market! What do you need today? We have the freshest vegetables!"`
    }
  },

  {
    id: 25,
    title: "Technology & Phones",
    titleAr: "التكنولوجيا والهواتف",
    subtitle: "Talking About Devices & the Internet",
    subtitleAr: "الحديث عن الأجهزة والإنترنت",
    vocabulary: {
      intro: "التكنولوجيا هي لغة القرن الواحد والعشرين — يلا نتعلم كيف نتحدث عنها!",
      words: [
        { word: "Smartphone", ipa: "/ˈsmɑːrtfoʊn/", arabic: "هاتف ذكي", phonetic: "سمارت-فون", example: "I use my smartphone all day!", exampleAr: "أستخدم هاتفي الذكي طول اليوم!" },
        { word: "Charge / Battery", ipa: "/tʃɑːrdʒ/ /ˈbæteri/", arabic: "يشحن / بطارية", phonetic: "تشارج / باتيري", example: "My battery is low. I need to charge it.", exampleAr: "بطاريتي ضعيفة. أحتاج لشحنها." },
        { word: "App", ipa: "/æp/", arabic: "تطبيق", phonetic: "أب", example: "What app do you use for learning English?", exampleAr: "ما التطبيق الذي تستخدمه لتعلم الإنجليزية؟" },
        { word: "Message / Call", ipa: "/ˈmesɪdʒ/ /kɔːl/", arabic: "رسالة / مكالمة", phonetic: "ميسِج / كول", example: "I sent you a message. Did you call me?", exampleAr: "أرسلت لك رسالة. هل اتصلت بي؟" },
        { word: "Internet / Wi-Fi", ipa: "/ˈɪntərnet/ /ˈwaɪfaɪ/", arabic: "إنترنت / واي فاي", phonetic: "إنتَرنيت / وايفاي", example: "Is the Wi-Fi working here?", exampleAr: "هل الواي فاي يعمل هنا؟" },
        { word: "Download / Upload", ipa: "/ˈdaʊnloʊd/ /ˈʌploʊd/", arabic: "تحميل / رفع", phonetic: "داونلود / أبلود", example: "I need to download this app.", exampleAr: "أحتاج لتحميل هذا التطبيق." }
      ],
      mimicChallenge: ["Smartphone", "Battery", "Wi-Fi"],
      mimicTip: "Battery = BAT-uh-ree (3 مقاطع). في الكلام الأمريكي السريع تصبح BAD-uh-ree"
    },
    grammar: {
      patterns: [{
        name: "Can you / Could you...? — طلب المساعدة بأدب",
        explanation: "'Can you help me?' = مباشر. 'Could you help me?' = أكثر أدباً. لطلب المساعدة في الأمور التكنولوجية نقول: 'Can you send me the file?' أو 'Could you share the Wi-Fi password?'",
        formula: "Can you / Could you + [verb] + [object]?",
        examples: ["Can you send me the link?", "Could you share the Wi-Fi password?", "Can you call me later?"],
        exercises: [
          { question: "اطلب بأدب: هل تستطيع إرسال الرسالة لي؟", answer: "Could you send me the message?" },
          { question: "اطلب: هل تستطيع مشاركة كلمة سر الواي فاي؟", answer: "Can/Could you share the Wi-Fi password?" },
          { question: "صحّح: 'Can you to help me?'", answer: "Can you help me? (بعد can لا نستخدم to)" }
        ]
      }]
    },
    reading: {
      passage: "I use technology every day. I have a smartphone and a laptop. In the morning, I check my messages and emails. I use apps for studying English and watching videos. Sometimes the Wi-Fi is slow and I get frustrated! I charge my phone every night.",
      breakdown: [
        { sentence: "I check my messages and emails.", words: [{ w: "I check", ar: "أتحقق من" }, { w: "my messages", ar: "رسائلي" }, { w: "and emails", ar: "والإيميلات" }], meaning: "أتحقق من رسائلي وإيميلاتي." },
        { sentence: "I use apps for studying English and watching videos.", words: [{ w: "I use apps", ar: "أستخدم تطبيقات" }, { w: "for studying", ar: "للدراسة" }, { w: "English", ar: "الإنجليزية" }, { w: "and watching", ar: "ومشاهدة" }, { w: "videos", ar: "مقاطع فيديو" }], meaning: "أستخدم تطبيقات لدراسة الإنجليزية ومشاهدة الفيديوهات." },
        { sentence: "I charge my phone every night.", words: [{ w: "I charge", ar: "أشحن" }, { w: "my phone", ar: "هاتفي" }, { w: "every night", ar: "كل ليلة" }], meaning: "أشحن هاتفي كل ليلة." }
      ]
    },
    listening: {
      context: "صديقان يتحدثان عن الهاتف",
      text: "My battery is almost dead. Can I charge my phone here? Of course! The charger is on the table. Is the Wi-Fi working?",
      fillText: "My _____ is almost dead. Can I _____ my phone here? Of course! The charger is on the table. Is the _____ working?",
      blanks: [
        { before: "My", blank: "battery", after: "is almost dead." },
        { before: "Can I", blank: "charge", after: "my phone here?" },
        { before: "Is the", blank: "Wi-Fi", after: "working?" }
      ]
    },
    shadowing: {
      chunk: "My battery is almost dead",
      nativeForm: "maɪ ˈbæteri ɪz ˈɔːlmoʊst ded",
      explanation: "'Almost dead' = أولموست-ديد — كلمة 'almost' الضغط على الأول: AL-most. و'dead' هنا تعني البطارية فارغة تماماً (صفر%)! هذه جملة حديثة جداً ويستخدمها الجميع.",
      steps: ["قل: My battery is almost dead — بنبرة قلقة!", "تدرب: My [phone/laptop] is almost dead", "صف وضع هاتفك الآن: شحنه كم؟"],
      youtubeUrl: "https://www.youtube.com/results?search_query=technology+vocabulary+english+smartphone+internet+beginner"
    },
    writing: {
      challenges: ["اكتب عن كيفية استخدامك للتكنولوجيا في يومك (3-4 جمل — متى تستخدم هاتفك؟ لماذا؟)", "اكتب عن تطبيقك المفضل — ما هو ولماذا تحبه؟"],
      companionPrompt: `You are a tech-savvy English tutor for a beginner who finished "A1 Day 25" (Technology).
RULES:
1. ONLY use: smartphone, laptop, battery, charge, app, message, call, internet, Wi-Fi, download, send, use, broken, slow, fast, can/could you
2. Talk about technology naturally — what apps they use, how much time on phone
3. If they say "I am use my phone" correct to "I use my phone"
4. Make it relatable and modern
5. Start: "Hello! Quick question — is your phone charged? 😄 How much battery do you have right now?"`
    }
  },

  {
    id: 26,
    title: "Animals & Nature",
    titleAr: "الحيوانات والطبيعة",
    subtitle: "Describing Animals & the Natural World",
    subtitleAr: "وصف الحيوانات والعالم الطبيعي",
    vocabulary: {
      intro: "الطبيعة والحيوانات — موضوع يحبه الجميع من الأطفال للكبار!",
      words: [
        { word: "Cat / Dog", ipa: "/kæt/ /dɒɡ/", arabic: "قط / كلب", phonetic: "كات / دوغ", example: "I have a cat and a dog at home.", exampleAr: "عندي قط وكلب في البيت." },
        { word: "Lion / Tiger", ipa: "/ˈlaɪən/ /ˈtaɪɡər/", arabic: "أسد / نمر", phonetic: "لايَن / تايغَر", example: "The lion is the king of the jungle!", exampleAr: "الأسد هو ملك الغابة!" },
        { word: "Bird / Eagle", ipa: "/bɜːrd/ /ˈiːɡəl/", arabic: "طائر / نسر", phonetic: "بُرد / إيغَل", example: "The eagle flies very high.", exampleAr: "النسر يطير عالياً جداً." },
        { word: "Forest / Mountain", ipa: "/ˈfɒrɪst/ /ˈmaʊntən/", arabic: "غابة / جبل", phonetic: "فوريست / ماونتَن", example: "I love hiking in the mountains.", exampleAr: "أحب المشي في الجبال." },
        { word: "Wild / Domestic", ipa: "/waɪld/ /dəˈmestɪk/", arabic: "بري / أليف", phonetic: "وايلد / دوميستيك", example: "Cats and dogs are domestic animals.", exampleAr: "القطط والكلاب حيوانات أليفة." },
        { word: "Beautiful / Dangerous", ipa: "/ˈbjuːtɪfəl/ /ˈdeɪndʒərəs/", arabic: "جميل / خطير", phonetic: "بيوتيفول / دِينجَرَس", example: "Lions are beautiful but dangerous.", exampleAr: "الأسود جميلة لكنها خطيرة." }
      ],
      mimicChallenge: ["Dangerous", "Mountain", "Eagle"],
      mimicTip: "Dangerous = DAN-jer-us (3 مقاطع). Mountain = MOUN-tən (الـ ain تصبح 'ən' في الكلام الطبيعي)"
    },
    grammar: {
      patterns: [{
        name: "Adjectives with but / and — الصفات المتناقضة والمكملة",
        explanation: "نستخدم 'and' لجمع صفتين متشابهتين: big and strong. ونستخدم 'but' لجمع صفتين متناقضتين: beautiful but dangerous. هذا النمط يجعل جملتك أكثر تعبيراً وطبيعية!",
        formula: "[Subject] is + [adj] and [adj] / [adj] but [adj]",
        examples: ["Elephants are big and strong.", "Lions are beautiful but dangerous.", "Cats are small but smart."],
        exercises: [
          { question: "صف الأسد: جميل + خطير", answer: "Lions are beautiful but dangerous." },
          { question: "صف الفيل: كبير + ذكي", answer: "Elephants are big and intelligent/smart." },
          { question: "صف حيوانك المفضل بصفتين.", answer: "(إجابة حرة — مثال: Dogs are friendly and loyal.)" }
        ]
      }]
    },
    reading: {
      passage: "I love animals! I have a cat at home. Her name is Mimi. She is small and white. In nature, I love eagles. They are beautiful and powerful. My dream is to visit Africa and see wild animals like lions and elephants!",
      breakdown: [
        { sentence: "She is small and white.", words: [{ w: "She is", ar: "هي" }, { w: "small", ar: "صغيرة" }, { w: "and", ar: "و" }, { w: "white", ar: "بيضاء" }], meaning: "هي صغيرة وبيضاء." },
        { sentence: "They are beautiful and powerful.", words: [{ w: "They are", ar: "هم/هي (جمع)" }, { w: "beautiful", ar: "جميلة" }, { w: "and", ar: "و" }, { w: "powerful", ar: "قوية" }], meaning: "هي جميلة وقوية." },
        { sentence: "My dream is to visit Africa and see wild animals.", words: [{ w: "My dream", ar: "حلمي" }, { w: "is to visit", ar: "هو زيارة" }, { w: "Africa", ar: "أفريقيا" }, { w: "wild animals", ar: "حيوانات برية" }], meaning: "حلمي هو زيارة أفريقيا ورؤية الحيوانات البرية." }
      ]
    },
    listening: {
      context: "طفل يتحدث عن حيوانه المفضل",
      text: "My favorite animal is the dolphin. Dolphins are smart and friendly. They live in the ocean and they can jump very high!",
      fillText: "My favorite animal is the _____. Dolphins are smart and _____. They live in the _____ and they can jump very high!",
      blanks: [
        { before: "is the", blank: "dolphin", after: "." },
        { before: "smart and", blank: "friendly", after: "." },
        { before: "They live in the", blank: "ocean", after: "." }
      ]
    },
    shadowing: {
      chunk: "Lions are beautiful but dangerous",
      nativeForm: "ˈlaɪənz ər ˈbjuːtɪfəl bʌt ˈdeɪndʒərəs",
      explanation: "'Lions are' = laɪənz-ər (تتصلان). و'beautiful but' — الـ l في 'beautiful' و b في 'but' يلتقيان بشكل سلس: byootiful-but. كلمة 'but' هنا تحمل تقابلاً — انطقها بتأكيد خفيف!",
      steps: ["تدرب على النمط: [Animal] is/are [adj] but [adj]", "صف 3 حيوانات بنفس النمط", "صف حيوانك المفضل بأكثر تفصيل"],
      youtubeUrl: "https://www.youtube.com/results?search_query=animals+nature+english+vocabulary+adjectives+beginner+wild+domestic"
    },
    writing: {
      challenges: ["اكتب عن حيوانك المفضل: لماذا تحبه؟ ما صفاته؟ أين يعيش؟ (3-4 جمل)", "هل عندك حيوان أليف؟ صفه. إذا لم يكن — ما الحيوان الذي تريد أن تمتلكه ولماذا؟"],
      companionPrompt: `You are a nature enthusiast English tutor for a beginner who finished "A1 Day 26" (Animals & Nature).
RULES:
1. ONLY use: cat, dog, lion, eagle, elephant, dolphin, forest, mountain, ocean, wild/domestic, beautiful/dangerous, big/small/fast/smart, I have, I love, they are, it can
2. Talk about favorite animals, pets, nature
3. Teach 'but' vs 'and' naturally through the conversation
4. React with genuine enthusiasm about animals
5. Start: "Hello animal lover! Do you have any pets? 🐱🐶 Or what's your favorite wild animal?"`
    }
  },

  {
    id: 27,
    title: "Weekend Plans",
    titleAr: "خطط عطلة نهاية الأسبوع",
    subtitle: "Making Plans & Talking About the Future",
    subtitleAr: "عمل الخطط والتحدث عن المستقبل",
    vocabulary: {
      intro: "الجميع يحب عطلة نهاية الأسبوع — يلا نتعلم كيف نخطط لها بالإنجليزية!",
      words: [
        { word: "Plan", ipa: "/plæn/", arabic: "يخطط / خطة", phonetic: "بلان", example: "What are your plans for the weekend?", exampleAr: "ما خططك لعطلة الأسبوع؟" },
        { word: "Go out", ipa: "/ɡoʊ aʊt/", arabic: "يخرج", phonetic: "غو أوت", example: "Let's go out on Friday night!", exampleAr: "يلا نخرج ليلة الجمعة!" },
        { word: "Visit", ipa: "/ˈvɪzɪt/", arabic: "يزور", phonetic: "فِزِت", example: "I'm going to visit my grandparents.", exampleAr: "سأزور جدي وجدتي." },
        { word: "Movie", ipa: "/ˈmuːvi/", arabic: "فيلم", phonetic: "موفي", example: "Do you want to watch a movie tonight?", exampleAr: "هل تريد مشاهدة فيلم الليلة؟" },
        { word: "I'm going to...", ipa: "/aɪm ˈɡoʊɪŋ tə/", arabic: "سأ... (خطة مستقبلية)", phonetic: "آيم غوينغ تو", example: "I'm going to sleep early tonight.", exampleAr: "سأنام مبكراً الليلة." },
        { word: "Let's", ipa: "/lets/", arabic: "يلا / هيا", phonetic: "لِيتس", example: "Let's meet at the café at 6!", exampleAr: "يلا نلتقي في المقهى الساعة 6!" }
      ],
      mimicChallenge: ["I'm going to", "Let's", "Plans"],
      mimicTip: "'I'm going to' في الكلام العادي تصبح 'I'm gonna' — هذا طبيعي جداً في الإنجليزية المحكية!"
    },
    grammar: {
      patterns: [{
        name: "Going to — التعبير عن المستقبل المخطط له",
        explanation: "'I'm going to + فعل' = خطة مستقبلية محددة. هذا هو أسهل طريقة للتحدث عن المستقبل في الإنجليزية! مثال: I'm going to watch a movie. She's going to visit her family. هل لاحظت؟ مع He/She نستخدم 'is going to'.",
        formula: "I'm going to + [verb] / He/She is going to + [verb]",
        examples: ["I'm going to watch a movie tomorrow.", "She is going to visit her family this weekend.", "We're going to go to the beach on Sunday."],
        exercises: [
          { question: "ترجم: سأزور صديقي يوم السبت.", answer: "I'm going to visit my friend on Saturday." },
          { question: "أكمل: She ___ going to cook dinner tonight.", answer: "is" },
          { question: "اسأل: ما خططك لغد؟", answer: "What are you going to do tomorrow?" }
        ]
      }]
    },
    reading: {
      passage: "This weekend is going to be great! On Saturday, I'm going to go to the cinema with my sister. Then we are going to eat at a restaurant. On Sunday, I'm going to visit my grandparents. I can't wait!",
      breakdown: [
        { sentence: "I'm going to go to the cinema with my sister.", words: [{ w: "I'm going to", ar: "سأ..." }, { w: "go to the cinema", ar: "أذهب للسينما" }, { w: "with my sister", ar: "مع أختي" }], meaning: "سأذهب للسينما مع أختي." },
        { sentence: "Then we are going to eat at a restaurant.", words: [{ w: "Then", ar: "ثم" }, { w: "we are going to", ar: "سنـ..." }, { w: "eat", ar: "نأكل" }, { w: "at a restaurant", ar: "في مطعم" }], meaning: "ثم سنأكل في مطعم." },
        { sentence: "I can't wait!", words: [{ w: "I can't wait", ar: "لا أستطيع الانتظار (متحمس جداً)" }], meaning: "أنا متحمس جداً!" }
      ]
    },
    listening: {
      context: "صديقان يخططان لعطلة الأسبوع",
      text: "What are you going to do this weekend? I'm going to go to the park and watch a movie. Sounds fun! Let's meet at the park at 3!",
      fillText: "What are you going to do this _____? I'm going to go to the park and _____ a movie. Sounds fun! Let's _____ at the park at 3!",
      blanks: [
        { before: "do this", blank: "weekend", after: "?" },
        { before: "park and", blank: "watch", after: "a movie." },
        { before: "Let's", blank: "meet", after: "at the park at 3!" }
      ]
    },
    shadowing: {
      chunk: "I'm gonna visit my family this weekend",
      nativeForm: "aɪm ˈɡɒnə ˈvɪzɪt maɪ ˈfæmɪli ðɪs ˈwiːkend",
      explanation: "'I'm going to' → 'I'm gonna' هذا ليس خطأً — هذا الكلام الطبيعي! كل المتحدثين الأصليين يقولون 'gonna' في المحادثة. في الكتابة والرسمي تظل 'going to'.",
      steps: ["تدرب: I'm going to → I'm gonna (كلاهما صحيح)", "قل خططك لهذا الأسبوع باستخدام 'gonna'", "تخيل أنك تحكي لصديقك عن خططك"],
      youtubeUrl: "https://www.youtube.com/results?search_query=going+to+future+plans+english+weekend+beginner+gonna"
    },
    writing: {
      challenges: ["اكتب خططك لعطلة الأسبوع القادم بالتفصيل — يوم السبت والأحد (4-6 جمل)", "اكتب دعوة لصديقك للخروج معك — أين؟ متى؟ ماذا ستفعلان؟"],
      companionPrompt: `You are an excited friend AND English tutor for a beginner who finished "A1 Day 27" (Weekend Plans).
RULES:
1. ONLY use: plan, go out, visit, movie, park, meet, let's, I'm going to/gonna, this weekend, on Saturday/Sunday, what about you, sounds fun, I can't wait
2. Make plans together for the weekend — suggest activities and negotiate
3. Naturally use 'going to' and teach 'gonna' as its natural spoken form
4. Be enthusiastic and friendly
5. Start: "Hey! It's almost the weekend! 🎉 What are you going to do? I need plans!"`
    }
  },

  {
    id: 28,
    title: "Describing People",
    titleAr: "وصف الناس",
    subtitle: "Physical Appearance & Personality",
    subtitleAr: "المظهر الخارجي والشخصية",
    vocabulary: {
      intro: "عندما تريد تتحدث عن شخص ما — كيف تصفه بالإنجليزية؟ يلا نتعلم!",
      words: [
        { word: "Tall / Short", ipa: "/tɔːl/ /ʃɔːrt/", arabic: "طويل / قصير", phonetic: "تول / شورت", example: "My brother is tall, but I am short.", exampleAr: "أخي طويل لكنني قصير." },
        { word: "Hair", ipa: "/heər/", arabic: "شعر", phonetic: "هير", example: "She has long black hair.", exampleAr: "لديها شعر طويل أسود." },
        { word: "Eyes", ipa: "/aɪz/", arabic: "عيون", phonetic: "آيز", example: "He has beautiful blue eyes.", exampleAr: "عيونه زرقاء جميلة." },
        { word: "Friendly / Kind", ipa: "/ˈfrendli/ /kaɪnd/", arabic: "ودود / لطيف", phonetic: "فِريندلي / كايند", example: "My teacher is very kind and friendly.", exampleAr: "معلمتي لطيفة وودودة جداً." },
        { word: "Funny / Serious", ipa: "/ˈfʌni/ /ˈsɪriəs/", arabic: "مضحك / جاد", phonetic: "فَني / سِيريَس", example: "My friend is very funny. My boss is serious.", exampleAr: "صديقي مضحك جداً. مديري جاد." },
        { word: "He/She looks like...", ipa: "/lʊks laɪk/", arabic: "يشبه / تبدو كـ...", phonetic: "لوكس لايك", example: "She looks like her mother.", exampleAr: "تشبه أمها." }
      ],
      mimicChallenge: ["Friendly", "Serious", "She looks like"],
      mimicTip: "Friendly = FREND-lee (مش FRI-end-lee). Serious = SEE-ree-us (3 مقاطع)"
    },
    grammar: {
      patterns: [{
        name: "She has + [feature] / She is + [personality]",
        explanation: "لوصف المظهر نستخدم 'has': She HAS brown eyes / He HAS short hair. لوصف الشخصية نستخدم 'is': She IS kind / He IS funny. لا تخلط بينهما! HAS = يمتلك. IS = يكون/صفة.",
        formula: "He/She has + [physical feature] / He/She is + [personality adjective]",
        examples: ["She has long brown hair.", "He has green eyes.", "She is very kind and funny.", "He is quiet but smart."],
        exercises: [
          { question: "has أو is؟ My sister ___ blue eyes.", answer: "has (عيون = ميزة يمتلكها)" },
          { question: "has أو is؟ My teacher ___ very kind.", answer: "is (kind = صفة شخصية)" },
          { question: "صف شخصاً تحبه بجملتين: مظهر + شخصية", answer: "(إجابة حرة — مثال: She has short hair. She is funny and kind.)" }
        ]
      }]
    },
    reading: {
      passage: "My best friend is Sara. She is tall and slim. She has long dark hair and brown eyes. She is very friendly and funny. She always makes me laugh! Sara is also very smart — she studies hard. I am lucky to have a friend like her.",
      breakdown: [
        { sentence: "She is tall and slim.", words: [{ w: "She is", ar: "هي" }, { w: "tall", ar: "طويلة" }, { w: "and", ar: "و" }, { w: "slim", ar: "نحيفة" }], meaning: "هي طويلة ونحيفة." },
        { sentence: "She has long dark hair and brown eyes.", words: [{ w: "She has", ar: "لديها" }, { w: "long dark hair", ar: "شعر طويل داكن" }, { w: "and", ar: "و" }, { w: "brown eyes", ar: "عيون بنية" }], meaning: "لديها شعر طويل داكن وعيون بنية." },
        { sentence: "She always makes me laugh!", words: [{ w: "She always", ar: "دائماً" }, { w: "makes me", ar: "تجعلني" }, { w: "laugh", ar: "أضحك" }], meaning: "دائماً تجعلني أضحك!" }
      ]
    },
    listening: {
      context: "شخص يصف صديقه لشخص آخر",
      text: "My brother is tall with short hair. He has green eyes. He is very kind and funny. Everyone loves him!",
      fillText: "My brother is _____ with short hair. He has green _____. He is very kind and _____. Everyone loves him!",
      blanks: [
        { before: "My brother is", blank: "tall", after: "with short hair." },
        { before: "He has green", blank: "eyes", after: "." },
        { before: "He is very kind and", blank: "funny", after: "." }
      ]
    },
    shadowing: {
      chunk: "She has long dark hair and brown eyes",
      nativeForm: "ʃi hæz lɒŋ dɑːrk heər ænd braʊn aɪz",
      explanation: "'She has' = ʃihæz (تتصلان في الكلام الطبيعي). و'and' بين الصفات تصبح 'ən' خفيفة. الجملة كلها تجري بسلاسة: شي-هاز-لونغ-دارك-هير-ən-براون-آيز",
      steps: ["تدرب على 'She has / He has' كوحدة واحدة", "صف مظهر شخص تعرفه", "الآن أضف وصف شخصيته — استخدم 'and she/he is'"],
      youtubeUrl: "https://www.youtube.com/results?search_query=describing+people+appearance+personality+english+beginner+vocabulary"
    },
    writing: {
      challenges: ["صف أفضل صديق لك: مظهره + شخصيته + لماذا تحبه (4-5 جمل)", "صف نفسك للقارئ — المظهر والشخصية (3-4 جمل)"],
      companionPrompt: `You are a curious friend AND English tutor for a beginner who finished "A1 Day 28" (Describing People).
RULES:
1. ONLY use: tall/short, hair (color/length), eyes, slim/heavy, young/old, friendly/kind/funny/serious/quiet/smart, has/is, looks like, best friend, family member
2. Ask the student to describe people they know — friend, family member, celebrity
3. Correct 'has' vs 'is' confusion gently
4. Be interested and ask follow-up questions
5. Start: "Hello! I want to know about the people in your life. Can you describe your best friend or a family member?"`
    }
  },

  {
    id: 29,
    title: "Celebrations & Special Days",
    titleAr: "الاحتفالات والمناسبات الخاصة",
    subtitle: "Birthdays, Holidays & Saying Congratulations",
    subtitleAr: "أعياد الميلاد والأعياد وقول التهاني",
    vocabulary: {
      intro: "الاحتفالات هي لحظات السعادة — تعلم كيف تشاركها بالإنجليزية!",
      words: [
        { word: "Celebrate", ipa: "/ˈselɪbreɪt/", arabic: "يحتفل", phonetic: "سيليبريت", example: "We celebrate Eid with family.", exampleAr: "نحتفل بالعيد مع العائلة." },
        { word: "Gift / Present", ipa: "/ɡɪft/ /ˈprezənt/", arabic: "هدية", phonetic: "غِفت / بريزِنت", example: "I bought a gift for my mother.", exampleAr: "اشتريت هدية لأمي." },
        { word: "Party", ipa: "/ˈpɑːrti/", arabic: "حفلة", phonetic: "بارتي", example: "Let's have a party!", exampleAr: "يلا نعمل حفلة!" },
        { word: "Congratulations!", ipa: "/kənˌɡrætʃuˈleɪʃənz/", arabic: "مبروك!", phonetic: "كونغراتشولِيشَنز", example: "Congratulations on your graduation!", exampleAr: "مبروك على تخرجك!" },
        { word: "Wish / Hope", ipa: "/wɪʃ/ /hoʊp/", arabic: "يتمنى / يأمل", phonetic: "وِيش / هوب", example: "I wish you all the best!", exampleAr: "أتمنى لك كل التوفيق!" },
        { word: "Happy New Year / Eid Mubarak", ipa: "/ˈhæpi njuː jɪər/", arabic: "سنة سعيدة / عيد مبارك", phonetic: "هابي نيو يير / عيد موبارَك", example: "Happy New Year! Eid Mubarak to you and your family!", exampleAr: "سنة سعيدة! عيد مبارك لك ولعائلتك!" }
      ],
      mimicChallenge: ["Congratulations", "Celebrate", "Happy New Year"],
      mimicTip: "Congratulations = kən-GRAT-yə-LEY-shənz (5 مقاطع! الضغط على GRAT وLAY)"
    },
    grammar: {
      patterns: [{
        name: "I wish you / I hope you — التمنيات والأمنيات",
        explanation: "طريقتان للتعبير عن التمنيات: 'I wish you [noun]' = أتمنى لك... أو 'I hope you [verb]' = أتمنى أن تـ... مثال: I wish you success (أتمنى لك النجاح) / I hope you feel better (أتمنى أن تتحسن). بسيطة ومهمة!",
        formula: "I wish you + [noun] / I hope you + [verb]",
        examples: ["I wish you all the best!", "I hope you have a great birthday!", "I wish you happiness and health.", "I hope you enjoy your celebration!"],
        exercises: [
          { question: "كيف تقول: أتمنى لك نجاحاً في الامتحان؟", answer: "I wish you success in your exam! / I hope you pass your exam!" },
          { question: "كيف تقول: أتمنى أن تستمتع بعيد ميلادك؟", answer: "I hope you enjoy your birthday!" },
          { question: "wish أو hope؟ I ___ you feel better soon.", answer: "hope (because it's followed by a verb: 'feel')" }
        ]
      }]
    },
    reading: {
      passage: "Today is my sister's birthday! She is twenty years old. We are going to have a party at home. I bought her a beautiful gift. All our family will be there. I wish her happiness and success. I hope she likes my gift! Happy Birthday, Sara!",
      breakdown: [
        { sentence: "I bought her a beautiful gift.", words: [{ w: "I bought", ar: "اشتريت لها" }, { w: "her", ar: "لها" }, { w: "a beautiful", ar: "جميلة" }, { w: "gift", ar: "هدية" }], meaning: "اشتريت لها هدية جميلة." },
        { sentence: "I wish her happiness and success.", words: [{ w: "I wish", ar: "أتمنى لها" }, { w: "her", ar: "لها" }, { w: "happiness", ar: "سعادة" }, { w: "and success", ar: "ونجاحاً" }], meaning: "أتمنى لها السعادة والنجاح." },
        { sentence: "I hope she likes my gift!", words: [{ w: "I hope", ar: "أتمنى" }, { w: "she likes", ar: "أن تحب" }, { w: "my gift", ar: "هديتي" }], meaning: "أتمنى أن تحب هديتي!" }
      ]
    },
    listening: {
      context: "في حفل عيد ميلاد",
      text: "Happy Birthday! Thank you! How old are you today? I am twenty-two! Congratulations! I hope you have a wonderful day. I wish you all the best!",
      fillText: "Happy _____! Thank you! How old are you today? I am twenty-two! _____! I hope you have a wonderful day. I _____ you all the best!",
      blanks: [
        { before: "Happy", blank: "Birthday", after: "!" },
        { before: "", blank: "Congratulations", after: "!" },
        { before: "I", blank: "wish", after: "you all the best!" }
      ]
    },
    shadowing: {
      chunk: "Congratulations! I wish you all the best!",
      nativeForm: "kənˌɡrætʃuˈleɪʃənz aɪ wɪʃ juː ɔːl ðə best",
      explanation: "Congratulations هي أطول كلمة تعلمتها! تقال بحماس وسرعة: كَنغراتشو-LEY-شَنز. وبعدها مباشرة: آي-ويش-يو-أول-ذا-بيست. قلهما معاً بنبرة احتفالية!",
      steps: ["تدرب على Congratulations وحدها 5 مرات بسرعة متزايدة", "الآن قل العبارة الكاملة بنبرة احتفالية", "تخيل أنك في حفلة — هنئ شخصاً على شيء مهم"],
      youtubeUrl: "https://www.youtube.com/results?search_query=celebrations+greetings+english+birthday+congratulations+beginner"
    },
    writing: {
      challenges: ["اكتب رسالة تهنئة لصديقك بعيد ميلاده (5-6 جمل — اكتب عنه وتمنياتك له)", "اكتب عن احتفالك المفضل — ما هو؟ كيف تحتفل؟ مع من؟"],
      companionPrompt: `You are a celebratory English tutor for a beginner who finished "A1 Day 29" (Celebrations).
RULES:
1. ONLY use: birthday, party, gift, celebrate, congratulations, happy new year, eid mubarak, wish, hope, family, together, wonderful, special day, I bought, we are going to
2. Celebrate various occasions with the student — practice all the expressions
3. Teach 'I wish you + noun' vs 'I hope you + verb' naturally
4. Be warm and festive
5. Start: "Hello! I heard it might be a special time for you soon! What celebrations do you have coming up?"`
    }
  },

  {
    id: 30,
    title: "A1 Complete! — Ready for A2",
    titleAr: "اكتملت A1! — جاهز لـ A2",
    subtitle: "Review, Celebrate & Look Ahead",
    subtitleAr: "المراجعة والاحتفال والنظر للأمام",
    vocabulary: {
      intro: "🎉 مبروك! أنهيت مستوى A1 كاملاً! هذا اليوم للمراجعة والاحتفال — أنت تستحق هذا!",
      words: [
        { word: "Achieve", ipa: "/əˈtʃiːv/", arabic: "يحقق", phonetic: "أتشيف", example: "I achieved my first English goal!", exampleAr: "حققت هدفي الأول بالإنجليزية!" },
        { word: "Confident", ipa: "/ˈkɒnfɪdənt/", arabic: "واثق من نفسه", phonetic: "كونفيدِنت", example: "I feel confident speaking English now.", exampleAr: "أشعر بالثقة عند التحدث بالإنجليزية الآن." },
        { word: "Progress", ipa: "/ˈprəʊɡres/", arabic: "تقدم", phonetic: "بروغريس", example: "I made great progress in 30 days!", exampleAr: "حققت تقدماً رائعاً في 30 يوماً!" },
        { word: "Continue", ipa: "/kənˈtɪnjuː/", arabic: "يستمر", phonetic: "كونتينيو", example: "Continue learning every day!", exampleAr: "استمر في التعلم كل يوم!" },
        { word: "Next level", ipa: "/nekst ˈlevəl/", arabic: "المستوى التالي", phonetic: "نيكست ليفَل", example: "You are ready for the next level — A2!", exampleAr: "أنت مستعد للمستوى التالي — A2!" },
        { word: "I can now...", ipa: "/aɪ kæn naʊ/", arabic: "أستطيع الآن...", phonetic: "آي كان ناو", example: "I can now introduce myself in English!", exampleAr: "أستطيع الآن تقديم نفسي بالإنجليزية!" }
      ],
      mimicChallenge: ["Confident", "Achieve", "I can now"],
      mimicTip: "Confident = CON-fi-dent (3 مقاطع). Achieve = ə-CHEEV (الضغط على CHEEV)"
    },
    grammar: {
      patterns: [{
        name: "مراجعة: كل ما تعلمته في A1",
        explanation: "في هذا اليوم الأخير، راجع أهم القواعد التي تعلمتها: ✅ Verb To Be (I am / She is) ✅ Simple Present (I wake up / She wakes up) ✅ There is/are ✅ Going to (للمستقبل) ✅ Can I...? ✅ How much/many? ✅ In/On/At (حروف الجر مع الوقت) ✅ I wish/hope. أنت تعرف الآن الأساسيات!",
        formula: "أنت تعرف الآن: Verb To Be + Simple Present + Future (going to) + Questions + Prepositions",
        examples: ["I am a student from Jordan.", "She wakes up at 7 every day.", "There are 3 books on my desk.", "I'm going to visit my family this weekend.", "Can I have a coffee, please?"],
        exercises: [
          { question: "عرّف نفسك بجملتين: اسمك + بلدك + وظيفتك", answer: "My name is [name]. I am from [country]. I am a [job/student]." },
          { question: "صف يومك: 3 أشياء تعملها كل يوم", answer: "I wake up at [time]. I eat breakfast and go to [school/work]. In the evening, I [activity]." },
          { question: "اكتب خططك لنهاية الأسبوع", answer: "This weekend, I'm going to [plan]. On Saturday, I will [activity]." }
        ]
      }]
    },
    reading: {
      passage: "Congratulations! You finished A1! In 30 days, you learned to introduce yourself, talk about your family and daily routine, order food, ask for directions, describe people, talk about the weather, and much more! You are now ready for A2. Keep going — you are amazing!",
      breakdown: [
        { sentence: "You learned to introduce yourself.", words: [{ w: "You learned", ar: "تعلمت" }, { w: "to introduce", ar: "تقديم" }, { w: "yourself", ar: "نفسك" }], meaning: "تعلمت كيف تقدم نفسك." },
        { sentence: "You are now ready for A2.", words: [{ w: "You are now", ar: "أنت الآن" }, { w: "ready", ar: "مستعد" }, { w: "for A2", ar: "لـ A2" }], meaning: "أنت الآن مستعد لمستوى A2." },
        { sentence: "Keep going — you are amazing!", words: [{ w: "Keep going", ar: "استمر" }, { w: "you are", ar: "أنت" }, { w: "amazing", ar: "رائع" }], meaning: "استمر — أنت رائع!" }
      ]
    },
    listening: {
      context: "مراجعة نهائية — مواقف مختلفة",
      text: "Congratulations on finishing A1! You can now talk about yourself, your family, your daily life, and so much more. You should be very proud!",
      fillText: "Congratulations on _____ A1! You can now talk about yourself, your family, your daily _____, and so much more. You should be very _____!",
      blanks: [
        { before: "on", blank: "finishing", after: "A1!" },
        { before: "your daily", blank: "life", after: "," },
        { before: "be very", blank: "proud", after: "!" }
      ]
    },
    shadowing: {
      chunk: "I can speak English now!",
      nativeForm: "aɪ kən spiːk ˈɪŋɡlɪʃ naʊ",
      explanation: "هذه هي أهم جملة تعلمتها! 'I can' = آيكَن (can تنطق خفيفة في الجمل الإيجابية). الجملة كاملة: آيكَن-سبيك-إنغليش-ناو — قلها بثقة وفخر!",
      steps: ["قل الجملة بثقة كاملة: I CAN speak English now!", "أضف ما تستطيع فعله: I can introduce myself / order food / ask for directions...", "احتفل! قل 5 أشياء تستطيع فعلها بالإنجليزية الآن"],
      youtubeUrl: "https://www.youtube.com/results?search_query=english+A1+beginner+review+what+I+learned+next+steps+A2"
    },
    writing: {
      challenges: ["اكتب رسالة لنفسك قبل 30 يوماً — أخبر نفسك الماضية ماذا ستتعلم وكيف تقدمت!", "اكتب 5 أشياء تستطيع فعلها بالإنجليزية الآن لم تكن تستطيعها قبل شهر"],
      companionPrompt: `You are a proud and celebratory English tutor for a student who just COMPLETED A1 (30 days)!
RULES:
1. Use ALL vocabulary from Days 1-29 freely — this is a comprehensive review
2. Celebrate their achievement genuinely: congratulate them, ask what was hardest/easiest
3. Help them review by doing a mini-conversation using everything they learned
4. Encourage them to continue to A2
5. Start: "🎉 CONGRATULATIONS! You finished A1 — all 30 days! I am SO proud of you! Let's celebrate and review everything you know. Ready? Tell me: who are you, where are you from, and what do you do?"`
    }
  }
]
