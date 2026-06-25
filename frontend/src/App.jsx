import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SubjectsPage from './pages/SubjectsPage';
// استدعي بقية الصفحات هنا إذا كانت موجودة (مثل DeptPage أو ChatPage)

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F6F1E9] text-[#1F1F1F]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          {/* أضيفي بقية المسارات هنا بنفس الطريقة */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;