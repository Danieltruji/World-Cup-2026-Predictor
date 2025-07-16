import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import '../pages/stylesheets/clubWorldCup.css'

const backendUrl = process.env.REACT_APP_BACKEND_URL;

const groupedTeams = {
  "Group A": [
    "SE Palmeiras (BRA)",
    "FC Porto (POR)",
    "Al Ahly FC (EGY)",
    "Inter Miami CF (USA)"
  ],
  "Group B": [
    "Paris St. Germain (FRA)",
    "Atlético Madrid (ESP)",
    "Botafogo (BRA)",
    "Seattle Sounders (USA)"
  ],
  "Group C": [
    "Bayern München (GER)",
    "Auckland City FC (NZL)",
    "CA Boca Juniors (ARG)",
    "SL Benfica (POR)"
  ],
  "Group D": [
    "CR Flamengo (BRA)",
    "Espérance Tunis (TUN)",
    "Chelsea FC (ENG)",
    "Club León (MEX)"
  ],
  "Group E": [
    "CA River Plate (ARG)",
    "Urawa Reds D. (JPN)",
    "CF Monterrey (MEX)",
    "FC Inter Milan (ITA)"
  ],
  "Group F": [
    "Fluminense FC (BRA)",
    "Borussia Dortmund (GER)",
    "Ulsan HD FC (KOR)",
    "Mamelodi Sundowns (RSA)"
  ],
  "Group G": [
    "Manchester City (ENG)",
    "Wydad AC (MAR)",
    "Al Ain FC (UAE)",
    "Juventus FC (ITA)"
  ],
  "Group H": [
    "Real Madrid CF (ESP)",
    "Al Hilal SFC (KSA)",
    "CF Pachuca (MEX)",
    "FC Salzburg (AUT)"
  ]
};


export default function ClubWorldCup() {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);

  useEffect(() => {
    // Fetch upcoming matches
    fetch(`${backendUrl}/upcoming_matches`)
      .then(res => res.json())
      .then(data => {
        if (data.matches) {
          setUpcomingMatches(data.matches.slice(0, 5));
        }
      });

    // Fetch live/recent matches
    fetch(`${backendUrl}/live_scores`)
      .then(res => res.json())
      .then(data => {
        if (data.events) {
          setLiveMatches(data.events.slice(0, 5));
        }
      });
  }, []);

  return (
    <div className="club-world-cup-page">
      <h1 className="page-title">FIFA Club World Cup 2025</h1>

      {/* Live Matches Section */}
      <section className="section">
        <h2>Live/Recent Matches</h2>
        {liveMatches.length === 0 ? (
          <p>No recent matches available.</p>
        ) : (
          <ul className="match-list">
            {liveMatches.map((match, index) => (
              <li key={index}>
                {match.strEvent} — {match.dateEvent} — {match.intHomeScore} : {match.intAwayScore}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Upcoming Matches Section */}
      <section className="section">
        <h2>Upcoming Matches</h2>
        {upcomingMatches.length === 0 ? (
          <p>No upcoming matches scheduled.</p>
        ) : (
          <ul className="match-list">
            {upcomingMatches.map((match, index) => (
              <li key={index}>
                {match.strEvent} — {match.dateEvent} — {match.strTime}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Participating Teams Section */}
      <section className="section">
        <h2>Participating Teams</h2>
        <div className="grouped-teams">
          {Object.entries(groupedTeams).map(([group, teams]) => (
            <div key={group} className="group-box">
              <h3>{group}</h3>
              <ul className="team-list">
                {teams.map((team, index) => (
                  <li key={index}>{team}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Bracket Prediction Section */}
      <section className="section">
        <h2>Bracket Prediction</h2>
        <Link to="/club-world-cup/predict" className="predict-link">
          Start Predicting →
        </Link>
      </section>
    </div>
  );

}