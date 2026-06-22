import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SUBJECTS_BY_YEAR } from '../data';

function SubjectsPage() {
  const navigate = useNavigate();
  const { yearId } = useParams();
  const subjects = SUBJECTS_BY_YEAR[yearId] || [];

  return (
    <>
      <button className="back-btn" onClick={() => navigate('/years')} aria-label="رجوع لصفحة السنوات">
        رجوع
      </button>
      <h1 className="page-title">Year {yearId}</h1>
      <p className="page-subtitle">اختر المادة</p>

      <div className="cards-grid">
        {subjects.length === 0 && (
          <p className="page-subtitle">لا توجد مواد متاحة لهذه السنة حالياً</p>
        )}
        {subjects.map((s) => (
          <button
            key={s.code}
            className="option-card"
            onClick={() => navigate(`/chat/${s.code}`)}
            aria-label={`فتح محادثة مادة ${s.name}`}
          >
            {s.name}
          </button>
        ))}
      </div>
    </>
  );
}

export default SubjectsPage;