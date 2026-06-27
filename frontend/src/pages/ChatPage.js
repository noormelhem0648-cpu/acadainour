import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const API_URL = "https://acadai-backend-avvo.onrender.com";

function isRTL(text) {
  const rtlChars = /[֑-߿‏‫‮יִ-﷽ﹰ-ﻼ]/;
  return rtlChars.test(text);
}

function speakText(text, onEnd) {
  if (!("speechSynthesis" in window)) {
    alert("Read Aloud is not supported in this browser.");
    return;
  }
  window.speechSynthesis.cancel();

  const clean = text.replace(/[*#_`>\[\]()]/g, "");
  const rtlPattern = /[֑-߿‏‫‮יִ-﷽ﹰ-ﻼ]/;

  // Split into segments by language for better mixed-language TTS
  const segments = clean.split(/([^a-zA-Z0-9\s.,;:!?'"()-]+)/g).filter(s => s.trim());

  let i = 0;
  const speakNext = () => {
    if (i >= segments.length) {
      if (onEnd) onEnd();
      return;
    }
    const seg = segments[i++];
    const utter = new SpeechSynthesisUtterance(seg);
    utter.lang = rtlPattern.test(seg) ? "ar-SA" : "en-US";
    utter.rate = 0.95;
    utter.onend = speakNext;
    utter.onerror = speakNext;
    window.speechSynthesis.speak(utter);
  };
  speakNext();
}

function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
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

const COOLDOWN_SECONDS = 3;

export default function ChatPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const { subjectCode } = useParams();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "أهلاً! أنا **AcadAI** — مساعدك الأكاديمي لمادة **" + subjectCode + "** 🎓\nاسألني أي سؤال عن المادة وراح أجاوبك من الكتاب أولاً، وإذا ما لقيت بقلك من معرفتي العامة.\n\nHi! I'm **AcadAI** — your study buddy for **" + subjectCode + "**. Ask me anything!",
      time: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedImage, setAttachedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);
  const cooldownRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      stopSpeaking();
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const handleSpeak = (text, idx) => {
    if (speakingIdx === idx) {
      stopSpeaking();
      setSpeakingIdx(null);
      return;
    }
    stopSpeaking();
    setSpeakingIdx(idx);
    speakText(text, () => setSpeakingIdx(null));
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

  const sendMessage = async () => {
    if (cooldown > 0 || loading) return;
    if (!input.trim() && !attachedImage && !attachedFile) return;
    const userMessage = input.trim() || (attachedImage ? "Image attached" : "File attached");
    const newMessages = [...messages, { role: "user", content: userMessage, time: Date.now() }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      let answer;
      if (attachedImage || attachedFile) {
        const formData = new FormData();
        formData.append("subject_code", subjectCode);
        formData.append("message", userMessage);
        formData.append("history", JSON.stringify(messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", content: m.content }))));
        if (attachedImage) { formData.append("file", attachedImage); }
        else if (attachedFile) { formData.append("file", attachedFile); }
        const res = await fetch(API_URL + "/upload-and-ask", { method: "POST", body: formData });
        const data = await res.json();
        answer = data.answer;
      } else {
        const res = await fetch(API_URL + "/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject_code: subjectCode,
            message: userMessage,
            history: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", content: m.content })),
          }),
        });
        const data = await res.json();
        answer = data.answer;
      }
      setMessages([...newMessages, { role: "assistant", content: answer, time: Date.now() }]);
      clearAttachments();
      startCooldown();
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "عذراً، حصل خطأ بالاتصال. حاول مرة ثانية. 🔄\nSorry, connection error. Please try again.", time: Date.now() }]);
    }
    setLoading(false);
  };

  const generateQuiz = async () => {
    if (cooldown > 0 || loading) return;
    const userMessage = "Generate a quiz for me on this subject";
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
      setMessages([...newMessages, { role: "assistant", content: data.quiz, time: Date.now() }]);
      startCooldown();
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, couldn't generate the quiz. Please try again.", time: Date.now() }]);
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
        <button className="quiz-header-btn" onClick={generateQuiz} disabled={loading || cooldown > 0}>
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
                    <button className="msg-action-btn" onClick={() => copyMessage(msg.content, idx)}>
                      {copiedIdx === idx ? "Copied!" : "Copy"}
                    </button>
                    <button className="msg-action-btn" onClick={() => downloadTxt(msg.content)}>
                      Download
                    </button>
                    <button
                      className={"msg-action-btn" + (speakingIdx === idx ? " speaking-active" : "")}
                      onClick={() => handleSpeak(msg.content, idx)}
                    >
                      {speakingIdx === idx ? "Stop" : "Read"}
                    </button>
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
            <button className="followup-btn" onClick={() => quickAsk("اشرح بالعربي")}>بالعربي</button>
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
          disabled={loading || cooldown > 0 || (!input.trim() && !attachedImage && !attachedFile)}
        >
          {loading ? "..." : cooldown > 0 ? cooldown + "s" : "Send"}
        </button>
      </div>
    </div>
  );
}
