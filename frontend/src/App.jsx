import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import DeptPage from './pages/DeptPage';
import SubjectsPage from './pages/SubjectsPage'; //  صحيح مئة بالمئة!
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* مسار المصادقة (خارج الهيكل العام للموقع) */}
        <Route path="/auth" element={<AuthPage />} />

        {/* المسارات الأساسية للتطبيق محتواة داخل المكون العام Layout */}
        <Route path="/" element={<Layout />}>
          {/* المستوى 1: الرئيسية واختيار السنة الدراسية */}
          <Route index element={<HomePage />} />
          
          {/* المستوى 2: اختيار التخصص / القسم */}
          <Route path="year/:yearId" element={<DeptPage />} />
          
          {/* المستوى 3: اختيار المادة الدراسية */}
          <Route path="year/:yearId/dept/:deptId" element={<SubjPage />} />
          
          {/* المستوى 4: صفحة الشات التفاعلية المخصصة للمادة */}
          <Route path="year/:yearId/dept/:deptId/chat/:subjectCode" element={<ChatPage />} />
        </Route>

        {/* إعادة توجيه أي مسار خاطئ للرئيسية */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;