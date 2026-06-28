import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const API_URL = "https://acadai-backend-avvo.onrender.com";

function isRTL(text) {
  return /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(text);
}

function downloadTxt(text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "AcadAI-answer.txt";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPdf(text) {
  const w = window.open("", "_blank");
  if (!w) return;
  const html = text
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/## (.*?)(<br>)/g, "<h3>$1</h3>");
  w.document.write(`
    <html><head><meta charset="utf-8"><title>AcadAI Answer</title>
    <style>body{font-family:Segoe UI,sans-serif;padding:40px;line-height:1.8;direction:auto}
    h3{color:#c9858a}strong{color:#a96368}table{border-collapse:collapse;width:100%}
    td,th{border:1px solid #ddd;padding:8px}th{background:#f5e8e9}</style></head>
    <body>${html}</body></html>`);
  w.document.close();
  setTimeout(() => { w.print(); }, 500);
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const LOADING_STEPS = [
  "جاري قراءة السؤال...",
  "البحث في مواد الكورس...",
  "تحليل المعلومات...",
  "توليد الإجابة..."
];

export default function ChatPage({ darkMode, setDarkMode, user, token, onLogout }) {
  const navigate = useNavigate();
  const { subjectCode } = useParams();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "أهلاً! أنا **AcadAI** — مساعدك الأكاديمي لمادة **" + subjectCode + "** 🎓\nاسألني أي سؤال عن المادة وراح أجاوبك من الكتاب أولاً.\n\nHi! I'm **AcadAI** — your study buddy for **" + subjectCode + "**. Ask me anything!",
      time: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedImage, setAttachedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [quizTopic, setQuizTopic] = useState("");
  const [quizType, setQuizType] = useState("mix");
  const [examTopic, setExamTopic] = useState("");
  const [examDifficulty, setExamDifficulty] = useState("medium");
  const [examUnits, setExamUnits] = useState("");
  const [likedMsgs, setLikedMsgs] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [savedChats, setSavedChats] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesRef = useRef(messages);
  const loadingInterval = useRef(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingStep]);

  useEffect(() => {
    let interval;
    const ping = () => {
      fetch(API_URL + "/").then(() => {}).catch(() => {});
    };
    ping();
    interval = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Load saved chats from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`acadai_chats_${subjectCode}`) || "[]");
      setSavedChats(saved);
    } catch (e) {}
  }, [subjectCode]);

  // Auto-save current chat
  useEffect(() => {
    if (messages.length <= 1) return;
    const chatId = messages[0]?.chatId || Date.now();
    if (!messages[0].chatId) {
      setMessages(prev => {
        const updated = [{ ...prev[0], chatId }, ...prev.slice(1)];
        messagesRef.current = updated;
        return updated;
      });
    }
    try {
      const saved = JSON.parse(localStorage.getItem(`acadai_chats_${subjectCode}`) || "[]");
      const existing = saved.findIndex(c => c.id === chatId);
      const chatData = {
        id: chatId,
        title: messages.find(m => m.role === "user")?.content?.slice(0, 40) || "New Chat",
        time: Date.now(),
        messages: messages,
      };
      if (existing >= 0) saved[existing] = chatData;
      else saved.unshift(chatData);
      const trimmed = saved.slice(0, 20);
      localStorage.setItem(`acadai_chats_${subjectCode}`, JSON.stringify(trimmed));
      setSavedChats(trimmed);
    } catch (e) {}
  }, [messages, subjectCode]);

  const startNewChat = () => {
    setMessages([{
      role: "assistant",
      content: "أهلاً! أنا **AcadAI** — مساعدك الأكاديمي لمادة **" + subjectCode + "** 🎓\nاسألني أي سؤال عن المادة وراح أجاوبك من الكتاب أولاً.\n\nHi! I'm **AcadAI** — your study buddy for **" + subjectCode + "**. Ask me anything!",
      time: Date.now(),
      chatId: Date.now(),
    }]);
    setLikedMsgs({});
    setShowHistory(false);
  };

  const loadChat = (chat) => {
    setMessages(chat.messages);
    messagesRef.current = chat.messages;
    setLikedMsgs({});
    setShowHistory(false);
  };

  const deleteChat = (chatId) => {
    try {
      const saved = JSON.parse(localStorage.getItem(`acadai_chats_${subjectCode}`) || "[]");
      const filtered = saved.filter(c => c.id !== chatId);
      localStorage.setItem(`acadai_chats_${subjectCode}`, JSON.stringify(filtered));
      setSavedChats(filtered);
    } catch (e) {}
  };

  // Loading step animation
  useEffect(() => {
    if (loading) {
      setLoadingStep(0);
      let step = 0;
      loadingInterval.current = setInterval(() => {
        step = Math.min(step + 1, LOADING_STEPS.length - 1);
        setLoadingStep(step);
      }, 2000);
    } else {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
    }
    return () => { if (loadingInterval.current) clearInterval(loadingInterval.current); };
  }, [loading]);

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const handleLike = (idx, type) => {
    setLikedMsgs(prev => ({ ...prev, [idx]: prev[idx] === type ? null : type }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);
  };

  const clearAttachments = () => {
    setAttachedFile(null);
    setAttachedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const callAPI = useCallback(async (userMessage, msgHistory, convoId) => {
    const history = msgHistory.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      content: m.content
    }));
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(API_URL + "/ask", {
          method: "POST",
          headers,
          body: JSON.stringify({ subject_code: subjectCode, message: userMessage, history, conversation_id: convoId || null }),
        });
        if (res.status === 404 && attempt === 0) {
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        const data = await res.json();
        return { answer: data.answer || data.detail || "No response received.", conversation_id: data.conversation_id };
      } catch (err) {
        if (attempt === 0) { await new Promise(r => setTimeout(r, 3000)); continue; }
        throw err;
      }
    }
  }, [subjectCode, token]);

  const addMessage = (role, content, extra = {}) => {
    setMessages(prev => {
      const updated = [...prev, { role, content, time: Date.now(), ...extra }];
      messagesRef.current = updated;
      return updated;
    });
  };

  const sendMessage = async () => {
    if (loading) return;
    if (!input.trim() && !attachedImage && !attachedFile) return;
    const userMessage = input.trim() || (attachedImage ? "Image attached" : "File attached");
    addMessage("user", userMessage);
    setInput("");
    setLoading(true);

    try {
      let answer;
      const currentMsgs = messagesRef.current;
      const historyMsgs = currentMsgs.slice(0, -1);

      if (attachedImage || attachedFile) {
        const formData = new FormData();
        formData.append("subject_code", subjectCode);
        formData.append("message", userMessage);
        formData.append("history", JSON.stringify(historyMsgs.map(m => ({ role: m.role === "assistant" ? "model" : "user", content: m.content }))));
        if (attachedImage) formData.append("file", attachedImage);
        else if (attachedFile) formData.append("file", attachedFile);
        const res = await fetch(API_URL + "/upload-and-ask", { method: "POST", body: formData });
        const data = await res.json();
        answer = data.answer || data.detail || "No response.";
      } else {
        const result = await callAPI(userMessage, historyMsgs);
        answer = result.answer;
      }
      addMessage("assistant", answer);
      clearAttachments();
    } catch (err) {
      addMessage("assistant", "عذراً، حصل خطأ بالاتصال. حاول مرة ثانية. 🔄\nSorry, connection error. Please try again.", { isError: true });
    }
    setLoading(false);
  };

  const regenerateMessage = async (idx) => {
    if (loading) return;
    const userIdx = idx - 1;
    if (userIdx < 0 || messages[userIdx].role !== "user") return;
    const userMessage = messages[userIdx].content;
    const historyBefore = messages.slice(0, userIdx);

    setMessages(prev => {
      const updated = [...prev.slice(0, idx)];
      messagesRef.current = updated;
      return updated;
    });
    setLoading(true);

    try {
      const { answer } = await callAPI(userMessage, historyBefore);
      addMessage("assistant", answer);
    } catch (err) {
      addMessage("assistant", "عذراً، حصل خطأ. حاول مرة ثانية. 🔄", { isError: true });
    }
    setLoading(false);
  };

  const retryLastMessage = async () => {
    if (loading) return;
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === "user");
    if (lastUserIdx === -1) return;
    const idx = messages.length - 1 - lastUserIdx;
    const userMessage = messages[idx].content;
    const historyBefore = messages.slice(0, idx);

    setMessages(prev => {
      const updated = [...prev.slice(0, idx + 1)];
      messagesRef.current = updated;
      return updated;
    });
    setLoading(true);

    try {
      const { answer } = await callAPI(userMessage, historyBefore);
      addMessage("assistant", answer);
    } catch (err) {
      addMessage("assistant", "عذراً، حصل خطأ بالاتصال. حاول مرة ثانية. 🔄", { isError: true });
    }
    setLoading(false);
  };

  const QUIZ_TYPES = {
    mix: "Generate a quiz with 7 questions using a MIX of: multiple choice (ضع دائرة), True/False, fill-in-the-blank (املأ الفراغ), and 1-2 short answer questions (أسئلة قصيرة).",
    mcq: "Generate a quiz with 7 multiple choice questions (ضع دائرة حول الإجابة الصحيحة). Each question should have 4 options (a, b, c, d).",
    fillblank: "Generate a quiz with 7 fill-in-the-blank questions (املأ الفراغ). Each sentence should have one blank (_______) for the student to complete.",
    short: "Generate a quiz with 5 short answer questions (أسئلة مقالية قصيرة). Each question requires a 1-3 sentence answer.",
  };

  const generateQuiz = async (topic, type) => {
    if (loading) return;
    setShowQuizModal(false);
    const topicText = topic ? ` Focus on the topic: "${topic}".` : "";
    const typePrompt = QUIZ_TYPES[type || "mix"];
    const quizPrompt = `${typePrompt}${topicText} Number each question. Put all answers at the end under "## Answers" section.`;

    const typeLabels = { mix: "Mix", mcq: "MCQ", fillblank: "Fill Blank", short: "Short Answer" };
    addMessage("user", `📝 Quiz (${typeLabels[type || "mix"]})${topic ? ": " + topic : ""}`);
    setLoading(true);

    try {
      const { answer } = await callAPI(quizPrompt, messagesRef.current.slice(0, -1));
      addMessage("assistant", answer);
    } catch (err) {
      addMessage("assistant", "ما قدرت أعمل الكويز. حاول مرة ثانية 🔄", { isError: true });
    }
    setLoading(false);
    setQuizTopic("");
  };

  const generateExam = async () => {
    if (loading) return;
    setShowExamModal(false);
    const diffLabels = { easy: "Easy (سهل)", medium: "Medium (متوسط)", hard: "Hard (صعب)" };
    const diffPrompts = {
      easy: "Make the questions simple and straightforward, suitable for beginners. Use basic vocabulary and simple sentence structures.",
      medium: "Make the questions at a university level, requiring understanding of concepts and application.",
      hard: "Make the questions challenging, requiring deep analysis, critical thinking, and advanced knowledge.",
    };
    const unitText = examUnits.trim() ? ` Focus ONLY on these units/chapters: ${examUnits.trim()}.` : " Cover all available material.";
    const topicText = examTopic ? ` Special focus on: "${examTopic}".` : "";

    const examPrompt = `Generate a FULL EXAM for subject ${subjectCode}.${unitText}${topicText}
Difficulty: ${diffLabels[examDifficulty]}. ${diffPrompts[examDifficulty]}

The exam must include ALL of these sections:
## Section A: Multiple Choice (ضع دائرة) — 5 questions with 4 options each
## Section B: True/False (صح أم خطأ) — 5 questions
## Section C: Fill in the Blank (املأ الفراغ) — 5 questions
## Section D: Short Answer (أجب بإيجاز) — 3 questions

Total: 18 questions. Put all answers at the very end under "## Answer Key".
Add the total mark for each section.`;

    addMessage("user", `📄 Exam (${diffLabels[examDifficulty]})${examUnits.trim() ? " — " + examUnits.trim() : ""}${examTopic ? ": " + examTopic : ""}`);
    setLoading(true);

    try {
      const { answer } = await callAPI(examPrompt, messagesRef.current.slice(0, -1));
      addMessage("assistant", answer);
    } catch (err) {
      addMessage("assistant", "ما قدرت أعمل الامتحان. حاول مرة ثانية 🔄", { isError: true });
    }
    setLoading(false);
    setExamTopic("");
  };

  const sendPrompt = async (prompt, displayText) => {
    if (loading) return;
    addMessage("user", displayText || prompt);
    setLoading(true);
    try {
      const { answer } = await callAPI(prompt, messagesRef.current.slice(0, -1));
      addMessage("assistant", answer);
    } catch (err) {
      addMessage("assistant", "صار خطأ — حاول مرة ثانية 🔄", { isError: true });
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const lastAssistantMsg = messages.length > 0 && messages[messages.length - 1].role === "assistant" && !messages[messages.length - 1].isError;

  return (
    <div className="page chat-page" role="main" aria-label="AcadAI Chat">
      <header className="header" role="banner">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">Back</button>
        <span className="app-name">{subjectCode}</span>
        <button className="header-action-btn" onClick={startNewChat} aria-label="New chat">➕</button>
        <button className="header-action-btn" onClick={() => setShowHistory(!showHistory)} aria-label="Chat history">💬</button>
        <button className="quiz-header-btn" onClick={() => setShowQuizModal(true)} disabled={loading}>Quiz</button>
        <button className="quiz-header-btn" onClick={() => setShowExamModal(true)} disabled={loading}>Exam</button>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark mode">
          {darkMode ? "☀️" : "🌙"}
        </button>
        {onLogout && <button className="header-action-btn" onClick={onLogout} aria-label="Logout" title="Logout">🚪</button>}
      </header>

      <div className="messages-container" role="log" aria-label="Chat messages" aria-live="polite">
        {messages.map((msg, idx) => {
          const rtl = isRTL(msg.content);
          return (
            <div
              key={idx}
              className={"message " + (msg.role === "user" ? "user-message" : "assistant-message") + (msg.isError ? " error-message" : "")}
              dir={rtl ? "rtl" : "ltr"}
              style={{ textAlign: rtl ? "right" : "left" }}
              role={msg.role === "assistant" ? "article" : "none"}
              aria-label={msg.role === "assistant" ? "AI response" : "Your message"}
            >
              {msg.role === "assistant" ? (<ReactMarkdown>{msg.content}</ReactMarkdown>) : (<p>{msg.content}</p>)}
              <div className="msg-footer">
                <span className="msg-time">{formatTime(msg.time)}</span>
                {msg.role === "assistant" && (
                  <>
                    {msg.isError ? (
                      <button className="msg-action-btn retry-btn" onClick={retryLastMessage} aria-label="Retry">
                        🔄 Retry
                      </button>
                    ) : (
                      <>
                        <button className="msg-action-btn" onClick={() => copyMessage(msg.content, idx)} aria-label="Copy message">
                          {copiedIdx === idx ? "✅" : "📋"}
                        </button>
                        <button className="msg-action-btn" onClick={() => downloadTxt(msg.content)} aria-label="Download as text">
                          📥 TXT
                        </button>
                        <button className="msg-action-btn" onClick={() => downloadPdf(msg.content)} aria-label="Download as PDF">
                          📄 PDF
                        </button>
                        <button className="msg-action-btn" onClick={() => regenerateMessage(idx)} aria-label="Regenerate answer">
                          🔄
                        </button>
                        <button
                          className={"msg-action-btn" + (likedMsgs[idx] === "like" ? " liked" : "")}
                          onClick={() => handleLike(idx, "like")}
                          aria-label="Like"
                        >
                          👍
                        </button>
                        <button
                          className={"msg-action-btn" + (likedMsgs[idx] === "dislike" ? " disliked" : "")}
                          onClick={() => handleLike(idx, "dislike")}
                          aria-label="Dislike"
                        >
                          👎
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="message assistant-message loading-message" role="status" aria-label="Loading">
            <div className="loading-content">
              <div className="loading-dots">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
              <span className="loading-step">{LOADING_STEPS[loadingStep]}</span>
            </div>
          </div>
        )}
        {!loading && lastAssistantMsg && (
          <div className="followups" role="group" aria-label="Quick actions">
            <button className="followup-btn" onClick={() => sendPrompt("Explain this in a simpler way", "🔽 Explain simpler")}>Simpler</button>
            <button className="followup-btn" onClick={() => sendPrompt("Give me a practical example", "💡 Example")}>Example</button>
            <button className="followup-btn" onClick={() => sendPrompt("Give me a short summary of the above in 3 bullet points", "📋 Summary")}>Summary</button>
            <button className="followup-btn" onClick={() => sendPrompt("اشرح بالعربي بالكامل", "🇸🇦 بالعربي")}>{"بالعربي"}</button>
            <button className="followup-btn" onClick={() => sendPrompt("Make a comparison table for the key concepts", "📊 Table")}>Table</button>
            <button className="followup-btn" onClick={() => sendPrompt("Convert the above into flashcards. Each card should have a Question on one side and Answer on the other. Format: **Q:** ... **A:** ...", "🃏 Flashcards")}>Flashcards</button>
            <button className="followup-btn" onClick={() => sendPrompt("Explain this at a beginner level, assume I know nothing", "🟢 Beginner")}>Beginner</button>
            <button className="followup-btn" onClick={() => sendPrompt("Explain this at an advanced academic level with technical terminology", "🔴 Advanced")}>Advanced</button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {(attachedImage || attachedFile) && (
        <div className="attachment-preview" role="status" aria-label="File attached">
          {imagePreview && <img src={imagePreview} alt="Attached preview" className="img-preview" />}
          {attachedFile && <span className="file-name">{attachedFile.name}</span>}
          <button className="remove-attach" onClick={clearAttachments} aria-label="Remove attachment">✕</button>
        </div>
      )}

      <div className="input-area" role="form" aria-label="Message input">
        <input type="file" accept="image/*" ref={imageInputRef} style={{ display: "none" }} onChange={handleImageSelect} aria-hidden="true" />
        <input type="file" accept=".pdf,.docx,.txt,.pptx,.xlsx,.csv" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileSelect} aria-hidden="true" />
        <button className="attach-btn" title="Attach image" onClick={() => imageInputRef.current?.click()} aria-label="Attach image">🖼️</button>
        <button className="attach-btn" title="Attach file" onClick={() => fileInputRef.current?.click()} aria-label="Attach file">📎</button>
        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder="اسأل عن المادة... Ask about your course..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          dir={isRTL(input) ? "rtl" : "ltr"}
          aria-label="Type your message"
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={loading || (!input.trim() && !attachedImage && !attachedFile)}
          aria-label="Send message"
        >
          {loading ? "⏳" : "➤"}
        </button>
      </div>

      {showHistory && (
        <div className="history-sidebar">
          <div className="history-header">
            <h3>💬 المحادثات السابقة</h3>
            <button className="history-close" onClick={() => setShowHistory(false)}>✕</button>
          </div>
          <div className="history-list">
            {savedChats.length === 0 && <p className="history-empty">لا توجد محادثات محفوظة</p>}
            {savedChats.map(chat => (
              <div key={chat.id} className="history-item">
                <button className="history-item-btn" onClick={() => loadChat(chat)}>
                  <span className="history-title">{chat.title}</span>
                  <span className="history-time">{new Date(chat.time).toLocaleDateString()}</span>
                </button>
                <button className="history-delete" onClick={() => deleteChat(chat.id)} aria-label="Delete chat">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showExamModal && (
        <div className="quiz-modal-overlay" onClick={() => setShowExamModal(false)} role="dialog" aria-modal="true">
          <div className="quiz-modal" onClick={e => e.stopPropagation()}>
            <h3>📄 Exam Generator</h3>
            <p>اختار المستوى والوحدة وحدد الموضوع</p>

            <label className="modal-label">المستوى — Difficulty</label>
            <div className="quiz-type-selector three-cols">
              {[
                { key: "easy", label: "🟢", desc: "سهل" },
                { key: "medium", label: "🟡", desc: "متوسط" },
                { key: "hard", label: "🔴", desc: "صعب" },
              ].map(d => (
                <button key={d.key} className={"quiz-type-btn" + (examDifficulty === d.key ? " active" : "")} onClick={() => setExamDifficulty(d.key)}>
                  <span className="quiz-type-icon">{d.label}</span>
                  <span className="quiz-type-desc">{d.desc}</span>
                </button>
              ))}
            </div>

            <label className="modal-label">الوحدات — Units/Chapters</label>
            <input type="text" className="quiz-topic-input" placeholder="e.g. Unit 1, 3, 5 or Phonetics, Morphology... (اتركه فاضي = الكل)" value={examUnits} onChange={e => setExamUnits(e.target.value)} />

            <label className="modal-label">موضوع محدد (اختياري)</label>
            <input type="text" className="quiz-topic-input" placeholder="e.g. Past Simple, Vowels..." value={examTopic} onChange={e => setExamTopic(e.target.value)} onKeyDown={e => { if (e.key === "Enter") generateExam(); }} />
            <div className="quiz-modal-actions">
              <button className="quiz-modal-btn primary" onClick={generateExam}>📄 Generate Exam</button>
              <button className="quiz-modal-btn cancel" onClick={() => setShowExamModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showQuizModal && (
        <div className="quiz-modal-overlay" onClick={() => setShowQuizModal(false)} role="dialog" aria-modal="true" aria-label="Quiz options">
          <div className="quiz-modal" onClick={e => e.stopPropagation()}>
            <h3>📝 Quiz Generator</h3>
            <p>اختار نوع الأسئلة والموضوع</p>
            <div className="quiz-type-selector">
              {[
                { key: "mix", label: "🎯 Mix", desc: "ميكس" },
                { key: "mcq", label: "⭕ MCQ", desc: "ضع دائرة" },
                { key: "fillblank", label: "✏️ Fill", desc: "املأ الفراغ" },
                { key: "short", label: "📝 Short", desc: "أسئلة قصيرة" },
              ].map(t => (
                <button
                  key={t.key}
                  className={"quiz-type-btn" + (quizType === t.key ? " active" : "")}
                  onClick={() => setQuizType(t.key)}
                >
                  <span className="quiz-type-icon">{t.label}</span>
                  <span className="quiz-type-desc">{t.desc}</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              className="quiz-topic-input"
              placeholder="الموضوع (اختياري) — e.g. Past Simple, Morphology..."
              value={quizTopic}
              onChange={e => setQuizTopic(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") generateQuiz(quizTopic, quizType); }}
              autoFocus
              aria-label="Quiz topic"
            />
            <div className="quiz-modal-actions">
              <button className="quiz-modal-btn primary" onClick={() => generateQuiz(quizTopic, quizType)}>
                🎯 Generate
              </button>
              <button className="quiz-modal-btn secondary" onClick={() => generateQuiz("", quizType)}>
                🎲 Random
              </button>
              <button className="quiz-modal-btn cancel" onClick={() => setShowQuizModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
