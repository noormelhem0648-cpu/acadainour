import React from "react";
import { useNavigate } from "react-router-dom";

const YEARS = [
  { num: 1, label: "Year 1", roman: "I", subjects: "AEL 101, 103, 105, 109, 110" },
  { num: 2, label: "Year 2", roman: "II", subjects: "AEL 209, 211" },
  { num: 3, label: "Year 3", roman: "III", subjects: "AEL 301, 302, 307, 308, 330" },
  { num: 4, label: "Year 4", roman: "IV", subjects: "AEL 416, 422" },
];

export default function YearsPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate();

  return (
    <div className="page">
      <header className="header">
        <button className="back-btn" onClick={() => navigate("/")}>Back</button>
        <span className="app-name">Noura AI</span>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Light" : "Dark"}
        </button>
      </header>

      <main className="main-content">
        <div className="page-title">
          <h2>Applied English Language</h2>
          <p>Select your academic year</p>
        </div>

        <div className="card-grid">
          {YEARS.map((year) => (
            <button
              key={year.num}
              className="year-card"
              onClick={() => navigate("/subjects/" + year.num)}
            >
              <span className="year-roman">{year.roman}</span>
              <h3>{year.label}</h3>
              <p>{year.subjects}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}