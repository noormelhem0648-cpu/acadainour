import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // نظام الوضع الليلي والنهاري
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || !('theme' in localStorage)
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // إخفاء زر الرجوع إذا كنا في الصفحة الرئيسية فقط
  const showBackButton = location.pathname !== '/';

  return (
    <div className="min-h-screen bg-white text-charcoal dark:bg-neutral-900 dark:text-white transition-colors duration-200 flex flex-col font-sans">
      
      {/* الهيدر العلوي المستمر في كل الصفحات */}
      <header className="border-b border-gray-200 dark:border-neutral-800 px-4 py-4 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all text-[#E1989A]"
              title="رجوع"
            >
              ←
            </button>
          )}
          <h1 className="text-xl font-bold tracking-tight">
            Smart Student Assistant <span className="text-[#E1989A]">N</span>
          </h1>
        </div>

        {/* زر التبديل بين الـ Dark/Light Mode */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg border border-gray-250 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      {/* هنا يتم عرض محتوى الصفحات المتغيرة تلقائياً بحسب الرابط */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;