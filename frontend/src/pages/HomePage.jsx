import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  const levels = [
    { id: '1', name: 'السنة الأولى', enName: 'First Year', desc: 'AEL 101, 103, 105, 109, 110' },
    { id: '2', name: 'السنة الثانية', enName: 'Second Year', desc: 'AEL 209, 211' },
    { id: '3', name: 'السنة الثالثة', enName: 'Third Year', desc: 'AEL 301, 302, 307, 308, 330' },
    { id: '4', name: 'السنة الرابعة', enName: 'Fourth Year', desc: 'AEL 416, 422' },
  ];

  return (
    <div className="min-h-screen bg-[#F6F1E9] font-sans flex flex-col items-center justify-center p-6 text-[#1F1F1F]">
      <div className="border border-[#A08F5A] px-4 py-1 rounded text-sm mb-8 text-[#A08F5A] font-medium tracking-wide">
        جامعة اليرموك • قسم اللغة الإنجليزية • تطبيق أكاديمية نور
      </div>

      <h1 className="text-4xl font-bold mb-2 text-center">
        مساعدك <span className="text-[#A08F5A]">الأكاديمي الذكي</span>
      </h1>
      <p className="text-gray-600 text-center max-w-md mb-12 text-sm leading-relaxed">
        اختر سنتك الدراسية للوصول إلى مواد تخصصك والتفاعل مع المساعد الذكي
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {levels.map((level) => (
          <div 
            key={level.id} 
            onClick={() => navigate(`/subjects?level=${level.id}`)} // هنا السحر! عند الضغط ينقلك لصفحة المواد مع رقم السنة
            className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:border-[#A08F5A] hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center group"
          >
            <span className="text-3xl font-serif font-bold text-[#A08F5A] mb-2 group-hover:scale-110 transition-transform">
              {level.id === '1' ? 'I' : level.id === '2' ? 'II' : level.id === '3' ? 'III' : 'IV'}
            </span>
            <h2 className="text-xl font-bold mb-1">{level.name}</h2>
            <span className="text-xs text-gray-400 font-mono mb-3 uppercase tracking-wider">{level.enName}</span>
            <p className="text-xs text-[#A08F5A] bg-[#F6F1E9] px-3 py-1 rounded-full font-medium">
              {level.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;