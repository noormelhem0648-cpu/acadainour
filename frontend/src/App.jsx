import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import YearsPage from './pages/YearsPage';
import SubjectsPage from './pages/SubjectsPage';
import ChatPage from './pages/ChatPage';
import './App.css';
// تم حذف سطر import DeptPage من هنا

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/years" element={<YearsPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/subjects/:year" element={<SubjectsPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/chat/:subjectCode" element={<ChatPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;