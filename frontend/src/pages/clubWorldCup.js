import React from "react";
import { Link } from "react-router-dom";
import '../pages/stylesheets/clubWorldCup.css'

export default function ClubWorldCup() {
  return (
    <div className="club-world-cup-page">
      <h1 className="page-title">FIFA Club World Cup 2025</h1>

      <section className="section">
        <h2>Live Scores</h2>
        <p>Live updates coming soon...</p>
      </section>

      <section className="section">
        <h2>Participating Teams</h2>
        <ul className="team-list">
          <li>Manchester City (UEFA)</li>
          <li>Flamengo (CONMEBOL)</li>
          <li>Al Ahly (CAF)</li>
          <li>Seattle Sounders (CONCACAF)</li>
          {/* Add more teams later via data */}
        </ul>
      </section>

      <section className="section">
        <h2>Bracket Prediction</h2>
        <Link to="/club-world-cup/predict" className="predict-link">
          Start Predicting →
        </Link>
      </section>
    </div>
  );
}
