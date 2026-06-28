import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import YearsPage from "./pages/YearsPage";
import SubjectsPage from "./pages/SubjectsPage";
import ChatPage from "./pages/ChatPage";
import AuthPage from "./pages/AuthPage";

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

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage {...themeProps} />} />
        <Route path="/years" element={<YearsPage {...themeProps} />} />
        <Route path="/subjects/:year" element={<SubjectsPage {...themeProps} />} />
        <Route path="/chat/:subjectCode" element={<ChatPage {...themeProps} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
