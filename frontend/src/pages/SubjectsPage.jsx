import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const SubjectsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const levelId = searchParams.get('level') || '1';

  // توزيع المواد حسب برنامجك الفعلي بدقة
  const subjectsData = {
    '1': [
      { code: 'AEL 101', name: 'قراءة واستيعاب ١' },
      { code: 'AEL 103', name: 'كتابة وإنشاء ١' },
      { code: 'AEL 105', name: 'قواعد اللغة الإنجليزية ١' },
      { code: 'AEL 109', name: 'الاستماع والمحادثة' },
      { code: 'AEL 110', name: 'مدخل إلى الأدب الإنجليزي' }
    ],
    '2': [
      { code: 'AEL 209', name: 'علم الصوتيات الفونيتكس' },
      { code: 'AEL 211', name: 'الرواية والدراما' }
    ],
    '3': [
      { code: 'AEL 301', name: 'علم اللغويات النظري' },
      { code: 'AEL 302', name: 'فن الترجمة وتطبيقاتها' },
      { code: 'AEL 307', name: 'الأدب الأمريكي عبر العصور' },
      { code: 'AEL 308', name: 'النقد الأدبي' },
      { code: 'AEL 330', name: 'كتابة التقارير الأكاديمية' }
    ],
    '4': [
      { code: 'AEL 416', name: 'علم اللغويات التطبيقي' },
      { code: 'AEL 422', name: 'ترجمة فورية متقدمة' }
    ]
  };

  const currentSubjects = subjectsData[levelId] || [];

  return (
    <div className="min-h-screen bg-[#F6F1E9] p-8 text-[#1F1F1F]">
      <button 
        onClick={() => navigate('/')} 
        className="mb-8 text-[#A08F5A] hover:underline flex items-center gap-2 font-bold"
      >
        ← العودة للرئيسية
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">مواد السنة الدراسية المختارة</h1>
        <p className="text-gray-600 mb-8 text-sm">اختر المادة التي تحتاج فيها إلى مساعدة أكاديمية لفتح الشات الذكي للدراسة:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentSubjects.map((subject) => (
            <div 
              key={subject.code}
              onClick={() => navigate(`/chat?subject=${subject.code}`)} // عند الضغط يفتح شات المساعد الذكي الخاص بالمادة
              className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm hover:border-[#A08F5A] cursor-pointer transition-all flex justify-between items-center group"
            >
              <div>
                <span className="text-xs font-mono text-[#A08F5A] font-bold block mb-1">{subject.code}</span>
                <h3 className="text-lg font-bold group-hover:text-[#A08F5A] transition-colors">{subject.name}</h3>
              </div>
              <span className="bg-[#F6F1E9] text-gray-700 text-xs px-3 py-2 rounded-lg font-medium group-hover:bg-[#A08F5A] group-hover:text-white transition-colors">
                ابدأ الدراسة ←
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubjectsPage;