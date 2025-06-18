import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './stylesheets/clubBracket.css';

export default function ClubWorldCupPredict() {
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [strategy, setStrategy] = useState('ml');
  const [results, setResults] = useState(null);
  const [groupWinners, setGroupWinners] = useState(null);
  const [clubGroups, setClubGroups] = useState({});
  const [allTeams, setAllTeams] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/get_club_groups")
      .then(res => res.json())
      .then(data => {
        setClubGroups(data);
        const flat = Object.values(data).flat().map(t => typeof t === 'string' ? t : t.name);
        setAllTeams(flat);
      });
  }, []);

  const handleSimulate = async () => {
    try {
      const response = await axios.post('http://localhost:5000/simulate_bracket', {
        favorite_team: favoriteTeam,
        strategy,
      });
      setResults(response.data);

      const groupStageWinners = {};
      const groups = Object.entries(clubGroups);
      let winnersIndex = 0;
      groups.forEach(([groupName]) => {
        const winners = response.data.results['R16']
          .slice(winnersIndex, winnersIndex + 2)
          .map(match => match.winner);
        groupStageWinners[groupName] = winners;
        winnersIndex += 2;
      });
      setGroupWinners(groupStageWinners);
    } catch (err) {
      console.error('Error simulating bracket:', err);
    }
  };

  return (
    <div className="club-bracket-page">
      <h1>🏆 Club World Cup Prediction</h1>

      <div className="input-section">
        <label>Select Your Favorite Team:</label>
        <select onChange={(e) => setFavoriteTeam(e.target.value)} value={favoriteTeam}>
          <option value="">-- Choose Team --</option>
          {allTeams.map((team, idx) => (
            <option key={idx} value={team}>{team}</option>
          ))}
        </select>

        <div className="strategy-toggle">
          <label>
            <input
              type="radio"
              value="ml"
              checked={strategy === 'ml'}
              onChange={() => setStrategy('ml')}
            /> ML-Based
          </label>
          <label style={{ marginLeft: '1rem' }}>
            <input
              type="radio"
              value="random"
              checked={strategy === 'random'}
              onChange={() => setStrategy('random')}
            /> Random
          </label>
        </div>

        <button onClick={handleSimulate} disabled={!favoriteTeam}>Simulate Bracket</button>
      </div>

      {groupWinners && (
        <div className="group-results">
          <h2>🏋️ Group Stage Winners</h2>
          {Object.entries(groupWinners).map(([group, teams]) => (
            <div className="group-block" key={group}>
              <strong>{group}:</strong> {teams.join(' & ')}
            </div>
          ))}
        </div>
      )}

      {results && (
        <div className="bracket-results">
          <h2>Knockout Bracket</h2>
          {['R16', 'QF', 'SF', 'Final'].map(round => (
            <div className="round-block" key={round}>
              <h3>{round}</h3>
              {results.results[round]?.map((match, idx) => (
                <div key={idx}>
                  {match.team1} vs {match.team2} — <span className={match.winner === favoriteTeam ? 'highlight' : ''}>{match.winner}</span>
                </div>
              ))}
            </div>
          ))}

          <h2>🏆 Final Winner: {results.final_winner}</h2>

          {results.favorite_path && (
            <div>
              <h3>Your Team's Path:</h3>
              {results.favorite_path.map((step, idx) => (
                <div key={idx}>{step.round}: {step.team1} vs {step.team2} — Winner: {step.winner}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
