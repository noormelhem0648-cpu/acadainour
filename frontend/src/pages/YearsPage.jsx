import React from 'react';
import { useNavigate } from 'react-router-dom';

const YEARS = [1, 2, 3, 4];

function YearsPage() {
  const navigate = useNavigate();

  return (
    <>
      <button className="back-btn" onClick={() => navigate('/')} aria-label="رجوع للصفحة الرئيسية">
        رجوع
      </button>
      <h1 className="page-title">اختر السنة الدراسية</h1>
      <p className="page-subtitle">Applied English Language</p>

      <div className="cards-grid">
        {YEARS.map((year) => (
          <button
            key={year}
            className="option-card"
            onClick={() => navigate(`/year/${year}`)}
            aria-label={`السنة ${year}`}
          >
            Year {year}
          </button>
        ))}
      </div>
    </>
  );
}

export default YearsPage;