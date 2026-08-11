export const DAYS_11_20 = [
  {
    id: 11,
    title: "Shopping for Clothes",
    titleAr: "التسوق للملابس",
    subtitle: "Sizes, Prices & Trying Things On",
    subtitleAr: "المقاسات والأسعار وتجربة الملابس",
    vocabulary: {
      intro: "التسوق بالإنجليزية — مهارة ستستخدمها في أي بلد تزوره!",
      words: [
        { word: "Shirt", ipa: "/ʃɜːrt/", arabic: "قميص", phonetic: "شُرت", example: "I want a blue shirt, please.", exampleAr: "أريد قميصاً أزرق من فضلك." },
        { word: "Size", ipa: "/saɪz/", arabic: "مقاس", phonetic: "سايز", example: "What size do you wear?", exampleAr: "ما هو مقاسك؟" },
        { word: "Try on", ipa: "/traɪ ɒn/", arabic: "يجرّب (الملابس)", phonetic: "تراي أون", example: "Can I try this on, please?", exampleAr: "هل أستطيع تجربة هذا؟" },
        { word: "Too expensive", ipa: "/tuː ɪkˈspensɪv/", arabic: "غالي جداً", phonetic: "تو إكسبنسيف", example: "This dress is too expensive.", exampleAr: "هذا الفستان غالٍ جداً." },
        { word: "Cheap", ipa: "/tʃiːp/", arabic: "رخيص", phonetic: "تشيب", example: "This T-shirt is very cheap!", exampleAr: "هذا التيشيرت رخيص جداً!" },
        { word: "Fits well", ipa: "/fɪts wel/", arabic: "يناسب جيداً", phonetic: "فيتس ويل", example: "This jacket fits well.", exampleAr: "هذه الجاكيت تناسبني جيداً." }
      ],
      mimicChallenge: ["Expensive", "Try on", "Size"],
      mimicTip: "Expensive = iks-PEN-siv — الضغط على المقطع الثاني PEN وليس الأول"
    },
    grammar: {
      patterns: [{
        name: "Can I...? — الاستئذان والطلب",
        explanation: "'Can I' تستخدمها لطلب الإذن أو شيء بأدب. 'Can I try this on?' = هل أستطيع تجربة هذا؟ 'Can I see...' = هل أستطيع أن أرى...؟ هذه من أكثر العبارات استخداماً في التسوق!",
        formula: "Can I + [verb] + [object] + please?",
        examples: ["Can I try this on, please?", "Can I see the blue one?", "Can I pay by card?"],
        exercises: [
          { question: "اطلب: أريد تجربة هذا القميص.", answer: "Can I try this shirt on, please?" },
          { question: "اسأل عن مقاس آخر: عندك مقاس أكبر؟", answer: "Do you have a bigger size?" },
          { question: "رتّب: (expensive / this / is / too / dress)", answer: "This dress is too expensive." }
        ]
      }]
    },
    reading: {
      passage: "Layla goes to a big clothes shop. She finds a blue shirt and asks: 'Can I try this on, please?' The shirt fits well, but it is too expensive. Then she finds a cheap yellow shirt. She buys it and smiles.",
      breakdown: [
        { sentence: "Layla goes to a big clothes shop.", words: [{ w: "Layla", ar: "لَيلى" }, { w: "goes to", ar: "تذهب إلى" }, { w: "clothes shop", ar: "محل الملابس" }], meaning: "لَيلى تذهب إلى محل ملابس كبير." },
        { sentence: "Can I try this on, please?", words: [{ w: "Can I", ar: "هل أستطيع" }, { w: "try this on", ar: "تجربة هذا" }, { w: "please", ar: "من فضلك" }], meaning: "هل أستطيع تجربة هذا من فضلك؟" },
        { sentence: "The shirt fits well, but it is too expensive.", words: [{ w: "fits well", ar: "يناسب جيداً" }, { w: "but", ar: "لكن" }, { w: "too expensive", ar: "غالٍ جداً" }], meaning: "القميص يناسبها جيداً لكنه غالٍ جداً." },
        { sentence: "Then she finds a cheap yellow shirt.", words: [{ w: "Then", ar: "ثم" }, { w: "she finds", ar: "تجد" }, { w: "cheap", ar: "رخيص" }, { w: "yellow shirt", ar: "قميص أصفر" }], meaning: "ثم تجد قميصاً أصفر رخيصاً." }
      ]
    },
    listening: {
      context: "في محل ملابس",
      text: "Hello! Can I help you? Yes, please. I want a blue shirt in size medium. Can I try it on?",
      fillText: "Hello! Can I _____ you? Yes, please. I want a blue shirt in size _____. Can I _____ it on?",
      blanks: [
        { before: "Can I", blank: "help", after: "you?" },
        { before: "in size", blank: "medium", after: "." },
        { before: "Can I", blank: "try", after: "it on?" }
      ]
    },
    shadowing: {
      chunk: "Can I try this on, please?",
      nativeForm: "kən aɪ traɪ ðɪs ɒn pliːz?",
      explanation: "'Can I' في الكلام الطبيعي = 'kən aɪ' (كَنَاي) — كلمة 'can' تُنطق خفيفة جداً وليست كاملة. المتحدث الأصيل لا يقول 'CAAN eye' بشكل مبالغ!",
      steps: ["قل 'Can I' ببطء ثم بسرعة — لاحظ كيف تصبح خفيفة", "أضف بقية الجملة وقلها 3 مرات", "تدرب على طلب 3 أشياء مختلفة في متجر خيالي"],
      youtubeUrl: "https://www.youtube.com/results?search_query=shopping+clothes+english+conversation+beginner+can+I+try+on"
    },
    writing: {
      challenges: ["اكتب حواراً قصيراً في محل ملابس: أنت تسأل عن قميص وتجربه وتشتريه (5-6 جمل)", "صف ملابسك اليوم باستخدام ألوان وصفات (3 جمل)"],
      companionPrompt: `You are a friendly shop assistant AND English tutor for a beginner who finished "A1 Day 11" (Shopping for Clothes).
RULES:
1. ONLY use: shirt, pants, dress, shoes, jacket, size (small/medium/large), color, try on, how much, expensive, cheap, fits well, can I, please
2. Play the role of a shop assistant — help the student shop for clothes
3. Correct gently if they use wrong prepositions (e.g. "try this" without "on")
4. Make it fun and realistic
5. Start: "Welcome to the shop! How can I help you today? Are you looking for something special?"`
    }
  },

  {
    id: 12,
    title: "At the Restaurant",
    titleAr: "في المطعم",
    subtitle: "Ordering a Full Meal",
    subtitleAr: "طلب وجبة كاملة",
    vocabulary: {
      intro: "المطعم هو أحد أكثر الأماكن التي ستتحدث فيها الإنجليزية — يلا نتعلم!",
      words: [
        { word: "Menu", ipa: "/ˈmenjuː/", arabic: "قائمة الطعام", phonetic: "مِنيو", example: "Can I see the menu, please?", exampleAr: "هل أستطيع أن أرى القائمة؟" },
        { word: "Order", ipa: "/ˈɔːrdər/", arabic: "طلب / يطلب", phonetic: "أوردَر", example: "Are you ready to order?", exampleAr: "هل أنت جاهز للطلب؟" },
        { word: "Delicious", ipa: "/dɪˈlɪʃəs/", arabic: "لذيذ", phonetic: "ديليشَس", example: "The soup is delicious!", exampleAr: "الشوربة لذيذة!" },
        { word: "Waiter / Waitress", ipa: "/ˈweɪtər/ /ˈweɪtrɪs/", arabic: "نادل / نادلة", phonetic: "ويتَر / ويترِس", example: "Excuse me, waiter!", exampleAr: "لو سمحت يا نادل!" },
        { word: "Bill", ipa: "/bɪl/", arabic: "الفاتورة / الحساب", phonetic: "بِل", example: "Can I have the bill, please?", exampleAr: "هل أستطيع الحصول على الحساب؟" },
        { word: "For here or to go?", ipa: "/fɔːr hɪr ɔːr tə ɡoʊ/", arabic: "هنا أم تيك أواي؟", phonetic: "فور هير أور تو غو", example: "For here or to go?", exampleAr: "ستأكل هنا أم تأخذها معك؟" }
      ],
      mimicChallenge: ["Delicious", "Waiter", "Menu"],
      mimicTip: "Delicious = de-LI-shus (3 مقاطع) — الضغط على LI وليس de"
    },
    grammar: {
      patterns: [{
        name: "Would you like...? / I'll have... — الطلب في المطعم",
        explanation: "في المطعم يسألك: 'What would you like?' ويمكنك تجيب بـ 'I'll have...' (= I will have) أو 'I'd like...'. كلاهما طبيعي. مثال: 'What would you like?' → 'I'll have the chicken soup, please.'",
        formula: "What would you like? → I'll have / I'd like + [dish], please",
        examples: ["I'll have the chicken soup, please.", "I'd like a salad and water.", "Can I have the bill, please?"],
        exercises: [
          { question: "اطلب: أريد شوربة دجاج وأرز.", answer: "I'll have the chicken soup and rice, please." },
          { question: "اطلب الحساب بأدب.", answer: "Can I have the bill, please?" },
          { question: "رتّب: (like / the / I'd / grilled / fish)", answer: "I'd like the grilled fish." }
        ]
      }]
    },
    reading: {
      passage: "Omar sits at a restaurant. The waiter gives him the menu and asks: 'For here or to go?' Omar orders grilled chicken and soup. The food is delicious! After eating, Omar asks for the bill and pays.",
      breakdown: [
        { sentence: "The waiter gives him the menu and asks: 'For here or to go?'", words: [{ w: "The waiter", ar: "النادل" }, { w: "menu", ar: "قائمة الطعام" }, { w: "For here or to go?", ar: "هنا أم تيك أواي؟" }], meaning: "النادل يعطيه القائمة ويسأل: ستأكل هنا أم تأخذها معك؟" },
        { sentence: "Omar orders grilled chicken and soup.", words: [{ w: "Omar", ar: "عمر" }, { w: "orders", ar: "يطلب" }, { w: "grilled chicken", ar: "دجاج مشوي" }, { w: "soup", ar: "شوربة" }], meaning: "عمر يطلب دجاجاً مشوياً وشوربة." },
        { sentence: "The food is delicious!", words: [{ w: "The food", ar: "الطعام" }, { w: "delicious", ar: "لذيذ" }], meaning: "الطعام لذيذ!" },
        { sentence: "After eating, Omar asks for the bill and pays.", words: [{ w: "After eating", ar: "بعد الأكل" }, { w: "asks for the bill", ar: "يطلب الحساب" }, { w: "pays", ar: "يدفع" }], meaning: "بعد الأكل، عمر يطلب الحساب ويدفع." }
      ]
    },
    listening: {
      context: "في مطعم — النادل يخدم الزبون",
      text: "Good evening! Are you ready to order? Yes, I'll have the grilled chicken and a salad, please. Excellent choice!",
      fillText: "Good evening! Are you ready to _____? Yes, I'll _____ the grilled chicken and a salad, please. _____ choice!",
      blanks: [
        { before: "Are you ready to", blank: "order", after: "?" },
        { before: "I'll", blank: "have", after: "the grilled chicken." },
        { before: "", blank: "Excellent", after: "choice!" }
      ]
    },
    shadowing: {
      chunk: "Can I have the bill, please?",
      nativeForm: "kən aɪ hæv ðə bɪl pliːz?",
      explanation: "'Can I have' = كَناي-هاف — الثلاث كلمات تتصل في الكلام الطبيعي. و'the bill' تصبح 'ðə bɪl' — الـ the قصيرة جداً هنا. هذه جملة ستقولها في كل مطعم!",
      steps: ["تدرب على 'Can I have' كوحدة واحدة", "أضف 'the bill please' وقلها بسرعة طبيعية", "تخيل أنك في مطعم حقيقي وقل الجملة بطلاقة"],
      youtubeUrl: "https://www.youtube.com/results?search_query=ordering+food+restaurant+english+conversation+beginner"
    },
    writing: {
      challenges: ["اكتب حوار كامل في مطعم: من الجلوس حتى دفع الحساب (6-8 جمل)", "صف وجبتك المفضلة في 3 جمل — ما هي وكيف طعمها؟"],
      companionPrompt: `You are a professional restaurant waiter AND English tutor for a beginner who finished "A1 Day 12" (Restaurant).
RULES:
1. ONLY use: menu, order, I'll have, I'd like, delicious, waiter, bill, for here/to go, chicken, soup, salad, fish, rice, please, thank you, how much, excellent
2. Play the full restaurant experience: greet → give menu → take order → serve → bring bill
3. Correct naturally if they use wrong expressions
4. Make it immersive and fun
5. Start: "Good evening! Welcome to Noura Restaurant. Here is your menu. Would you like to start with a drink?"`
    }
  },

  {
    id: 13,
    title: "Body Parts & Health",
    titleAr: "أجزاء الجسم والصحة",
    subtitle: "Describing Pain & Visiting the Doctor",
    subtitleAr: "وصف الألم وزيارة الطبيب",
    vocabulary: {
      intro: "عند المرض تحتاج تشرح ما تشعر به — هذه الكلمات قد تنقذك يوماً ما!",
      words: [
        { word: "Head", ipa: "/hed/", arabic: "رأس", phonetic: "هيد", example: "I have a headache.", exampleAr: "عندي صداع في الرأس." },
        { word: "Stomach", ipa: "/ˈstʌmək/", arabic: "معدة", phonetic: "ستَمَك", example: "My stomach hurts.", exampleAr: "معدتي تؤلمني." },
        { word: "Fever", ipa: "/ˈfiːvər/", arabic: "حرارة / سخونة", phonetic: "فيفَر", example: "I have a high fever.", exampleAr: "عندي حرارة عالية." },
        { word: "Hurt / Pain", ipa: "/hɜːrt/ /peɪn/", arabic: "يؤلم / ألم", phonetic: "هُرت / بِين", example: "My leg hurts a lot.", exampleAr: "ساقي تؤلمني كثيراً." },
        { word: "Feel sick", ipa: "/fiːl sɪk/", arabic: "أشعر بالمرض", phonetic: "فيل سيك", example: "I feel sick today.", exampleAr: "أشعر بالمرض اليوم." },
        { word: "Medicine", ipa: "/ˈmedɪsɪn/", arabic: "دواء", phonetic: "ميدِسين", example: "The doctor gave me medicine.", exampleAr: "الطبيب أعطاني دواء." }
      ],
      mimicChallenge: ["Stomachache", "Fever", "Medicine"],
      mimicTip: "Stomachache = STUM-ik-eɪk (3 مقاطع). ليست 'sto-MACH-ache'"
    },
    grammar: {
      patterns: [{
        name: "I have a + [symptom] / My [body part] hurts",
        explanation: "طريقتان لوصف الألم: 1) I have a [headache/fever/cold] — مع الأمراض والأعراض. 2) My [body part] hurts — لوصف مكان الألم مباشرة. مثال: I have a headache. My head hurts. كلاهما يؤدي نفس المعنى!",
        formula: "I have a + headache/fever/cold / My + [body part] + hurts",
        examples: ["I have a headache.", "My stomach hurts.", "She has a cold.", "His leg hurts."],
        exercises: [
          { question: "أخبر الطبيب: رأسي يؤلمني ومعدتي تؤلمني.", answer: "My head hurts and my stomach hurts. / I have a headache and a stomachache." },
          { question: "أكمل: She ___ a high fever.", answer: "has" },
          { question: "ترجم: أشعر بالمرض اليوم. عندي زكام.", answer: "I feel sick today. I have a cold." }
        ]
      }]
    },
    reading: {
      passage: "Rania feels sick today. Her head hurts and she has a high fever. She goes to the doctor. The doctor asks about the pain and gives her medicine. Rania rests at home and drinks water.",
      breakdown: [
        { sentence: "Rania feels sick today.", words: [{ w: "Rania", ar: "رانيا" }, { w: "feels sick", ar: "تشعر بالمرض" }, { w: "today", ar: "اليوم" }], meaning: "رانيا تشعر بالمرض اليوم." },
        { sentence: "Her head hurts and she has a high fever.", words: [{ w: "Her head", ar: "رأسها" }, { w: "hurts", ar: "يؤلمها" }, { w: "a high fever", ar: "حرارة عالية" }], meaning: "رأسها يؤلمها وعندها حرارة عالية." },
        { sentence: "The doctor asks about the pain and gives her medicine.", words: [{ w: "The doctor", ar: "الطبيب" }, { w: "asks about", ar: "يسأل عن" }, { w: "the pain", ar: "الألم" }, { w: "medicine", ar: "دواء" }], meaning: "الطبيب يسأل عن الألم ويعطيها دواء." },
        { sentence: "Rania rests at home and drinks water.", words: [{ w: "Rania", ar: "رانيا" }, { w: "rests", ar: "تستريح" }, { w: "at home", ar: "في البيت" }, { w: "drinks water", ar: "تشرب ماء" }], meaning: "رانيا تستريح في البيت وتشرب ماء." }
      ]
    },
    listening: {
      context: "في عيادة الطبيب",
      text: "Good morning, doctor. I feel very sick. I have a headache and a fever. I also have a sore throat.",
      fillText: "Good morning, doctor. I feel very _____. I have a _____ and a fever. I also have a sore _____.",
      blanks: [
        { before: "I feel very", blank: "sick", after: "." },
        { before: "I have a", blank: "headache", after: "and a fever." },
        { before: "a sore", blank: "throat", after: "." }
      ]
    },
    shadowing: {
      chunk: "I don't feel well today",
      nativeForm: "aɪ doʊnt fiːl wel təˈdeɪ",
      explanation: "'I don't feel well' هي الطريقة الأكثر أدباً وطبيعية لقول أنك مريض. أقل مباشرة من 'I am sick'. في الكلام الطبيعي: 'doʊnt' = دونت (الـ t تكاد تختفي في نهاية الجملة)",
      steps: ["تدرب على النفي: don't (دونت) — لاحظ أن T في النهاية خفيفة", "قل الجملة كاملة بنبرة شخص تعبان", "جرب تصف كيف تشعر الآن بنفس النمط"],
      youtubeUrl: "https://www.youtube.com/results?search_query=body+parts+health+symptoms+english+beginner+doctor+vocabulary"
    },
    writing: {
      challenges: ["اكتب حواراً في عيادة الطبيب: أخبره بأعراضك واسمع نصيحته (5-6 جمل)", "صف آخر مرة كنت مريضاً فيها — ما الأعراض التي شعرت بها؟"],
      companionPrompt: `You are a kind doctor AND English tutor for a beginner who finished "A1 Day 13" (Body & Health).
RULES:
1. ONLY use: head, stomach, leg, throat, eye, back, hurt, pain, sick, fever, cold, medicine, rest, feel better, I have a, my [body part] hurts
2. Play the role of a doctor: ask about symptoms, give simple advice
3. If student says "I have pain in head" correct to "I have a headache" or "My head hurts"
4. Be caring and patient
5. Start: "Hello! Welcome. Please sit down. How are you feeling today? What's wrong?"`
    }
  },

  {
    id: 14,
    title: "Travel & Airport",
    titleAr: "السفر والمطار",
    subtitle: "Navigating the Airport in English",
    subtitleAr: "التعامل في المطار بالإنجليزية",
    vocabulary: {
      intro: "المطار هو اختبارك الأول خارج البلد — يلا نستعد له!",
      words: [
        { word: "Passport", ipa: "/ˈpæspɔːrt/", arabic: "جواز سفر", phonetic: "باسبورت", example: "Can I see your passport, please?", exampleAr: "هل أستطيع رؤية جواز سفرك؟" },
        { word: "Flight", ipa: "/flaɪt/", arabic: "رحلة طيران", phonetic: "فلايت", example: "My flight is at 10 PM.", exampleAr: "رحلتي الساعة 10 مساءً." },
        { word: "Gate", ipa: "/ɡeɪt/", arabic: "بوابة", phonetic: "غيت", example: "Your gate is number 5.", exampleAr: "بوابتك رقم 5." },
        { word: "Luggage", ipa: "/ˈlʌɡɪdʒ/", arabic: "أمتعة", phonetic: "لَغِدج", example: "I have two bags of luggage.", exampleAr: "عندي حقيبتان." },
        { word: "Check in", ipa: "/tʃek ɪn/", arabic: "تسجيل الوصول", phonetic: "تشيك إن", example: "I need to check in for my flight.", exampleAr: "أحتاج تسجيل وصولي للرحلة." },
        { word: "Boarding pass", ipa: "/ˈbɔːrdɪŋ pæs/", arabic: "بطاقة الصعود", phonetic: "بوردينغ باس", example: "Here is your boarding pass.", exampleAr: "هذه بطاقة صعودك." }
      ],
      mimicChallenge: ["Passport", "Boarding pass", "Luggage"],
      mimicTip: "Passport = PAS-port (الضغط على PAS). Luggage = LUG-ij (ليست lug-GAGE)"
    },
    grammar: {
      patterns: [{
        name: "Where is / Which gate is...? — السؤال عن المكان بالمطار",
        explanation: "في المطار ستحتاج كثيراً لسؤال: 'Where is the gate?' أو 'Which gate is flight...?' أو 'When does the flight leave?' تعلم هذه الأسئلة الثلاثة وستتعامل مع أي مطار في العالم!",
        formula: "Where is + [place]? / Which gate is + [flight]? / When does the flight leave?",
        examples: ["Where is gate 5?", "Which gate is flight JO201?", "When does the flight to London leave?"],
        exercises: [
          { question: "اسأل: أين دورة المياه في المطار؟", answer: "Where is the bathroom/restroom in the airport?" },
          { question: "اسأل: متى تغادر الرحلة؟", answer: "When does the flight leave?" },
          { question: "رتّب: (is / gate / which / 205 / flight)", answer: "Which gate is flight 205?" }
        ]
      }]
    },
    reading: {
      passage: "Sami arrives at the airport early. He checks in for his flight and puts his luggage on the scale. The staff checks his passport and gives him his boarding pass. His gate is number 8. Sami walks quickly and boards the plane.",
      breakdown: [
        { sentence: "He checks in for his flight and puts his luggage on the scale.", words: [{ w: "checks in", ar: "يسجّل وصوله" }, { w: "his flight", ar: "رحلته" }, { w: "luggage", ar: "أمتعته" }, { w: "the scale", ar: "الميزان" }], meaning: "يسجّل وصوله لرحلته ويضع أمتعته على الميزان." },
        { sentence: "The staff checks his passport and gives him his boarding pass.", words: [{ w: "passport", ar: "جواز السفر" }, { w: "boarding pass", ar: "بطاقة الصعود" }], meaning: "الموظف يتحقق من جواز سفره ويعطيه بطاقة الصعود." },
        { sentence: "His gate is number 8.", words: [{ w: "His gate", ar: "بوابته" }, { w: "number 8", ar: "رقم 8" }], meaning: "بوابته رقم 8." },
        { sentence: "Sami walks quickly and boards the plane.", words: [{ w: "Sami", ar: "سامي" }, { w: "walks quickly", ar: "يمشي بسرعة" }, { w: "boards the plane", ar: "يصعد الطائرة" }], meaning: "سامي يمشي بسرعة ويصعد الطائرة." }
      ]
    },
    listening: {
      context: "موظف مطار يتكلم مع مسافر",
      text: "Good morning! Can I see your passport, please? Here is your boarding pass. Your gate is number 7. Have a good flight!",
      fillText: "Good morning! Can I see your _____, please? Here is your boarding _____. Your _____ is number 7. Have a good flight!",
      blanks: [
        { before: "Can I see your", blank: "passport", after: ", please?" },
        { before: "Here is your boarding", blank: "pass", after: "." },
        { before: "Your", blank: "gate", after: "is number 7." }
      ]
    },
    shadowing: {
      chunk: "Have a good flight!",
      nativeForm: "hæv ə ɡʊd flaɪt",
      explanation: "'Have a good...' هي عبارة تودي تستخدمها الإنجليز للتمني. 'Have a good flight!' 'Have a good day!' 'Have a good trip!' — تعلم هذا النمط مرة ويصير عندك عشر جمل!",
      steps: ["قل 'Have a good [X]' واملأ X بكلمات مختلفة: day, trip, weekend", "تدرب على الجملة بسرعة طبيعية: hæv-ə-ɡʊd-flaɪt", "قل جملة توديع كاملة: 'Thank you! Have a good flight!' 5 مرات"],
      youtubeUrl: "https://www.youtube.com/results?search_query=airport+english+conversation+beginner+check+in+passport"
    },
    writing: {
      challenges: ["اكتب حوار كامل في المطار: من وصولك حتى الوصول للبوابة (6 جمل)", "اكتب عن آخر رحلة سافرت فيها أو رحلة تحلم بها — إلى أين؟"],
      companionPrompt: `You are a helpful airport staff member AND English tutor for a beginner who finished "A1 Day 14" (Travel & Airport).
RULES:
1. ONLY use: passport, flight, gate, luggage, check in, boarding pass, window/aisle seat, leave, arrive, when, which, where, have a good flight
2. Play the airport check-in experience fully
3. If they say "I have flight at 10" correct to "I have a flight at 10" or "My flight is at 10"
4. Make it feel like a real airport
5. Start: "Good morning! Welcome to the airport. May I see your passport, please?"`
    }
  },

  {
    id: 15,
    title: "Hobbies & Free Time",
    titleAr: "الهوايات ووقت الفراغ",
    subtitle: "Talking About What You Love to Do",
    subtitleAr: "التحدث عن ما تحب أن تفعله",
    vocabulary: {
      intro: "الهوايات هي روحك — بدونها الكلام جاف. يلا نحكي عما يجعلك سعيداً!",
      words: [
        { word: "Reading", ipa: "/ˈriːdɪŋ/", arabic: "القراءة", phonetic: "ريدينغ", example: "I love reading books.", exampleAr: "أحب قراءة الكتب." },
        { word: "Swimming", ipa: "/ˈswɪmɪŋ/", arabic: "السباحة", phonetic: "سويمينغ", example: "She swims every morning.", exampleAr: "تسبح كل صباح." },
        { word: "Cooking", ipa: "/ˈkʊkɪŋ/", arabic: "الطبخ", phonetic: "كوكينغ", example: "I enjoy cooking for my family.", exampleAr: "أستمتع بالطبخ لعائلتي." },
        { word: "I love / I like / I enjoy", ipa: "/laɪk/ /lʌv/ /ɪnˈdʒɔɪ/", arabic: "أحب / أعجبني / أستمتع", phonetic: "لايك / لَف / إنجوي", example: "I love music. I like drawing.", exampleAr: "أحب الموسيقى. أحب الرسم." },
        { word: "I don't like", ipa: "/aɪ doʊnt laɪk/", arabic: "لا أحب", phonetic: "آي دونت لايك", example: "I don't like watching TV.", exampleAr: "لا أحب مشاهدة التلفزيون." },
        { word: "In my free time", ipa: "/ɪn maɪ friː taɪm/", arabic: "في وقت فراغي", phonetic: "إن ماي فري تايم", example: "In my free time, I play guitar.", exampleAr: "في وقت فراغي، أعزف الجيتار." }
      ],
      mimicChallenge: ["Swimming", "Cooking", "In my free time"],
      mimicTip: "Free time = فريتايم — الكلمتان تتصلان في الكلام الطبيعي كأنهما كلمة واحدة"
    },
    grammar: {
      patterns: [{
        name: "Like / Love / Enjoy + Verb-ing — التعبير عن الهوايات",
        explanation: "بعد like/love/enjoy يجب أن يأتي الفعل بصيغة -ing. مثال: I love READ → I love READING. I enjoy COOK → I enjoy COOKING. هذه القاعدة ثابتة دائماً مع هذه الكلمات الثلاثة!",
        formula: "I love / like / enjoy + [verb]-ing",
        examples: ["I love reading.", "She likes swimming.", "He enjoys cooking for friends."],
        exercises: [
          { question: "صرّف: I enjoy (travel) ___", answer: "I enjoy travelling." },
          { question: "صحّح: 'I like to swim every day' (استخدم ing)", answer: "I like swimming every day. (كلاهما صحيح في الواقع — 'like to swim' أيضاً مقبول!)" },
          { question: "اكتب هوايتك: أحب [هوايتك] في وقت فراغي.", answer: "I love [drawing/reading/gaming...] in my free time." }
        ]
      }]
    },
    reading: {
      passage: "Nadia loves reading and cooking in her free time. She enjoys making new recipes for her family. Her brother likes swimming every morning. He doesn't like staying at home. They both love spending time together.",
      breakdown: [
        { sentence: "Nadia loves reading and cooking in her free time.", words: [{ w: "loves", ar: "تحب" }, { w: "reading", ar: "القراءة" }, { w: "cooking", ar: "الطبخ" }, { w: "in her free time", ar: "في وقت فراغها" }], meaning: "ناديا تحب القراءة والطبخ في وقت فراغها." },
        { sentence: "She enjoys making new recipes for her family.", words: [{ w: "She enjoys", ar: "تستمتع" }, { w: "making", ar: "صنع" }, { w: "new recipes", ar: "وصفات جديدة" }, { w: "her family", ar: "عائلتها" }], meaning: "تستمتع بصنع وصفات جديدة لعائلتها." },
        { sentence: "Her brother likes swimming every morning.", words: [{ w: "likes", ar: "يحب" }, { w: "swimming", ar: "السباحة" }, { w: "every morning", ar: "كل صباح" }], meaning: "أخوها يحب السباحة كل صباح." },
        { sentence: "He doesn't like staying at home.", words: [{ w: "doesn't like", ar: "لا يحب" }, { w: "staying at home", ar: "البقاء في البيت" }], meaning: "هو لا يحب البقاء في البيت." }
      ]
    },
    listening: {
      context: "صديقان يتحدثان عن الهوايات",
      text: "What do you do in your free time? I love reading and swimming. What about you? I enjoy cooking and watching movies.",
      fillText: "What do you do in your _____ time? I love reading and _____. What about you? I enjoy cooking and _____ movies.",
      blanks: [
        { before: "in your", blank: "free", after: "time?" },
        { before: "I love reading and", blank: "swimming", after: "." },
        { before: "I enjoy cooking and", blank: "watching", after: "movies." }
      ]
    },
    shadowing: {
      chunk: "In my free time, I love reading",
      nativeForm: "ɪn maɪ friː taɪm aɪ lʌv ˈriːdɪŋ",
      explanation: "'In my free time' = إن-ماي-فريتايم (تتصل كأنها عبارة واحدة). وكلمة 'love' تُنطق بشكل محايد في الجمل العادية — ليست مبالغاً فيها دائماً!",
      steps: ["قل 'In my free time' كعبارة واحدة متصلة", "أضف هوايتك: In my free time, I love [X]", "صف 3 هوايات مختلفة لك ولأفراد عائلتك"],
      youtubeUrl: "https://www.youtube.com/results?search_query=hobbies+free+time+english+vocabulary+conversation+beginner"
    },
    writing: {
      challenges: ["اكتب عن 3 هوايات تحبها و2 لا تحبها (استخدم love/like/enjoy/don't like)", "اكتب عن هواية شخص تعرفه — استخدم He/She likes/loves"],
      companionPrompt: `You are an enthusiastic English tutor for a beginner who finished "A1 Day 15" (Hobbies).
RULES:
1. ONLY use: reading, swimming, cooking, drawing, music, travel, sport, I love/like/enjoy/don't like, in my free time, how about you, what do you do for fun
2. Ask about the student's hobbies and share yours enthusiastically
3. If they forget -ing after like/love/enjoy (e.g. "I love cook"), correct: "Great! We say 'I love cooking' — add -ing after the verb 😊"
4. React genuinely to their hobbies
5. Start: "Hello! Let's talk about something fun — what do you love doing in your free time?"`
    }
  },

  {
    id: 16,
    title: "At School & University",
    titleAr: "في المدرسة والجامعة",
    subtitle: "Classroom Life & Academic Vocabulary",
    subtitleAr: "الحياة في الفصل والمفردات الأكاديمية",
    vocabulary: {
      intro: "أنت طالب — هذه الكلمات تخصك مباشرة! يلا نتعلمها بسرعة!",
      words: [
        { word: "Lesson / Class", ipa: "/ˈlesn/ /klæs/", arabic: "حصة / صف", phonetic: "لِسَن / كلاس", example: "My English lesson is at 9.", exampleAr: "حصة الإنجليزية الساعة 9." },
        { word: "Homework", ipa: "/ˈhoʊmwɜːrk/", arabic: "واجب بيتي", phonetic: "هوم-وُرك", example: "Did you do your homework?", exampleAr: "هل أنجزت واجبك؟" },
        { word: "Exam", ipa: "/ɪɡˈzæm/", arabic: "امتحان", phonetic: "إغزام", example: "I have an exam tomorrow.", exampleAr: "عندي امتحان غداً." },
        { word: "Understand", ipa: "/ˌʌndərˈstænd/", arabic: "يفهم", phonetic: "أندَرستاند", example: "I don't understand this question.", exampleAr: "لا أفهم هذا السؤال." },
        { word: "Study", ipa: "/ˈstʌdi/", arabic: "يدرس", phonetic: "ستَدي", example: "I study every day.", exampleAr: "أدرس كل يوم." },
        { word: "Can you repeat, please?", ipa: "/kæn juː rɪˈpiːt pliːz/", arabic: "هل تستطيع التكرار؟", phonetic: "كان يو ريبيت بليز", example: "Sorry, can you repeat that, please?", exampleAr: "عذراً، هل تستطيع التكرار؟" }
      ],
      mimicChallenge: ["Understand", "Homework", "Exam"],
      mimicTip: "Understand = un-der-STAND (الضغط على STAND في النهاية)"
    },
    grammar: {
      patterns: [{
        name: "Do you...? / Did you...? — السؤال عن الحاضر والماضي",
        explanation: "لسؤال عن عادة حالية: 'Do you study every day?' لسؤال عن شيء في الماضي القريب: 'Did you do your homework?' لاحظ: مع Did يأتي الفعل بشكله الأساسي (do — مش did)!",
        formula: "Do you + [verb]? (عادة) / Did you + [verb]? (ماضي)",
        examples: ["Do you study every day?", "Did you do your homework?", "Do you understand the lesson?"],
        exercises: [
          { question: "اسأل: هل أنجزت واجبك أمس؟", answer: "Did you do your homework yesterday?" },
          { question: "اسأل: هل تدرس كل يوم؟", answer: "Do you study every day?" },
          { question: "صحّح: 'Did you studied for the exam?'", answer: "Did you study for the exam? (بعد did → الفعل الأساسي بدون s أو ed)" }
        ]
      }]
    },
    reading: {
      passage: "Tariq is a good student. He studies every day and does his homework on time. Today he has an English lesson. He does not understand one question, so he says: 'Can you repeat that, please?' Tariq feels ready for his exam.",
      breakdown: [
        { sentence: "He studies every day and does his homework on time.", words: [{ w: "studies", ar: "يدرس" }, { w: "every day", ar: "كل يوم" }, { w: "homework", ar: "الواجب" }, { w: "on time", ar: "في الوقت" }], meaning: "يدرس كل يوم ويُنجز واجبه في الوقت." },
        { sentence: "He does not understand one question, so he says: 'Can you repeat that, please?'", words: [{ w: "does not understand", ar: "لا يفهم" }, { w: "Can you repeat", ar: "هل تستطيع التكرار" }, { w: "please", ar: "من فضلك" }], meaning: "لا يفهم سؤالاً فيقول: هل تستطيع التكرار من فضلك؟" },
        { sentence: "Tariq feels ready for his exam.", words: [{ w: "Tariq", ar: "طارق" }, { w: "feels ready", ar: "يشعر بالجاهزية" }, { w: "his exam", ar: "امتحانه" }], meaning: "طارق يشعر بالجاهزية لامتحانه." }
      ]
    },
    listening: {
      context: "طالب وطالبة يتحدثان بعد الحصة",
      text: "Did you understand the lesson today? Not really. Can you help me? Of course! Let's study together.",
      fillText: "Did you _____ the lesson today? Not really. Can you _____ me? Of course! Let's _____ together.",
      blanks: [
        { before: "Did you", blank: "understand", after: "the lesson today?" },
        { before: "Can you", blank: "help", after: "me?" },
        { before: "Let's", blank: "study", after: "together." }
      ]
    },
    shadowing: {
      chunk: "Can you repeat that, please?",
      nativeForm: "kən jə rɪˈpiːt ðæt pliːz?",
      explanation: "هذه جملة ذهبية في الفصل! 'Can you' = كَنيا (سريعة ومتصلة). وكلمة 'repeat' الضغط على المقطع الثاني: re-PEAT. احفظ هذه الجملة — ستستخدمها مئات المرات!",
      steps: ["تدرب: 'Can you' ← كَنيا (سريع)", "أضف 'repeat that please' وقلها بنبرة مؤدبة", "جرب طلب التوضيح بثلاث طرق: repeat / say that again / I don't understand"],
      youtubeUrl: "https://www.youtube.com/results?search_query=classroom+english+vocabulary+school+university+students+beginner"
    },
    writing: {
      challenges: ["صف يومك الدراسي الكامل: كم حصة عندك؟ ما هو مادتك المفضلة؟ متى تنتهي؟", "اكتب 3 جمل تصف فيها طالباً جيداً — استخدم always/never/every day"],
      companionPrompt: `You are a classmate AND English tutor for a beginner who finished "A1 Day 16" (School/University).
RULES:
1. ONLY use: lesson/class, homework, exam, study, understand, teacher, explain, repeat, difficult/easy, favorite subject, do you/did you
2. Talk about school life naturally — ask about subjects, exams, homework
3. If they say "I not understand" correct to "I don't understand"
4. Be like a friendly classmate, not a strict teacher
5. Start: "Hey! Did you understand today's lesson? I found it a bit difficult..."`
    }
  },

  {
    id: 17,
    title: "Home & Rooms",
    titleAr: "البيت والغرف",
    subtitle: "Describing Your Home & Furniture",
    subtitleAr: "وصف بيتك وأثاثه",
    vocabulary: {
      intro: "البيت هو المكان الذي نقضي فيه معظم وقتنا — يلا نتعلم كيف نصفه!",
      words: [
        { word: "Bedroom", ipa: "/ˈbedruːm/", arabic: "غرفة النوم", phonetic: "بيد-روم", example: "My bedroom is small but cozy.", exampleAr: "غرفة نومي صغيرة لكن مريحة." },
        { word: "Kitchen", ipa: "/ˈkɪtʃɪn/", arabic: "مطبخ", phonetic: "كِيتشِن", example: "My mother is in the kitchen.", exampleAr: "أمي في المطبخ." },
        { word: "Living room", ipa: "/ˈlɪvɪŋ ruːm/", arabic: "غرفة الجلوس", phonetic: "ليفينغ روم", example: "We watch TV in the living room.", exampleAr: "نشاهد التلفاز في غرفة الجلوس." },
        { word: "Furniture", ipa: "/ˈfɜːrnɪtʃər/", arabic: "أثاث", phonetic: "فُرنِتشَر", example: "The furniture in our house is modern.", exampleAr: "الأثاث في بيتنا حديث." },
        { word: "There is / There are", ipa: "/ðer ɪz/ /ðer ɑːr/", arabic: "يوجد / يوجد (جمع)", phonetic: "ذير إز / ذير آر", example: "There is a big sofa in the living room.", exampleAr: "يوجد أريكة كبيرة في غرفة الجلوس." },
        { word: "Clean / Messy", ipa: "/kliːn/ /ˈmesi/", arabic: "نظيف / فوضوي", phonetic: "كلين / ميسي", example: "My room is clean. My brother's room is messy!", exampleAr: "غرفتي نظيفة. غرفة أخي فوضوية!" }
      ],
      mimicChallenge: ["Bedroom", "Living room", "Furniture"],
      mimicTip: "Living room = LIV-ing-room (الضغط على LIV). Furniture = FUR-ni-cher (3 مقاطع، ليس 4)"
    },
    grammar: {
      patterns: [{
        name: "There is + singular / There are + plural",
        explanation: "لوصف ما في غرفتك: 'There is' مع الاسم المفرد. 'There are' مع الجمع. مثال: There is a table (طاولة واحدة) / There are two chairs (كرسيان). هذه القاعدة مهمة!",
        formula: "There is + a/an + [singular] / There are + [number] + [plural]",
        examples: ["There is a big bed in my room.", "There are three windows.", "There isn't a TV in my bedroom."],
        exercises: [
          { question: "أكمل: ___ a sofa in the living room.", answer: "There is a sofa in the living room." },
          { question: "أكمل: ___ four chairs in the kitchen.", answer: "There are four chairs in the kitchen." },
          { question: "نفي: لا يوجد تلفزيون في غرفتي.", answer: "There isn't a TV in my bedroom." }
        ]
      }]
    },
    reading: {
      passage: "Hana lives in a small flat. There is a kitchen, a living room, and one bedroom. The furniture is old but comfortable. Hana's bedroom is always clean. Her brother's room is very messy!",
      breakdown: [
        { sentence: "There is a kitchen, a living room, and one bedroom.", words: [{ w: "There is", ar: "يوجد" }, { w: "kitchen", ar: "مطبخ" }, { w: "living room", ar: "غرفة جلوس" }, { w: "bedroom", ar: "غرفة نوم" }], meaning: "يوجد مطبخ وغرفة جلوس وغرفة نوم واحدة." },
        { sentence: "The furniture is old but comfortable.", words: [{ w: "furniture", ar: "الأثاث" }, { w: "old", ar: "قديم" }, { w: "comfortable", ar: "مريح" }], meaning: "الأثاث قديم لكنه مريح." },
        { sentence: "Hana's bedroom is always clean.", words: [{ w: "Hana's bedroom", ar: "غرفة نوم هَنا" }, { w: "always", ar: "دائماً" }, { w: "clean", ar: "نظيفة" }], meaning: "غرفة نوم هَنا دائماً نظيفة." },
        { sentence: "Her brother's room is very messy!", words: [{ w: "Her brother's room", ar: "غرفة أخيها" }, { w: "very messy", ar: "فوضوية جداً" }], meaning: "غرفة أخيها فوضوية جداً!" }
      ]
    },
    listening: {
      context: "شخص يصف بيته لصديقه",
      text: "My house is big and comfortable. There are three bedrooms and a large kitchen. My bedroom is very clean. I love my home!",
      fillText: "My house is big and _____. There are three bedrooms and a large _____. My bedroom is very _____. I love my home!",
      blanks: [
        { before: "big and", blank: "comfortable", after: "." },
        { before: "and a large", blank: "kitchen", after: "." },
        { before: "My bedroom is very", blank: "clean", after: "." }
      ]
    },
    shadowing: {
      chunk: "There is a big sofa in the living room",
      nativeForm: "ðər ɪz ə bɪɡ ˈsoʊfə ɪn ðə ˈlɪvɪŋ ruːm",
      explanation: "'There is' = ðərɪz (ذيريز) — تتصلان كأنهما كلمة واحدة في الكلام الطبيعي. و'the living room' = ðə-LIVing-room. حاول تقولها دفعة واحدة بسرعة!",
      steps: ["تدرب على 'There is/are' كوحدة واحدة", "صف غرفتك: There is a... / There are...", "صف 5 أشياء في غرفتك الآن باستخدام هذا النمط"],
      youtubeUrl: "https://www.youtube.com/results?search_query=home+rooms+furniture+english+vocabulary+there+is+there+are+beginner"
    },
    writing: {
      challenges: ["صف بيتك كاملاً: كم غرفة؟ ما الأثاث الموجود في غرفتك؟ (5-6 جمل)", "اكتب عن غرفة مثالية تحلم بها — صفها بالتفصيل"],
      companionPrompt: `You are a curious friend AND English tutor for a beginner who finished "A1 Day 17" (Home & Rooms).
RULES:
1. ONLY use: bedroom, kitchen, bathroom, living room, there is/are, furniture, clean/messy, big/small, comfortable, I have, on/in/next to
2. Ask the student to describe their home and room
3. If they say "there is two chairs" correct to "there ARE two chairs" — plural needs 'are'
4. Be genuinely curious about their home
5. Start: "Hello! I'm curious — what does your bedroom look like? Is it big or small?"`
    }
  },

  {
    id: 18,
    title: "Sports & Activities",
    titleAr: "الرياضة والأنشطة",
    subtitle: "Playing Sports & Staying Active",
    subtitleAr: "ممارسة الرياضة والبقاء نشيطاً",
    vocabulary: {
      intro: "الرياضة لغة عالمية — تعلم كيف تتحدث عنها بالإنجليزية!",
      words: [
        { word: "Football / Soccer", ipa: "/ˈfʊtbɔːl/ /ˈsɒkər/", arabic: "كرة القدم", phonetic: "فوتبول / سوكَر", example: "I play football every weekend.", exampleAr: "ألعب كرة القدم كل نهاية أسبوع." },
        { word: "Run", ipa: "/rʌn/", arabic: "يركض", phonetic: "رَن", example: "I run three kilometers every morning.", exampleAr: "أركض ثلاثة كيلومترات كل صباح." },
        { word: "Team", ipa: "/tiːm/", arabic: "فريق", phonetic: "تيم", example: "Our team won the game!", exampleAr: "فريقنا فاز باللعبة!" },
        { word: "Win / Lose", ipa: "/wɪn/ /luːz/", arabic: "يفوز / يخسر", phonetic: "وِن / لوز", example: "We want to win, not lose!", exampleAr: "نريد أن نفوز لا نخسر!" },
        { word: "Play", ipa: "/pleɪ/", arabic: "يلعب", phonetic: "بلِي", example: "Do you play any sport?", exampleAr: "هل تلعب أي رياضة؟" },
        { word: "Exercise", ipa: "/ˈeksərsaɪz/", arabic: "تمرين / يمارس الرياضة", phonetic: "إكسَرسايز", example: "I exercise for one hour every day.", exampleAr: "أتمرن ساعة كل يوم." }
      ],
      mimicChallenge: ["Exercise", "Football", "Win"],
      mimicTip: "Exercise = EX-er-size (3 مقاطع) — الضغط على EX في البداية"
    },
    grammar: {
      patterns: [{
        name: "Play + sport (بدون the) / Go + verb-ing",
        explanation: "قاعدة مهمة: مع الرياضات الجماعية نقول PLAY (play football/basketball/tennis). مع أنشطة تنتهي بـ ing في العادة نقول GO: go swimming/go running/go cycling. مثال: I play football. I go swimming.",
        formula: "I play + [team sport] / I go + [activity]-ing",
        examples: ["I play football.", "She goes swimming every day.", "He plays basketball.", "They go running in the park."],
        exercises: [
          { question: "أكمل بـ play أو go: I ___ tennis on weekends.", answer: "play (رياضة تنافسية مع مضرب)" },
          { question: "أكمل: She ___ running every morning.", answer: "goes" },
          { question: "ترجم: أنا لا أمارس أي رياضة — أفضل مشاهدة المباريات!", answer: "I don't play any sport — I prefer watching games!" }
        ]
      }]
    },
    reading: {
      passage: "Khalid loves football. He plays with his team every Friday. Before the game, they run and exercise for one hour. Sometimes they win and sometimes they lose. But Khalid always enjoys playing with his friends.",
      breakdown: [
        { sentence: "He plays with his team every Friday.", words: [{ w: "plays", ar: "يلعب" }, { w: "his team", ar: "فريقه" }, { w: "every Friday", ar: "كل جمعة" }], meaning: "يلعب مع فريقه كل جمعة." },
        { sentence: "Before the game, they run and exercise for one hour.", words: [{ w: "run", ar: "يركضون" }, { w: "exercise", ar: "يتمرنون" }, { w: "one hour", ar: "ساعة واحدة" }], meaning: "قبل المباراة يركضون ويتمرنون لمدة ساعة." },
        { sentence: "Sometimes they win and sometimes they lose.", words: [{ w: "Sometimes", ar: "أحياناً" }, { w: "win", ar: "يفوزون" }, { w: "lose", ar: "يخسرون" }], meaning: "أحياناً يفوزون وأحياناً يخسرون." },
        { sentence: "But Khalid always enjoys playing with his friends.", words: [{ w: "But", ar: "لكن" }, { w: "always enjoys", ar: "دائماً يستمتع" }, { w: "playing", ar: "اللعب" }, { w: "his friends", ar: "أصدقائه" }], meaning: "لكن خالد دائماً يستمتع باللعب مع أصدقائه." }
      ]
    },
    listening: {
      context: "شخص يتحدث عن رياضته المفضلة",
      text: "I love basketball! I play every Friday with my team. We train for two hours. I want to win the next game!",
      fillText: "I love _____! I play every _____ with my team. We _____ for two hours. I want to win the next game!",
      blanks: [
        { before: "I love", blank: "basketball", after: "!" },
        { before: "I play every", blank: "Friday", after: "with my team." },
        { before: "We", blank: "train", after: "for two hours." }
      ]
    },
    shadowing: {
      chunk: "I play football every weekend",
      nativeForm: "aɪ pleɪ ˈfʊtbɔːl ˈevri ˈwiːkend",
      explanation: "'every weekend' = evri-WEEKend — الضغط على WEEK. و'I play' تنطق بسرعة كأنها كلمة واحدة: آيبلِي. الجملة كلها: آيبلِي-فوتبول-إفري-ويكِند",
      steps: ["قل 'I play [sport]' بسرعة 3 مرات", "أضف 'every weekend/day/morning' واربط الكلمات", "أخبرني عن رياضتك أو النشاط الذي تحبه"],
      youtubeUrl: "https://www.youtube.com/results?search_query=sports+activities+english+vocabulary+play+go+beginner"
    },
    writing: {
      challenges: ["اكتب عن رياضتك المفضلة: متى تلعبها؟ مع من؟ كيف تشعر؟ (3-4 جمل)", "اكتب عن فريق رياضي تحبه — لماذا تحبه؟ هل يفوز كثيراً؟"],
      companionPrompt: `You are a sporty English tutor for a beginner who finished "A1 Day 18" (Sports).
RULES:
1. ONLY use: football/soccer, basketball, tennis, swim, run, team, win, lose, play, go (running/swimming), exercise, every, practice, fun
2. Talk about sports enthusiastically — ask about their sport and team
3. Teach 'play' vs 'go' naturally in conversation
4. If they say "I do football" correct to "I play football"
5. Start: "Hey! Are you into sports? What sport do you play?"`
    }
  },

  {
    id: 19,
    title: "Emotions & Feelings",
    titleAr: "المشاعر والأحاسيس",
    subtitle: "Expressing How You Feel",
    subtitleAr: "التعبير عن مشاعرك",
    vocabulary: {
      intro: "المشاعر هي أكثر شيء إنساني — تعلّم كيف تعبر عنها بالإنجليزية!",
      words: [
        { word: "Happy", ipa: "/ˈhæpi/", arabic: "سعيد", phonetic: "هابي", example: "I am very happy today!", exampleAr: "أنا سعيد جداً اليوم!" },
        { word: "Sad", ipa: "/sæd/", arabic: "حزين", phonetic: "سِاد", example: "She is sad because she missed her friend.", exampleAr: "هي حزينة لأنها اشتاقت لصديقتها." },
        { word: "Tired", ipa: "/ˈtaɪərd/", arabic: "متعب / تعبان", phonetic: "تايَرد", example: "I am very tired after work.", exampleAr: "أنا متعب جداً بعد العمل." },
        { word: "Excited", ipa: "/ɪkˈsaɪtɪd/", arabic: "متحمس", phonetic: "إكسايتِد", example: "I am excited about the trip!", exampleAr: "أنا متحمس للرحلة!" },
        { word: "Angry", ipa: "/ˈæŋɡri/", arabic: "غاضب / زعلان", phonetic: "أنغري", example: "He is angry because they lost the game.", exampleAr: "هو غاضب لأنهم خسروا اللعبة." },
        { word: "Why / Because", ipa: "/waɪ/ /bɪˈkɒz/", arabic: "لماذا / لأن", phonetic: "واي / بيكوز", example: "Why are you sad? Because I miss my family.", exampleAr: "لماذا أنت حزين؟ لأنني أشتاق لعائلتي." }
      ],
      mimicChallenge: ["Excited", "Angry", "Tired"],
      mimicTip: "Excited = ik-SY-ted (الضغط على الوسط). Tired = TAI-erd (مقطعان)"
    },
    grammar: {
      patterns: [{
        name: "Why...? / Because... — السؤال عن السبب والإجابة",
        explanation: "لسؤال عن السبب نستخدم 'Why?' والإجابة دائماً تبدأ بـ 'Because'. مثال: Why are you happy? → Because I got a good grade! Why is she sad? → Because she is tired. سهلة وطبيعية!",
        formula: "Why + are you/is she + [feeling]? → Because + [reason]",
        examples: ["Why are you happy? — Because I passed my exam!", "Why is he tired? — Because he worked all day.", "I am excited because we have a trip tomorrow."],
        exercises: [
          { question: "اسأل: لماذا أنت زعلان؟", answer: "Why are you angry/sad?" },
          { question: "أجب: لأنني متعب جداً اليوم.", answer: "Because I am very tired today." },
          { question: "رتّب: (excited / I / because / trip / am / have a / I)", answer: "I am excited because I have a trip." }
        ]
      }]
    },
    reading: {
      passage: "Mona wakes up happy today because the sun is bright. She is excited because her best friend is coming to visit. In the afternoon, she feels tired because she cleaned the whole house. Her cat breaks a cup and she is a little angry. But then she laughs and feels happy again.",
      breakdown: [
        { sentence: "Mona wakes up happy today because the sun is bright.", words: [{ w: "wakes up", ar: "تستيقظ" }, { w: "happy", ar: "سعيدة" }, { w: "because", ar: "لأن" }, { w: "the sun is bright", ar: "الشمس مشرقة" }], meaning: "مُنى تستيقظ سعيدة اليوم لأن الشمس مشرقة." },
        { sentence: "She is excited because her best friend is coming to visit.", words: [{ w: "excited", ar: "متحمسة" }, { w: "because", ar: "لأن" }, { w: "best friend", ar: "صديقتها المقربة" }, { w: "coming to visit", ar: "ستأتي للزيارة" }], meaning: "هي متحمسة لأن صديقتها المقربة ستأتي للزيارة." },
        { sentence: "In the afternoon, she feels tired because she cleaned the whole house.", words: [{ w: "feels tired", ar: "تشعر بالتعب" }, { w: "because", ar: "لأن" }, { w: "cleaned", ar: "نظّفت" }, { w: "the whole house", ar: "البيت كله" }], meaning: "في فترة الظهر تشعر بالتعب لأنها نظّفت البيت كله." },
        { sentence: "Her cat breaks a cup and she is a little angry.", words: [{ w: "Her cat", ar: "قطتها" }, { w: "breaks", ar: "تكسر" }, { w: "a cup", ar: "كوباً" }, { w: "angry", ar: "غاضبة" }], meaning: "قطتها تكسر كوباً وهي غاضبة قليلاً." },
        { sentence: "But then she laughs and feels happy again.", words: [{ w: "she laughs", ar: "تضحك" }, { w: "feels happy", ar: "تشعر بالسعادة" }, { w: "again", ar: "مجدداً" }], meaning: "لكنها تضحك وتشعر بالسعادة مجدداً." }
      ]
    },
    listening: {
      context: "صديقان يتحدثان عن يومهما",
      text: "How do you feel today? I am a bit tired, but I am also excited because we have a party tonight!",
      fillText: "How do you _____ today? I am a bit _____, but I am also _____ because we have a party tonight!",
      blanks: [
        { before: "How do you", blank: "feel", after: "today?" },
        { before: "I am a bit", blank: "tired", after: "," },
        { before: "but I am also", blank: "excited", after: "because we have a party tonight!" }
      ]
    },
    shadowing: {
      chunk: "I'm so excited about tomorrow!",
      nativeForm: "aɪm soʊ ɪkˈsaɪtɪd əˈbaʊt təˈmɒroʊ",
      explanation: "'I'm' = آيم (اختصار I am دائماً في الكلام العادي). و'so excited' — كلمة 'so' تُضغط للتعبير عن الإحساس القوي. النبرة مهمة هنا — العاطفة تظهر في الصوت!",
      steps: ["قل الجملة بنبرة متحمسة — الإحساس جزء من النطق", "غير 'excited' بمشاعر أخرى: I'm so happy/nervous/tired...", "أخبرني عن شيء ستفعله غداً وعبّر عن مشاعرك"],
      youtubeUrl: "https://www.youtube.com/results?search_query=emotions+feelings+english+vocabulary+expressions+beginner"
    },
    writing: {
      challenges: ["اكتب عن مشاعرك اليوم — اشرح لماذا تشعر هكذا (استخدم because في كل جملة)", "اكتب عن أسعد يوم في حياتك — ماذا حدث؟ كيف شعرت؟"],
      companionPrompt: `You are an empathetic English tutor for a beginner who finished "A1 Day 19" (Emotions).
RULES:
1. ONLY use: happy, sad, tired, excited, angry, nervous, bored, feel, why, because, today, I am, she/he is
2. Ask how the student is feeling and why
3. React warmly to their feelings: "Oh, you're excited! That's great! Why?"
4. If they say "I am feel happy" correct to "I feel happy" or "I am happy" (not both)
5. Start: "Hello! How are you feeling today? Happy? Tired? Tell me! 😊"`
    }
  },

  {
    id: 20,
    title: "Months & Dates",
    titleAr: "الأشهر والتواريخ",
    subtitle: "Months of the Year, Seasons & Birthdays",
    subtitleAr: "أشهر السنة والفصول وأعياد الميلاد",
    vocabulary: {
      intro: "التواريخ جزء من كل محادثة — عيد الميلاد، المواعيد، الأعياد. يلا نتعلمها!",
      words: [
        { word: "January / February / March", ipa: "/ˈdʒænjueri/ /ˈfebrueri/ /mɑːrtʃ/", arabic: "يناير / فبراير / مارس", phonetic: "جانيواري / فيبرواري / مارتش", example: "My birthday is in March.", exampleAr: "عيد ميلادي في مارس." },
        { word: "Birthday", ipa: "/ˈbɜːrθdeɪ/", arabic: "عيد ميلاد", phonetic: "بُرث-داي", example: "When is your birthday?", exampleAr: "متى عيد ميلادك؟" },
        { word: "When", ipa: "/wen/", arabic: "متى", phonetic: "وين", example: "When is the exam?", exampleAr: "متى الامتحان؟" },
        { word: "Next / Last", ipa: "/nekst/ /læst/", arabic: "القادم / الماضي", phonetic: "نيكست / لاست", example: "My exam is next Monday. My birthday was last June.", exampleAr: "امتحاني الاثنين القادم. عيد ميلادي كان يونيو الماضي." },
        { word: "In [month]", ipa: "/ɪn/", arabic: "في شهر...", phonetic: "إن", example: "My birthday is in July.", exampleAr: "عيد ميلادي في يوليو." },
        { word: "Happy Birthday!", ipa: "/ˈhæpi ˈbɜːrθdeɪ/", arabic: "عيد ميلاد سعيد!", phonetic: "هابي بُرثداي", example: "Happy Birthday! How old are you now?", exampleAr: "عيد ميلاد سعيد! كم عمرك الآن؟" }
      ],
      mimicChallenge: ["February", "Birthday", "January"],
      mimicTip: "February = FEB-roo-ery (أو FEB-yoo-ery) — كثيرون ينطقونها بدون R ثانية: 'Febuary'. كلاهما مقبول!"
    },
    grammar: {
      patterns: [{
        name: "In (month) / On (date) / At (time) — حروف الجر مع الوقت",
        explanation: "ثلاثة حروف جر مهمة جداً: IN مع الأشهر والفصول والسنوات، ON مع الأيام والتواريخ، AT مع الساعات. مثال: in March / on Monday / on July 15th / at 9 o'clock.",
        formula: "IN + [month/season/year] / ON + [day/date] / AT + [time]",
        examples: ["My birthday is in July.", "The exam is on Monday.", "Class starts at 8 o'clock.", "I was born in 2004."],
        exercises: [
          { question: "أكمل: My birthday is ___ September.", answer: "in (in + month)" },
          { question: "أكمل: The meeting is ___ Friday ___ 10 o'clock.", answer: "on Friday at 10 o'clock" },
          { question: "صحّح: 'I was born at 2001.'", answer: "I was born in 2001. (نستخدم in مع السنة)" }
        ]
      }]
    },
    reading: {
      passage: "Ziad's birthday is in January. Last year, his family made a big cake for him. Next month, his friend Dina has her birthday in February. Ziad will say: 'Happy Birthday, Dina!' When is your birthday?",
      breakdown: [
        { sentence: "Ziad's birthday is in January.", words: [{ w: "Ziad's birthday", ar: "عيد ميلاد زياد" }, { w: "in January", ar: "في يناير" }], meaning: "عيد ميلاد زياد في يناير." },
        { sentence: "Last year, his family made a big cake for him.", words: [{ w: "Last year", ar: "العام الماضي" }, { w: "his family", ar: "عائلته" }, { w: "made a big cake", ar: "صنعت كعكة كبيرة" }, { w: "for him", ar: "له" }], meaning: "العام الماضي صنعت عائلته كعكة كبيرة له." },
        { sentence: "Next month, his friend Dina has her birthday in February.", words: [{ w: "Next month", ar: "الشهر القادم" }, { w: "birthday", ar: "عيد ميلاد" }, { w: "in February", ar: "في فبراير" }], meaning: "الشهر القادم، صديقته دينا عيد ميلادها في فبراير." },
        { sentence: "Ziad will say: 'Happy Birthday, Dina!'", words: [{ w: "will say", ar: "سيقول" }, { w: "Happy Birthday", ar: "عيد ميلاد سعيد" }], meaning: "زياد سيقول: عيد ميلاد سعيد يا دينا!" },
        { sentence: "When is your birthday?", words: [{ w: "When", ar: "متى" }, { w: "your birthday", ar: "عيد ميلادك" }], meaning: "متى عيد ميلادك؟" }
      ]
    },
    listening: {
      context: "صديقان يتحدثان عن أعياد الميلاد",
      text: "When is your birthday? My birthday is in December. When is yours? Mine is in March. Happy early birthday!",
      fillText: "When is your _____? My birthday is in _____. When is yours? Mine is in March. Happy early _____!",
      blanks: [
        { before: "When is your", blank: "birthday", after: "?" },
        { before: "My birthday is in", blank: "December", after: "." },
        { before: "Happy early", blank: "birthday", after: "!" }
      ]
    },
    shadowing: {
      chunk: "My birthday is in [month]",
      nativeForm: "maɪ ˈbɜːrθdeɪ ɪz ɪn [month]",
      explanation: "Birthday = BUH-th-day — حرف th هنا = ث (مثل 'the'). في الكلام السريع: 'My birthday's in July' — نضيف 's للاختصار حتى مع birthday في الكلام العادي أحياناً!",
      steps: ["تدرب على نطق 'birthday' بشكل صحيح: BURTHday", "قل تاريخ ميلادك كاملاً: My birthday is on [day] [number] in [month]", "اسأل 3 أفراد خيالية من عائلتك عن أعياد ميلادهم"],
      youtubeUrl: "https://www.youtube.com/results?search_query=months+of+the+year+english+dates+birthday+beginner+pronunciation"
    },
    writing: {
      challenges: ["اكتب عن آخر عيد ميلاد احتفلت فيه — متى كان؟ ماذا فعلت؟ من كان معك؟", "اكتب عن 3 أحداث مهمة في حياتك مع تواريخها (استخدم in/on)"],
      companionPrompt: `You are a celebratory English tutor for a beginner who finished "A1 Day 20" (Months & Dates).
RULES:
1. ONLY use: months (January-December), birthday, when, next/last, in/on/at, year, how old, happy birthday, celebrate, party, gift
2. Ask about birthdays, important dates, favorite months
3. Teach in/on/at naturally in conversation — don't lecture, just model and correct
4. If they say "in Monday" correct to "ON Monday"
5. Start: "Hello! I love talking about birthdays and dates! When is YOUR birthday?"`
    }
  }
]
