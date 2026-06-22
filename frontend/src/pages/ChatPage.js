import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../data';

function ChatPage() {
  const navigate = useNavigate();
  const { subjectCode } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quizTopic, setQuizTopic] = useState('');
  const [awaitingQuizAnswer, setAwaitingQuizAnswer] = useState(false);
  const [lastQuizText, setLastQuizText] = useState('');
  const studentId = 'student1';
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetch(`${API_URL}/history/${studentId}/${subjectCode}`)
      .then((res) => res.json())
      .then((data) => {
        const loaded = data.history.map(([role, content]) => ({ role, content }));
        setMessages(loaded);
      })
      .catch(() => setMessages([]));
  }, [subjectCode]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const question = input;
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      if (awaitingQuizAnswer) {
        const formData = new URLSearchParams();
        formData.append('subject_code', subjectCode);
        formData.append('quiz_text', lastQuizText);
        formData.append('student_answer', question);

        const res = await fetch(`${API_URL}/quiz/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.result }]);
        setAwaitingQuizAnswer(false);
      } else {
        const formData = new URLSearchParams();
        formData.append('student_id', studentId);
        formData.append('subject_code', subjectCode);
        formData.append('question', question);

        const res = await fetch(`${API_URL}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'حدث خطأ بالاتصال، حاول مرة أخرى.' },
      ]);
    }
    setLoading(false);
  };

const startQuiz = async () => {
    if (!quizTopic.trim()) return;
    const topic = quizTopic;
    setMessages((prev) => [...prev, { role: 'user', content: `كويز عن: ${topic}` }]);
    setQuizTopic('');
    setQuizMode(false);
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('student_id', studentId);
      formData.append('subject_code', subjectCode);
      formData.append('topic', topic);
      formData.append('num_questions', '5');

      const res = await fetch(`${API_URL}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.quiz }]);
      setLastQuizText(data.quiz);
      setAwaitingQuizAnswer(true);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'حدث خطأ بإنشاء الكويز، حاول مرة أخرى.' },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuizKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      startQuiz();
    }
  };

  return (
    <div className="chat-shell">
      <div className="chat-top">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="رجوع للمواد">
          رجوع
        </button>
        <span className="chat-subject-name" lang="en">{subjectCode}</span>
        <button
          className="quiz-toggle-btn"
          onClick={() => setQuizMode((prev) => !prev)}
          aria-label="فتح كويز جديد"
        >
          كويز
        </button>
      </div>

      {quizMode && (
        <div className="quiz-bar">
          <input
            type="text"
            className="quiz-input"
            value={quizTopic}
            onChange={(e) => setQuizTopic(e.target.value)}
            onKeyDown={handleQuizKeyDown}
            placeholder="اكتب اسم الموضوع بالإنجليزي مثل paragraph writing"
            aria-label="اكتب موضوع الكويز"
          />
          <button className="send-btn" onClick={startQuiz} aria-label="إنشاء الكويز">
            إنشاء
          </button>
        </div>
      )}

      {awaitingQuizAnswer && (
        <p className="quiz-hint">اكتبي إجاباتك على الأسئلة بالمربع تحت، وسأتحقق منها لك</p>
      )}

      <div className="chat-box" role="log" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'msg-user' : 'msg-ai'}>
            {m.content}
          </div>
        ))}
        {loading && <div className="msg-ai">جاري الكتابة...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="input-bar">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={awaitingQuizAnswer ? 'اكتب إجابتك هنا...' : 'اكتب سؤالك هنا...'}
          aria-label="اكتب سؤالك أو إجابتك"
          rows={1}
        />
        <button className="send-btn" onClick={sendMessage} disabled={loading} aria-label="إرسال">
          إرسال
        </button>
      </div>
    </div>
  );
}

export default ChatPage;