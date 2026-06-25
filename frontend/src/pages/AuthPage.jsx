import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // مؤقتاً: سنقوم بالتوجيه للرئيسية عند الضغط على الزر لحين ربط الـ API بالـ Backend
    console.log({ email, password, mode: isLogin ? 'login' : 'register' });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-8 shadow-sm">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Smart Student Assistant <span className="text-[#E1989A]">N</span>
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {isLogin ? 'تسجيل الدخول لمتابعة دراستك' : 'إنشاء حساب أكاديمي جديد'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">البريد الإلكتروني للجامعة</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@yu.edu.jo"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-[#E1989A] transition-all text-sm text-left"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-[#E1989A] transition-all text-sm text-left"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#E1989A] hover:bg-[#d4a5a5] text-white font-medium rounded-xl transition-all shadow-sm text-sm mt-2"
          >
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-[#E1989A] hover:underline"
          >
            {isLogin ? 'لا تملك حساباً؟ سجل الآن' : 'تملك حساباً بالفعل؟ سجل دخولك'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default AuthPage;