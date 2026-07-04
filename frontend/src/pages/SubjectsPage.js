import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SUBJECTS } from "../data";

export default function SubjectsPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const { year } = useParams();
  const subjects = SUBJECTS[parseInt(year)] || [];

  return (
    <div className="page">
      <header className="header">
        <button className="back-btn" onClick={() => navigate("/years")}>Back</button>
        <span className="app-name">Noura AI</span>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Light" : "Dark"}
        </button>
      </header>

      <main className="main-content">
        <div className="page-title">
          <h2>Year {year} - Subjects</h2>
          <p>Select a subject to start studying</p>
        </div>

        <div className="card-grid">
          {subjects.map((subject) => (
            <button
              key={subject.code}
              className="subject-card"
              onClick={() => navigate("/chat/" + subject.code)}
            >
              <div className="subject-code">{subject.name}</div>
              <span className="card-arrow">Start Chat</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}