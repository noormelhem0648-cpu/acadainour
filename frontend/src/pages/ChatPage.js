import React, { useState, useRef, useEffect, useCallback, useId } from "react";
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
  a.download = "Noura AI-answer.txt";
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
    <html><head><meta charset="utf-8"><title>Noura AI Answer</title>
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
  const [blocked, setBlocked] = useState(null); // null=loading, false=ok, string=reason

  useEffect(() => {
    fetch(`${API_URL}/restrictions/check/${subjectCode}`)
      .then(r => r.json())
      .then(d => setBlocked(d.blocked ? (d.reason || "كويز أو امتحان") : false))
      .catch(() => setBlocked(false));
  }, [subjectCode]);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "أهلاً! أنا **Noura AI** — مساعدك الأكاديمي لمادة **" + subjectCode + "** 🎓\nاسألني أي سؤال عن المادة وراح أجاوبك من الكتاب أولاً.\n\nHi! I'm **Noura AI** — your study buddy for **" + subjectCode + "**. Ask me anything!",
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
  const [quizLevel, setQuizLevel] = useState("medium");
  const [examTopic, setExamTopic] = useState("");
  const [examDifficulty, setExamDifficulty] = useState("medium");
  const [examType, setExamType] = useState("mix");
  const [likedMsgs, setLikedMsgs] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [showHistory, setShowHistory] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyStatus, setKeyStatus] = useState(null);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/keys/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setHasKey(d.has_key)).catch(() => {});
  }, [token]);
  const [savedChats, setSavedChats] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesRef = useRef(messages);
  const loadingInterval = useRef(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (openDropdown === null) return;
    const close = (e) => {
      if (!e.target.closest(".msg-dropdown-wrap")) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openDropdown]);

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
      content: "أهلاً! أنا **Noura AI** — مساعدك الأكاديمي لمادة **" + subjectCode + "** 🎓\nاسألني أي سؤال عن المادة وراح أجاوبك من الكتاب أولاً.\n\nHi! I'm **Noura AI** — your study buddy for **" + subjectCode + "**. Ask me anything!",
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

  const submitKey = async () => {
    if (!keyInput.trim()) return;
    setKeyStatus("loading");
    try {
      const res = await fetch(`${API_URL}/keys/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ api_key: keyInput.trim() }),
      });
      const d = await res.json();
      if (res.ok) { setKeyStatus("success"); setHasKey(true); setKeyInput(""); }
      else setKeyStatus(d.detail || "خطأ");
    } catch { setKeyStatus("خطأ بالاتصال"); }
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
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(API_URL + "/ask", {
          method: "POST",
          headers,
          body: JSON.stringify({ subject_code: subjectCode, message: userMessage, history, conversation_id: convoId || null }),
        });
        if (res.status === 401) { handleAuthExpired(); throw new Error("auth expired"); }
        if (res.status === 404 && attempt < 2) {
          await new Promise(r => setTimeout(r, 800));
          continue;
        }
        const data = await res.json();
        return { answer: data.answer || data.detail || "No response received.", conversation_id: data.conversation_id };
      } catch (err) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 500)); continue; }
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

  // Append text to the last assistant message (for streaming)
  const appendToLast = (text) => {
    setMessages(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last && last.role === "assistant") {
        updated[updated.length - 1] = { ...last, content: last.content + text };
      }
      messagesRef.current = updated;
      return updated;
    });
  };

  // If the token is invalid/expired, log the user out to re-authenticate.
  const handleAuthExpired = () => {
    localStorage.removeItem("acadai_token");
    localStorage.removeItem("acadai_user");
    alert("انتهت جلستك — سجّل دخول من جديد 🔑\nYour session expired — please log in again.");
    if (onLogout) onLogout();
    else window.location.reload();
  };

  // Stream a response token-by-token. Returns conversation_id.
  const streamAPI = async (userMessage, msgHistory, convoId, onChunk) => {
    const history = msgHistory.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      content: m.content,
    }));
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(API_URL + "/ask/stream", {
      method: "POST",
      headers,
      body: JSON.stringify({ subject_code: subjectCode, message: userMessage, history, conversation_id: convoId || null }),
    });
    if (res.status === 401) { handleAuthExpired(); throw new Error("auth expired"); }
    if (!res.ok || !res.body) throw new Error("stream failed");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let convId = convoId;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        try {
          const data = JSON.parse(trimmed.slice(5).trim());
          if (data.type === "meta") convId = data.conversation_id;
          else if (data.type === "chunk") onChunk(data.text);
        } catch {}
      }
    }
    return convId;
  };

  // Add an empty assistant message and stream the answer into it.
  const streamInto = async (userMessage, historyMsgs, errorText = "صار خطأ — حاول مرة ثانية 🔄") => {
    addMessage("assistant", "");
    try {
      await streamAPI(userMessage, historyMsgs, null, (chunk) => appendToLast(chunk));
    } catch (err) {
      if (err && err.message === "auth expired") return;  // already logging out
      try {
        const result = await callAPI(userMessage, historyMsgs);
        appendToLast(result.answer);
      } catch {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: errorText, time: Date.now(), isError: true };
          messagesRef.current = updated;
          return updated;
        });
      }
    }
  };

  const sendMessage = async () => {
    if (loading) return;
    if (!input.trim() && !attachedImage && !attachedFile) return;
    const userMessage = input.trim() || (attachedImage ? "Image attached" : "File attached");
    addMessage("user", userMessage);
    setInput("");
    setLoading(true);

    const currentMsgs = messagesRef.current;
    const historyMsgs = currentMsgs.slice(0, -1);

    if (attachedImage || attachedFile) {
      // Files use the non-streaming endpoint
      try {
        const formData = new FormData();
        formData.append("subject_code", subjectCode);
        formData.append("message", userMessage);
        formData.append("history", JSON.stringify(historyMsgs.map(m => ({ role: m.role === "assistant" ? "model" : "user", content: m.content }))));
        if (attachedImage) formData.append("file", attachedImage);
        else if (attachedFile) formData.append("file", attachedFile);
        const res = await fetch(API_URL + "/upload-and-ask", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        const data = await res.json();
        addMessage("assistant", data.answer || data.detail || "No response.");
        clearAttachments();
      } catch (err) {
        addMessage("assistant", "عذراً، حصل خطأ بالاتصال. حاول مرة ثانية. 🔄", { isError: true });
      }
      setLoading(false);
      return;
    }

    // Text message → stream the response
    await streamInto(userMessage, historyMsgs, "عذراً، حصل خطأ بالاتصال. حاول مرة ثانية. 🔄");
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
    await streamInto(userMessage, historyBefore, "عذراً، حصل خطأ. حاول مرة ثانية. 🔄");
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
    await streamInto(userMessage, historyBefore, "عذراً، حصل خطأ بالاتصال. حاول مرة ثانية. 🔄");
    setLoading(false);
  };

  const LEVELS = {
    easy: "Easy (سهل) — basic recall, simple vocabulary.",
    medium: "Medium (متوسط) — university level, understanding & application.",
    hard: "Hard (صعب) — challenging, analysis & critical thinking.",
  };
  const TYPE_INSTR = {
    mix: "a MIX of multiple choice, True/False, fill-in-the-blank and short answer.",
    mcq: "multiple choice questions only, 4 options (a,b,c,d) each.",
    fillblank: "fill-in-the-blank questions only (one _____ blank per sentence).",
    short: "short answer questions only (1-3 sentence answers).",
    truefalse: "True/False questions only.",
  };
  const TYPE_LABEL = { mix: "Mix", mcq: "MCQ", fillblank: "Fill Blank", short: "Short Answer", truefalse: "True/False" };

  const generateQuiz = async (topic, type) => {
    if (loading) return;
    setShowQuizModal(false);
    const topicText = topic ? ` on the topic: "${topic}"` : " covering the subject";
    const quizPrompt = `Generate a practice QUIZ${topicText} for subject ${subjectCode}.
Level: ${LEVELS[quizLevel]}
Question type: ${TYPE_INSTR[type || "mix"]}
Make 6-8 questions. Number each one. Put all correct answers at the end under "## Answers".`;
    addMessage("user", `📝 Quiz — ${TYPE_LABEL[type || "mix"]} · ${quizLevel}${topic ? " · " + topic : ""}`);
    setLoading(true);
    await streamInto(quizPrompt, messagesRef.current.slice(0, -1), "ما قدرت أعمل الكويز. حاول مرة ثانية 🔄");
    setLoading(false);
    setQuizTopic("");
  };

  const generateExam = async () => {
    if (loading) return;
    setShowExamModal(false);
    const topicText = examTopic.trim() ? ` on the topic: "${examTopic.trim()}"` : " covering the subject";
    const examPrompt = `IMPORTANT: This is a practice exam generation request. Generate the FULL exam WITH all answers.

Generate a FULL PRACTICE EXAM${topicText} for subject ${subjectCode}.
Level: ${LEVELS[examDifficulty]}
Question type: ${TYPE_INSTR[examType]}

Make it a proper exam (about 15-18 questions, grouped into clear sections with marks).
At the very end add: ## Answer Key — with all correct answers.
Use the mixed Arabic+English style.`;
    addMessage("user", `📄 Exam — ${TYPE_LABEL[examType]} · ${examDifficulty}${examTopic.trim() ? " · " + examTopic.trim() : ""}`);
    setLoading(true);
    await streamInto(examPrompt, messagesRef.current.slice(0, -1), "ما قدرت أعمل الامتحان. حاول مرة ثانية 🔄");
    setLoading(false);
    setExamTopic("");
  };

  const sendPrompt = async (prompt, displayText) => {
    if (loading) return;
    addMessage("user", displayText || prompt);
    setLoading(true);
    await streamInto(prompt, messagesRef.current.slice(0, -1), "صار خطأ — حاول مرة ثانية 🔄");
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const lastAssistantMsg = messages.length > 0 && messages[messages.length - 1].role === "assistant" && !messages[messages.length - 1].isError;

  if (blocked === null) return (
    <div className="page chat-page" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:"var(--text-muted)"}}>جاري التحقق...</div>
    </div>
  );

  if (blocked !== false) return (
    <div className="page chat-page" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,textAlign:"center",padding:32}}>
      <div style={{fontSize:"3rem"}}>🔒</div>
      <h2 style={{margin:0,color:"var(--text)"}}>هاي المادة محجوبة حالياً</h2>
      <p style={{color:"var(--text-muted)",margin:0,maxWidth:340}}>
        📋 السبب: <strong>{blocked}</strong><br/><br/>
        الدكتور أوقف استخدام Noura AI لهاي المادة مؤقتاً. راجعه للمزيد.
      </p>
      <button className="back-btn" style={{marginTop:8}} onClick={() => navigate(-1)}>← رجوع</button>
    </div>
  );

  return (
    <div className="page chat-page" role="main" aria-label="Noura AI Chat">
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
        {token && (
          <button
            className={"header-action-btn key-btn" + (hasKey ? " key-active" : "")}
            onClick={() => setShowKeyModal(true)}
            title={hasKey ? "مفتاحك مضاف ✓" : "أضف مفتاح Gemini"}
          >🔑</button>
        )}
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
              {msg.role === "assistant"
                ? (msg.content
                    ? <ReactMarkdown>{msg.content}</ReactMarkdown>
                    : <div className="loading-dots"><span className="dot" /><span className="dot" /><span className="dot" /></div>)
                : (<p>{msg.content}</p>)}
              {!(msg.role === "assistant" && !msg.content) && (
              <div className="msg-footer">
                <span className="msg-time">{formatTime(msg.time)}</span>
                {msg.role === "assistant" && (
                  msg.isError ? (
                    <button className="msg-icon-btn retry-btn" onClick={retryLastMessage} aria-label="Retry">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                      Retry
                    </button>
                  ) : (
                    <div className="msg-dropdown-wrap">
                      <button
                        className="msg-dots-btn"
                        onClick={(e) => {
                          if (openDropdown === idx) { setOpenDropdown(null); return; }
                          const rect = e.currentTarget.getBoundingClientRect();
                          const dropW = 220;
                          let left = rect.left;
                          if (left + dropW > window.innerWidth - 8) left = window.innerWidth - dropW - 8;
                          if (left < 8) left = 8;
                          const top = rect.top - 8;
                          setDropdownPos({ top, left });
                          setOpenDropdown(idx);
                        }}
                        aria-label="Message options"
                      >
                        <span /><span /><span />
                      </button>
                      {openDropdown === idx && (
                        <div className="msg-dropdown" style={{ top: dropdownPos.top, left: dropdownPos.left, transform: "translateY(-100%)" }}>
                          {/* ── Actions ── */}
                          <div className="dd-section-label">Actions</div>
                          <div className="msg-dropdown-section">
                            <button className="dd-item" onClick={() => { copyMessage(msg.content, idx); setOpenDropdown(null); }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                              {copiedIdx === idx ? "Copied ✓" : "Copy"}
                            </button>
                            <button className="dd-item" onClick={() => { regenerateMessage(idx); setOpenDropdown(null); }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                              Regenerate
                            </button>
                            <button className="dd-item" onClick={() => { handleLike(idx, "like"); setOpenDropdown(null); }}>
                              <svg viewBox="0 0 24 24" fill={likedMsgs[idx]==="like"?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                              Good response
                            </button>
                            <button className="dd-item" onClick={() => { handleLike(idx, "dislike"); setOpenDropdown(null); }}>
                              <svg viewBox="0 0 24 24" fill={likedMsgs[idx]==="dislike"?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                              Bad response
                            </button>
                            <button className="dd-item" onClick={() => { downloadTxt(msg.content); setOpenDropdown(null); }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              Download TXT
                            </button>
                            <button className="dd-item" onClick={() => { downloadPdf(msg.content); setOpenDropdown(null); }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                              Download PDF
                            </button>
                          </div>

                          {/* ── Follow-ups grid ── */}
                          <div className="dd-divider" />
                          <div className="dd-section-label">اشرح لي بطريقة ثانية</div>
                          <div className="dd-followup-grid">
                            {[
                              ["🔽 أبسط", "اشرح نفس الموضوع من ردك السابق بطريقة أبسط وأوضح، كأنك تشرح لشخص ما يعرف شي.", "🔽 أبسط"],
                              ["💡 مثال", "أعطني مثالاً عملياً على ما شرحته في ردك السابق.", "💡 مثال عملي"],
                              ["📋 ملخص", "لخّص ردك السابق في 3 نقاط رئيسية فقط.", "📋 ملخص"],
                              ["🇸🇦 عربي", "اشرح نفس موضوع ردك السابق بالعربي الفصيح بالكامل.", "🇸🇦 بالعربي"],
                              ["📊 جدول", "حوّل المعلومات من ردك السابق إلى جدول مقارنة Markdown.", "📊 جدول"],
                              ["🃏 Flashcards", "حوّل ردك السابق إلى flashcards للمراجعة. كل بطاقة: **Q:** ... **A:** ...", "🃏 Flashcards"],
                              ["🟢 مبتدئ", "اشرح نفس موضوع ردك السابق لمستوى مبتدئ تماماً، افترض إني ما أعرف شي عنه.", "🟢 مستوى مبتدئ"],
                              ["🔴 متقدم", "اشرح نفس موضوع ردك السابق بمستوى أكاديمي متقدم مع المصطلحات التقنية.", "🔴 مستوى متقدم"],
                            ].map(([label, prompt, display]) => (
                              <button key={label} className="dd-followup-pill" onClick={() => { sendPrompt(prompt, display); setOpenDropdown(null); }}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
              )}
            </div>
          );
        })}
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
          maxLength={4000}
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
            <p>اكتب الموضوع، واختار المستوى والنوع</p>

            <label className="modal-label">الموضوع — Topic (اتركه فاضي = كل المادة)</label>
            <input type="text" className="quiz-topic-input" placeholder="مثال: Past Simple, Paragraph Writing..." value={examTopic} onChange={e => setExamTopic(e.target.value)} onKeyDown={e => { if (e.key === "Enter") generateExam(); }} />

            <label className="modal-label">المستوى — Level</label>
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

            <label className="modal-label">النوع — Type</label>
            <div className="quiz-type-selector">
              {[
                { key: "mix", label: "🎯 Mix", desc: "ميكس" },
                { key: "mcq", label: "⭕ MCQ", desc: "ضع دائرة" },
                { key: "truefalse", label: "✔️ T/F", desc: "صح وخطأ" },
                { key: "fillblank", label: "✏️ Fill", desc: "املأ الفراغ" },
                { key: "short", label: "📝 Short", desc: "أسئلة قصيرة" },
              ].map(t => (
                <button key={t.key} className={"quiz-type-btn" + (examType === t.key ? " active" : "")} onClick={() => setExamType(t.key)}>
                  <span className="quiz-type-icon">{t.label}</span>
                  <span className="quiz-type-desc">{t.desc}</span>
                </button>
              ))}
            </div>

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
            <p>اكتب الموضوع، واختار المستوى والنوع</p>

            <label className="modal-label">الموضوع — Topic (اختياري)</label>
            <input
              type="text"
              className="quiz-topic-input"
              placeholder="مثال: Past Simple, Morphology..."
              value={quizTopic}
              onChange={e => setQuizTopic(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") generateQuiz(quizTopic, quizType); }}
              autoFocus
              aria-label="Quiz topic"
            />

            <label className="modal-label">المستوى — Level</label>
            <div className="quiz-type-selector three-cols">
              {[
                { key: "easy", label: "🟢", desc: "سهل" },
                { key: "medium", label: "🟡", desc: "متوسط" },
                { key: "hard", label: "🔴", desc: "صعب" },
              ].map(d => (
                <button key={d.key} className={"quiz-type-btn" + (quizLevel === d.key ? " active" : "")} onClick={() => setQuizLevel(d.key)}>
                  <span className="quiz-type-icon">{d.label}</span>
                  <span className="quiz-type-desc">{d.desc}</span>
                </button>
              ))}
            </div>

            <label className="modal-label">النوع — Type</label>
            <div className="quiz-type-selector">
              {[
                { key: "mix", label: "🎯 Mix", desc: "ميكس" },
                { key: "mcq", label: "⭕ MCQ", desc: "ضع دائرة" },
                { key: "truefalse", label: "✔️ T/F", desc: "صح وخطأ" },
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

      {showKeyModal && (
        <div className="quiz-modal-overlay" onClick={() => { setShowKeyModal(false); setKeyStatus(null); }} role="dialog" aria-modal="true">
          <div className="quiz-modal" onClick={e => e.stopPropagation()}>
            <h3>🔑 أضف مفتاح Gemini</h3>
            <p style={{fontSize:"0.83rem",color:"var(--text-muted)",margin:"4px 0 16px"}}>
              مفتاحك يُضاف لقاعدة البيانات ويُستخدم لتوسيع طاقة السيرفر للجميع.
              احصل على مفتاح مجاني من <strong>aistudio.google.com</strong>
            </p>
            {hasKey ? (
              <div style={{textAlign:"center",padding:"12px 0"}}>
                <div style={{fontSize:"2rem",marginBottom:8}}>✅</div>
                <p style={{color:"var(--text-muted)",fontSize:"0.85rem"}}>مفتاحك مضاف — شكراً على دعم السيرفر! 🎉</p>
                <button className="quiz-modal-btn cancel" style={{marginTop:12}} onClick={() => setShowKeyModal(false)}>إغلاق</button>
              </div>
            ) : (
              <>
                <input
                  className="quiz-topic-input"
                  placeholder="AIzaSy..."
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitKey()}
                  autoFocus
                  style={{fontFamily:"monospace",fontSize:"0.85rem"}}
                />
                {keyStatus && keyStatus !== "loading" && (
                  <div style={{
                    marginTop:10, padding:"8px 12px", borderRadius:8, fontSize:"0.83rem",
                    background: keyStatus === "success" ? "#e8f5e9" : "#fdecea",
                    color: keyStatus === "success" ? "#2e7d32" : "#c62828"
                  }}>
                    {keyStatus === "success" ? "✅ تم إضافة مفتاحك بنجاح!" : keyStatus}
                  </div>
                )}
                <div className="quiz-modal-actions">
                  <button className="quiz-modal-btn primary" onClick={submitKey} disabled={keyStatus === "loading" || !keyInput.trim()}>
                    {keyStatus === "loading" ? "جاري..." : "✅ إضافة"}
                  </button>
                  <button className="quiz-modal-btn cancel" onClick={() => { setShowKeyModal(false); setKeyStatus(null); }}>إلغاء</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
