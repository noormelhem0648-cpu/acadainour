import React from 'react';
import { useNavigate } from 'react-router-dom';

const YEARS = [
  { id: '1', name: 'السنة الأولى', desc: 'AEL 101, 103, 105, 109, 110' },
  { id: '2', name: 'السنة الثانية', desc: 'AEL 209, 211' },
  { id: '3', name: 'السنة الثالثة', desc: 'AEL 301, 302, 307, 308, 330' },
  { id: '4', name: 'السنة الرابعة', desc: 'AEL 416, 422' },
];

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-10 animate-fade-in">
      <div className="text-center max-w-2xl mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4">
          أهلاً بك في <span className="text-[#E1989A]">Smart Student Assistant N</span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">
          المساعد الأكاديمي الذكي المخصص لطلاب قسم اللغة الإنجليزية التطبيقية بجامعة اليرموك. اختر سنتك الدراسية للبدء.
        </p>
      </div>

      {/* شبكة البطاقات (Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl px-4">
        {YEARS.map((year) => (
          <button
            key={year.id}
            onClick={() => navigate(`/year/${year.id}`)}
            className="group flex flex-col justify-between text-right p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm hover:shadow-md hover:border-[#E1989A] dark:hover:border-[#E1989A] transition-all duration-200 cursor-pointer"
          >
            <div className="w-full">
              <span className="inline-block p-2 bg-pink-50 dark:bg-neutral-800 text-[#E1989A] rounded-xl font-bold text-xs mb-4 group-hover:bg-[#E1989A] group-hover:text-white transition-all">
                Level {year.id}
              </span>
              <h3 className="text-xl font-bold mb-2 group-hover:text-[#E1989A] transition-colors">
                {year.name}
              </h3>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {year.desc}
              </p>
            </div>
            <div className="w-full mt-6 text-[#E1989A] text-sm font-medium flex items-center justify-end gap-1 group-hover:translate-x-[-4px] transition-transform">
              عرض الأقسام <span>←</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default HomePage;