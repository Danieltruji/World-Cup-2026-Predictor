import React from 'react';
import './stylesheets/home.css'; // relative to Welcome.js

export default function Welcome() {
  return (
    <div className="hero-container">
      <div className="hero-content">
        <h2 className="hero-title">Predict the World Cup 2026 Champion🏆</h2>
        <p className="hero-subtext">
          Explore team histories, simulate tournament outcomes, and see who might win the next FIFA World Cup.
        </p>
        <button className="hero-button">Explore Teams</button>
      </div>
    </div>
  );
}