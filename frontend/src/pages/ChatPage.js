import React, { useState, useRef, useEffect } from "react";
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

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedImage, setAttachedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
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

  const callAPI = async (userMessage, msgHistory) => {
    const history = msgHistory.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      content: m.content
    }));
    const res = await fetch(API_URL + "/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject_code: subjectCode,
        message: userMessage,
        history: history,
      }),
    });
    const data = await res.json();
    return data.answer;
  };

  const sendMessage = async () => {
    if (loading) return;
    if (!input.trim() && !attachedImage && !attachedFile) return;
    const userMessage = input.trim() || (attachedImage ? "Image attached" : "File attached");
    const newMessages = [...messages, { role: "user", content: userMessage, time: Date.now() }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      let answer;
      const historyMsgs = newMessages.slice(0, -1);

      if (attachedImage || attachedFile) {
        const formData = new FormData();
        formData.append("subject_code", subjectCode);
        formData.append("message", userMessage);
        formData.append("history", JSON.stringify(historyMsgs.map(m => ({ role: m.role === "assistant" ? "model" : "user", content: m.content }))));
        if (attachedImage) { formData.append("file", attachedImage); }
        else if (attachedFile) { formData.append("file", attachedFile); }
        const res = await fetch(API_URL + "/upload-and-ask", { method: "POST", body: formData });
        const data = await res.json();
        answer = data.answer;
      } else {
        answer = await callAPI(userMessage, historyMsgs);
      }
      setMessages([...newMessages, { role: "assistant", content: answer, time: Date.now() }]);
      clearAttachments();
    } catch (err) {
      setMessages([...newMessages, {
        role: "assistant",
        content: "عذراً، حصل خطأ بالاتصال. حاول مرة ثانية. 🔄\nSorry, connection error. Please try again.",
        time: Date.now(),
        isError: true
      }]);
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

    const newMessages = [...messages.slice(0, idx + 1)];
    setMessages(newMessages);
    setLoading(true);

    try {
      const answer = await callAPI(userMessage, historyBefore);
      setMessages([...newMessages, { role: "assistant", content: answer, time: Date.now() }]);
    } catch (err) {
      setMessages([...newMessages, {
        role: "assistant",
        content: "عذراً، حصل خطأ بالاتصال. حاول مرة ثانية. 🔄\nSorry, connection error. Please try again.",
        time: Date.now(),
        isError: true
      }]);
    }
    setLoading(false);
  };

  const generateQuiz = async () => {
    if (loading) return;
    const newMessages = [...messages, { role: "user", content: "📝 Generate a quiz!", time: Date.now() }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(API_URL + "/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_code: subjectCode,
          num_questions: 5,
        }),
      });
      const data = await res.json();
      const quizContent = data.quiz || data.detail || "Could not generate quiz. Try again.";
      setMessages([...newMessages, { role: "assistant", content: quizContent, time: Date.now() }]);
    } catch (err) {
      setMessages([...newMessages, {
        role: "assistant",
        content: "ما قدرت أعمل الكويز. حاول مرة ثانية 🔄\nCouldn't generate the quiz. Please try again.",
        time: Date.now(),
        isError: true
      }]);
    }
    setLoading(false);
  };

  const quickAsk = (text) => {
    setInput(text);
    setTimeout(() => sendMessage(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="page chat-page">
      <header className="header">
        <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
        <span className="app-name">{subjectCode}</span>
        <button className="quiz-header-btn" onClick={generateQuiz} disabled={loading}>
          Quiz
        </button>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Light" : "Dark"}
        </button>
      </header>

      <div className="messages-container">
        {messages.map((msg, idx) => {
          const rtl = isRTL(msg.content);
          return (
            <div
              key={idx}
              className={"message " + (msg.role === "user" ? "user-message" : "assistant-message")}
              dir={rtl ? "rtl" : "ltr"}
              style={{ textAlign: rtl ? "right" : "left" }}
            >
              {msg.role === "assistant" ? (<ReactMarkdown>{msg.content}</ReactMarkdown>) : (<p>{msg.content}</p>)}
              <div className="msg-footer">
                <span className="msg-time">{formatTime(msg.time)}</span>
                {msg.role === "assistant" && (
                  <>
                    {msg.isError ? (
                      <button className="msg-action-btn retry-btn" onClick={retryLastMessage}>
                        Retry
                      </button>
                    ) : (
                      <>
                        <button className="msg-action-btn" onClick={() => copyMessage(msg.content, idx)}>
                          {copiedIdx === idx ? "Copied!" : "Copy"}
                        </button>
                        <button className="msg-action-btn" onClick={() => downloadTxt(msg.content)}>
                          Download
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
          <div className="message assistant-message loading-message">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        )}
        {!loading && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
          <div className="followups">
            <button className="followup-btn" onClick={() => quickAsk("Explain this in a simpler way")}>Explain simpler</button>
            <button className="followup-btn" onClick={() => quickAsk("Give me an example")}>Give example</button>
            <button className="followup-btn" onClick={() => quickAsk("Summarize this")}>Summarize</button>
            <button className="followup-btn" onClick={() => quickAsk("اشرح بالعربي")}>{"بالعربي"}</button>
            <button className="followup-btn" onClick={() => quickAsk("Make a table comparing the key concepts")}>Table</button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {(attachedImage || attachedFile) && (
        <div className="attachment-preview">
          {imagePreview && <img src={imagePreview} alt="preview" className="img-preview" />}
          {attachedFile && <span className="file-name">{attachedFile.name}</span>}
          <button className="remove-attach" onClick={clearAttachments}>X</button>
        </div>
      )}

      <div className="input-area">
        <input type="file" accept="image/*" ref={imageInputRef} style={{ display: "none" }} onChange={handleImageSelect} />
        <input type="file" accept=".pdf,.docx,.txt,.pptx,.xlsx,.csv" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileSelect} />
        <button className="attach-btn" title="Attach image" onClick={() => imageInputRef.current?.click()}>IMG</button>
        <button className="attach-btn" title="Attach file" onClick={() => fileInputRef.current?.click()}>FILE</button>
        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder="Ask about your course material..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          dir={isRTL(input) ? "rtl" : "ltr"}
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={loading || (!input.trim() && !attachedImage && !attachedFile)}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
