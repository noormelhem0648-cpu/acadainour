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

export default function ChatPage({ darkMode, setDarkMode }) {
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
  const [quizTopic, setQuizTopic] = useState("");
  const [likedMsgs, setLikedMsgs] = useState({});

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

  const callAPI = useCallback(async (userMessage, msgHistory) => {
    const history = msgHistory.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      content: m.content
    }));
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(API_URL + "/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject_code: subjectCode, message: userMessage, history }),
        });
        if (res.status === 404 && attempt === 0) {
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        const data = await res.json();
        return data.answer || data.detail || "No response received.";
      } catch (err) {
        if (attempt === 0) { await new Promise(r => setTimeout(r, 3000)); continue; }
        throw err;
      }
    }
  }, [subjectCode]);

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
        answer = await callAPI(userMessage, historyMsgs);
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
      const answer = await callAPI(userMessage, historyBefore);
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
      const answer = await callAPI(userMessage, historyBefore);
      addMessage("assistant", answer);
    } catch (err) {
      addMessage("assistant", "عذراً، حصل خطأ بالاتصال. حاول مرة ثانية. 🔄", { isError: true });
    }
    setLoading(false);
  };

  const generateQuiz = async (topic) => {
    if (loading) return;
    setShowQuizModal(false);
    const topicText = topic ? ` about "${topic}"` : "";
    const quizPrompt = `Generate a quiz with 5 mixed questions (MCQ, True/False, fill-in-the-blank)${topicText}. Number each question. Put the answers at the end.`;
    addMessage("user", `📝 Quiz${topic ? ": " + topic : ""}`);
    setLoading(true);

    try {
      const answer = await callAPI(quizPrompt, messagesRef.current.slice(0, -1));
      addMessage("assistant", answer);
    } catch (err) {
      addMessage("assistant", "ما قدرت أعمل الكويز. حاول مرة ثانية 🔄", { isError: true });
    }
    setLoading(false);
    setQuizTopic("");
  };

  const sendPrompt = async (prompt, displayText) => {
    if (loading) return;
    addMessage("user", displayText || prompt);
    setLoading(true);
    try {
      const answer = await callAPI(prompt, messagesRef.current.slice(0, -1));
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
        <button className="quiz-header-btn" onClick={() => setShowQuizModal(true)} disabled={loading} aria-label="Generate quiz">
          Quiz
        </button>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark mode">
          {darkMode ? "☀️" : "🌙"}
        </button>
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

      {showQuizModal && (
        <div className="quiz-modal-overlay" onClick={() => setShowQuizModal(false)} role="dialog" aria-modal="true" aria-label="Quiz options">
          <div className="quiz-modal" onClick={e => e.stopPropagation()}>
            <h3>📝 Quiz Generator</h3>
            <p>اكتب الموضوع اللي بدك كويز عنه — Write the topic you want</p>
            <input
              type="text"
              className="quiz-topic-input"
              placeholder="e.g. Past Simple, Morphology, Phonetics..."
              value={quizTopic}
              onChange={e => setQuizTopic(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") generateQuiz(quizTopic); }}
              autoFocus
              aria-label="Quiz topic"
            />
            <div className="quiz-modal-actions">
              <button className="quiz-modal-btn primary" onClick={() => generateQuiz(quizTopic)}>
                🎯 Generate
              </button>
              <button className="quiz-modal-btn secondary" onClick={() => generateQuiz("")}>
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
