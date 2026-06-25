import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const subjectCode = searchParams.get('subject') || 'General';
  
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `مرحباً بك! أنا مساعدك الأكاديمي **AcadAI** لمادة **${subjectCode}**. كيف يمكنني مساعدتك في الشرح اليوم؟` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const isArabic = (text) => /[\u0600-\u06FF]/.test(text);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const updatedHistory = [...messages, userMessage];
    
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://YOUR_BACKEND_URL.render.com/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_code: subjectCode,
          message: input,
          history: updatedHistory // تمرير مصفوفة التاريخ الكاملة للباكيند لحفظ الذاكرة
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'حدث خطأ في معالجة الإجابة الأكاديمية.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'خطأ في الاتصال بالخادم الرئيسي.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-gray-50 dark:bg-[#1E1E1E] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
      <div className="bg-white dark:bg-[#1E1E1E] px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">مادة الدراسات: {subjectCode}</span>
        <div className="flex gap-3 text-lg text-gray-500">
          <button title="الملفات">📎</button>
          <button title="الصور">🖼️</button>
          <button title="الصوت">🎤</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isAr = isArabic(msg.content);
          return (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} dir={isAr ? 'rtl' : 'ltr'}>
              <div className={`max-w-[85%] px-5 py-3 rounded-2xl shadow-xs text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-[#E1989A] text-white rounded-br-none' : 'bg-white dark:bg-[#2A2A2A] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
              }`}>
                <ReactMarkdown className="prose dark:prose-invert max-w-none text-inherit">{msg.content}</ReactMarkdown>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] p-4 border-t border-gray-200 dark:border-gray-800">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اسألي مساعدك الأكاديمي الذكي عن أي شيء..."
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-[#E1989A] dark:focus:border-[#E1989A] transition-colors"
          />
          <button type="submit" className="bg-[#E1989A] hover:bg-[#D4A5A5] text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
            إرسال
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;