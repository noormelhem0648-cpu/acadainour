import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import YearsPage from './pages/YearsPage';
import SubjectsPage from './pages/SubjectsPage';
import ChatPage from './pages/ChatPage';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('acadai-theme') === 'dark';
  });

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : 'light';
    localStorage.setItem('acadai-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(prev => !prev);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="top-header">
          <span className="brand" lang="en">Smart Student Assistant N</span>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={darkMode ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
          >
            {darkMode ? '☼' : '☾'}
          </button>
        </header>

        <main className="page-area">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/years" element={<YearsPage />} />
            <Route path="/year/:yearId" element={<SubjectsPage />} />
            <Route path="/chat/:subjectCode" element={<ChatPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;