import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './stylesheets/worldcup2026.css';


export default function WorldCup2026() {
  const [currentStat, setCurrentStat] = useState(0);
  const [countdown, setCountdown]= useState({
    days:0,
    hours:0,
    mintues:0,
    seconds:0,
  });

  const stats = [
    { number: "48", label: "Teams" },
    { number: "104", label: "Matches" },
    { number: "16", label: "Cities" },
    { number: "3", label: "Countries" }
  ];

  const worldCupStart = new Date('2026-06-11T00:00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 2000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = worldCupStart.getTime() - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown(); // Initial call
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="worldcup2026-page">
      <div className="header-section">
        <div className="tournament-badge">FIFA WORLD CUP 2026</div>
        <div className="host-countries">USA • CANADA • MEXICO</div>
        <p className="subtitle">The biggest World Cup ever is coming. Collect the memories, and see who will possibly win.</p>
        
        {/* Animated Stats */}
        <div className="stats-carousel">
          <div className="stat-display">
            <span className="stat-number">{stats[currentStat].number}</span>
            <span className="stats-label">{stats[currentStat].label}</span>
          </div>
        </div>

        <div className="button-section">
          <Link to="/open-packs" className="open-packs-button">
            <span className="button-text">Open Player Packs</span>
            <span className="button-icon">🎴</span>
          </Link>
          <Link to="/world-cup-2026/predict" className="view-tournament-button">
            View Tournament
          </Link>
        </div>
         
                {/* Countdown Section */}
        <div className="countdown-section">
          <h3 className="countdown-title">Tournament Begins In</h3>
          <div className="countdown-display">
            <div className="countdown-unit">
              <span className="countdown-number">{countdown.days}</span>
              <span className="countdown-label">Days</span>
            </div>
            <div className="countdown-separator">:</div>
            <div className="countdown-unit">
              <span className="countdown-number">{countdown.hours}</span>
              <span className="countdown-label">Hours</span>
            </div>
            <div className="countdown-separator">:</div>
            <div className="countdown-unit">
              <span className="countdown-number">{countdown.minutes}</span>
              <span className="countdown-label">Minutes</span>
            </div>
            <div className="countdown-separator">:</div>
            <div className="countdown-unit">
              <span className="countdown-number">{countdown.seconds}</span>
              <span className="countdown-label">Seconds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}