import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';         // المستوى 1: السنوات الدراسية
import DeptPage from './pages/DeptPage';         // المستوى 2: تخصصات الأقسام
import SubjectsPage from './pages/SubjectsPage'; // المستوى 3: قائمة المواد والملفات
import ChatPage from './pages/ChatPage';         // المستوى 4: الشات الذكي المدعم بـ Markdown

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="departments" element={<DeptPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;