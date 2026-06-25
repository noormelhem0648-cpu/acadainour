import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// توزيع الـ 14 مادة بناءً على السنة الدراسية بدقة
const SUBJECTS_DATA = {
  '1': ['AEL101', 'AEL103', 'AEL105', 'AEL109', 'AEL110'],
  '2': ['AEL209', 'AEL211'],
  '3': ['AEL301', 'AEL302', 'AEL307', 'AEL308', 'AEL330'],
  '4': ['AEL416', 'AEL422']
};

function SubjPage() {
  const { yearId, deptId } = useParams();
  const navigate = useNavigate();

  // جلب مواد السنة المحددة، أو مصفوفة فارغة إذا كانت السنة غير معروفة
  const availableSubjects = SUBJECTS_DATA[yearId] || [];

  return (
    <div className="flex flex-col flex-1 py-6 animate-fade-in">
      <div className="mb-8 text-right">
        <h2 className="text-2xl font-bold mb-2">المواد الدراسية المتاحة</h2>
        <p className="text-sm text-gray-400">
          المستوى {yearId} — قسم {deptId?.toUpperCase()}
        </p>
      </div>

      {availableSubjects.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          لا يوجد مواد مرفوعة لهذه السنة حالياً.
        </div>
      ) : (
        /* شبكة عرض المواد */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {availableSubjects.map((subjectCode) => (
            <button
              key={subjectCode}
              onClick={() => navigate(`/year/${yearId}/dept/${deptId}/chat/${subjectCode}`)}
              className="text-right p-5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm hover:border-[#E1989A] dark:hover:border-[#E1989A] hover:shadow-md transition-all flex flex-col justify-between h-32 group cursor-pointer"
            >
              <div>
                <span className="text-xs font-semibold text-[#E1989A] bg-pink-50 dark:bg-neutral-800/50 px-2 py-1 rounded-md">
                  مساق معتمد
                </span>
                <h3 className="text-lg font-bold mt-2 group-hover:text-[#E1989A] transition-colors⚙️">
                  {subjectCode}
                </h3>
              </div>
              <div className="text-xs text-gray-400 flex items-center justify-end gap-1 w-full">
                ابدأ الدراسة الذكية <span>←</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SubjPage;