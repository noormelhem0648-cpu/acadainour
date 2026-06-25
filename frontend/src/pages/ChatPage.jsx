import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

function ChatPage() {
  const { subjectCode } = useParams(); // يجلب رمز المادة من الرابط تلقائياً
  const [messages, setMessages] = useState([]); // مصفوفة الذاكرة الكاملة
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  // دالة ذكية لفحص النص وتحديد اتجاهه (RTL للعربي و LTR للإنجليزي)
  const detectDirection = (text) => {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text) ? 'rtl' : 'ltr';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    // تحديث الـ State بإضافة رسالة المستخدم الجديدة مع الحفاظ على القديم
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    try {
      // هنا نرسل كامل مصفوفة الـ messages (تاريخ المحادثة) للـ Backend لحفظ السياق
      const response = await fetch(`https://acadai-backend-avvo.onrender.com/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_code: subjectCode,
          history: updatedMessages // إرسال التاريخ الكامل
        }),
      });
      
      const data = await response.json();
      setMessages([...updatedMessages, { role: 'model', content: data.answer }]);
    } catch (error) {
      setMessages([...updatedMessages, { role: 'model', content: 'حدث خطأ في الاتصال بالخادم.' }]);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col flex-1 max-w-4xl w-full mx-auto bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden shadow-sm h-[80vh]">
      
      {/* اسم المادة الحالي في أعلى الشات */}
      <div className="bg-white dark:bg-neutral-900 px-6 py-4 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center">
        <span className="font-semibold text-lg">مساعد مادة: <span className="text-[#E1989A]">{subjectCode}</span></span>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-full">AcadAI Engine v2.5</span>
      </div>

      {/* منطقة الرسائل */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const dir = detectDirection(msg.content);
          
          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div 
                dir={dir}
                className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm md:text-base transition-all
                  ${isUser 
                    ? 'bg-[#E1989A] text-white rounded-br-none text-right' 
                    : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-bl-none text-left'
                  }`}
                style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}
              >
                {/* استخدام ReactMarkdown لعرض التنسيقات كالعناوين والنقاط بدلاً من النصوص المصمتة */}
                <ReactMarkdown className="prose dark:prose-invert max-w-none">
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* صندوق الإدخال والرفع */}
      <form onSubmit={handleSend} className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اسأل المساعد الأكاديمي الذكي عن محتوى الكتاب..."
          className="flex-1 px-4 py-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-[#E1989A] transition-all text-sm dark:text-white"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-[#E1989A] hover:bg-[#d4a5a5] text-white font-medium rounded-xl transition-all shadow-sm text-sm"
        >
          إرسال
        </button>
      </form>
    </div>
  );
}

export default ChatPage;