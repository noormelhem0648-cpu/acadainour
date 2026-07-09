import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import YearsPage from "./pages/YearsPage";
import SubjectsPage from "./pages/SubjectsPage";
import ChatPage from "./pages/ChatPage";
import AuthPage from "./pages/AuthPage";
import InstructorPage from "./pages/InstructorPage";
import PrivacyPage from "./pages/PrivacyPage";
import ELHomePage from "./english-learning/pages/ELHomePage";
import ELDaysPage from "./english-learning/pages/ELDaysPage";
import ELDayPage from "./english-learning/pages/ELDayPage";
import ELComponentPage from "./english-learning/pages/ELComponentPage";
import ELChatPage from "./english-learning/pages/ELChatPage";
import ELLedgerPage from "./english-learning/pages/ELLedgerPage"
import ELErrorsPage from "./english-learning/pages/ELErrorsPage";

function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("acadai_user")); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("acadai_token") || null);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLogin = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("acadai_token");
    localStorage.removeItem("acadai_user");
  };

  const themeProps = { darkMode, setDarkMode, user, token, onLogout: handleLogout };

  // Privacy page is public — accessible even when logged out
  if (typeof window !== "undefined" && window.location.pathname === "/privacy") {
    return <PrivacyPage />;
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={user?.role === "instructor" ? <Navigate to="/instructor" replace /> : <HomePage {...themeProps} />} />
        <Route path="/years" element={<YearsPage {...themeProps} />} />
        <Route path="/subjects/:year" element={<SubjectsPage {...themeProps} />} />
        <Route path="/chat/:subjectCode" element={<ChatPage {...themeProps} />} />
        <Route path="/instructor" element={user?.role === "instructor" ? <InstructorPage {...themeProps} /> : <Navigate to="/" replace />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/english-learning" element={<ELHomePage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/english-learning/level/:levelId" element={<ELDaysPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/english-learning/level/:levelId/day/:dayId" element={<ELDayPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/english-learning/level/:levelId/day/:dayId/chat" element={<ELChatPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/english-learning/level/:levelId/day/:dayId/:componentId" element={<ELComponentPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/english-learning/ledger" element={<ELLedgerPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/english-learning/errors" element={<ELErrorsPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
