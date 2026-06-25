import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function DeptPage() {
  const { yearId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-10">
      <div className="text-center max-w-xl mb-12">
        <h2 className="text-2xl font-bold mb-3">اختر التخصص / القسم الدراسي</h2>
        <p className="text-sm text-gray-400">تابع للسنة الدراسية المحددة: المستوى {yearId}</p>
      </div>

      <div className="w-full max-w-md px-4">
        {/* بطاقة القسم المخصص للمشروع */}
        <button
          onClick={() => navigate(`/year/${yearId}/dept/ael`)}
          className="w-full text-right p-6 bg-white dark:bg-neutral-900 border border-gray-250 dark:border-neutral-800 rounded-2xl shadow-sm hover:border-[#E1989A] transition-all group flex justify-between items-center"
        >
          <div>
            <h3 className="text-lg font-bold group-hover:text-[#E1989A] transition-colors">
              Applied English Language (AEL)
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              اللغة الإنجليزية التطبيقية والمساقات المعتمدة لها.
            </p>
          </div>
          <span className="text-xl text-[#E1989A] group-hover:translate-x-[-4px] transition-transform">←</span>
        </button>
      </div>
    </div>
  );
}

export default DeptPage;