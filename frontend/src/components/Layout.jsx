import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const showBackButton = location.pathname !== '/';

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#121212] dark:text-gray-100 flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-[#121212]/80 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button 
                onClick={() => navigate(-1)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-600 dark:text-gray-300"
              >
                ← عودة
              </button>
            )}
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-[#E1989A] dark:from-white dark:via-gray-300 dark:to-[#E1989A] bg-clip-text text-transparent">
              Smart Student Assistant N
            </h1>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-base"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;