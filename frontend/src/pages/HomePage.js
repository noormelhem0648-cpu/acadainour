import React from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="hero-card-wrap">
      <button
        className="hero-card"
        onClick={() => navigate('/years')}
        aria-label="الدخول إلى تخصص Applied English Language"
      >
        <h2>Applied English Language</h2>
        <p>اضغط للدخول إلى المواد الدراسية</p>
      </button>
    </div>
  );
}

export default HomePage;