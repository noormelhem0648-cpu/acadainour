import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage({ darkMode, setDarkMode, user, onLogout }) {
  const navigate = useNavigate();

  if (user?.role === "instructor") {
    navigate("/instructor", { replace: true });
    return null;
  }

  return (
    <div className="page home-page">
      <header className="header">
        <span className="app-name">Noura AI</span>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Light" : "Dark"}
        </button>
      </header>

      <main className="main-content">
        <div className="hero">
          <h1>Your Academic AI Assistant</h1>
          <p>Powered by course materials from Yarmouk University - Applied English Language Department</p>
        </div>

        <div className="card-grid single">
          <button className="dept-card" onClick={() => navigate("/years")}>
            <div className="card-icon">[Books]</div>
            <h2>Applied English Language</h2>
            <p>14 subjects across 4 years</p>
            <span className="card-arrow">&gt;</span>
          </button>
        </div>
      </main>
    </div>
  );
}