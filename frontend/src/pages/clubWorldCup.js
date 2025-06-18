import React from "react";
import { Link } from "react-router-dom";
import '../pages/stylesheets/clubWorldCup.css'

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
  return (
    <div className="club-world-cup-page">
      <h1 className="page-title">FIFA Club World Cup 2025</h1>

      <section className="section">
        <h2>Live Scores</h2>
        <p>Live updates coming soon...</p>
      </section>

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

      <section className="section">
        <h2>Bracket Prediction</h2>
        <Link to="/club-world-cup/predict" className="predict-link">
          Start Predicting →
        </Link>
      </section>
    </div>
  );
}
