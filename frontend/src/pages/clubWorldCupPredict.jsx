import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './stylesheets/clubBracket.css';
import './stylesheets/groupStage.css';


const backendUrl = process.env.REACT_APP_BACKEND_URL;

export default function ClubWorldCupPredict() {
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [strategy, setStrategy] = useState('ml');
  const [results, setResults] = useState(null);
  const [clubGroups, setClubGroups] = useState({});
  const [allTeams, setAllTeams] = useState([]);
  const [lineRenderTrigger, setLineRenderTrigger] = useState(0);
  const [hasSimulated, setHasSimulated] = useState(false);
  const matchRefs = useRef({});
  const containerRef = useRef(null);

  useEffect(() => {
    fetch((`${backendUrl}/get_club_groups`))
      .then(res => res.json())
      .then(data => {
        setClubGroups(data);
        const flat = Object.values(data).flat().map(t => typeof t === 'string' ? t : t.name);
        setAllTeams(flat.sort());
      });
  }, []);

  const handleSimulate = async () => {
    try {
      const response = await axios.post(`${backendUrl}/simulate_bracket`, {
        favorite_team: favoriteTeam,
        strategy,
      });
      setResults(response.data);
      setHasSimulated(true); 
      setTimeout(() => {
        requestAnimationFrame(() => setLineRenderTrigger(prev => prev + 1));
      }, 1400);
    } catch (err) {
      console.error('Error simulating bracket:', err);
    }
  };

  const handleReset = () => {
    setResults(null);
    setLineRenderTrigger(prev => prev + 1);
    matchRefs.current = {};
    setHasSimulated(false);
  };

const renderGroupStage = () => {
  const groups = results?.group_results;
  if (!groups) return null;

  return (
    <div className="group-stage">
      <h2>Group Stage Results</h2>
      <div className="group-grid">
        {Object.entries(groups).map(([group, info]) => (
          <div key={group} className="group-card">
            <h3>{group}</h3>
            <div className="group-table">
              <div className="group-header">
                <span>Team</span><span>W</span><span>D</span><span>L</span><span>Pts</span>
              </div>
              {Object.entries(info.table)
                .sort((a, b) => b[1].points - a[1].points)
                .map(([team, stats]) => (
                  <div key={team} className={`group-row ${info.advancing.includes(team) ? 'advancing' : ''}`}>
                    <span>{team}</span>
                    <span>{stats.W}</span>
                    <span>{stats.D}</span>
                    <span>{stats.L}</span>
                    <span>{stats.points}</span>
                  </div>
              ))}
            </div>
            <div className="group-matches">
              <h4>Matches</h4>
              {info.matches.map((m, idx) => (
                <div key={idx} className="group-match">
                  {m.team1} vs {m.team2} — <strong>{m.result.toUpperCase()}</strong>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
  const renderRoundColumn = (round, side) => {
    if (!results?.results[round]) return null;
    const baseDelays = { R16: 0.2, QF: 1.0, SF: 1.8, Final: 3.0 };
    const delay = baseDelays[round] || 0.2;
    const half = Math.floor(results.results[round].length / 2);
    const matches = side === 'left'
      ? results.results[round].slice(0, half)
      : side === 'right'
      ? results.results[round].slice(half)
      : results.results[round];

    return (
      <motion.div className={`round ${side}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
        <h3 className="round-label">{round}</h3>
        {matches.map((match, idx) => {
          const globalIdx = side === 'left' ? idx : side === 'right' ? idx + half : idx;
          const matchKey = `${side}-${round}-${globalIdx}`;
          return (
            <motion.div
              key={matchKey}
              ref={(el) => (matchRefs.current[matchKey] = el)}
              className={`match-box ${match.winner === favoriteTeam ? 'highlight' : ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + idx * 0.1 }}
            >
              <div className="match-text">
                <div>{match.team1} vs {match.team2}</div>
                <strong>{match.winner}</strong>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  const drawCurve = (x1, y1, x2, y2) => {
    const dx = Math.abs(x2 - x1) * 0.5;
    const curve = x2 > x1
      ? `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
      : `M${x1},${y1} C${x1 - dx},${y1} ${x2 + dx},${y2} ${x2},${y2}`;
    return <path d={curve} stroke="#aaa" fill="none" strokeWidth="2" />;
  };

  const drawLines = () => {
    const lines = [];
    const container = containerRef.current;
    if (!container || !results) return lines;

    const getGlobalMidpoint = (el) => {
      const rect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const scrollLeft = container.scrollLeft;
      const top = rect.top - containerRect.top + scrollTop + rect.height / 2;
      const left = rect.left - containerRect.left + scrollLeft;
      const right = left + rect.width;
      return { top, left, right };
    };

    const connectRounds = (side, roundFrom, roundTo) => {
      const fromMatches = results.results[roundFrom];
      const toMatches = results.results[roundTo];
      const halfFrom = fromMatches.length / 2;
      const halfTo = toMatches.length / 2;

      for (let j = 0; j < halfTo; j++) {
        const fromIdxA = j * 2 + (side === 'right' ? halfFrom : 0);
        const fromIdxB = j * 2 + 1 + (side === 'right' ? halfFrom : 0);
        const toIdx = j + (side === 'right' ? halfTo : 0);

        const fromA = matchRefs.current[`${side}-${roundFrom}-${fromIdxA}`];
        const fromB = matchRefs.current[`${side}-${roundFrom}-${fromIdxB}`];
        const to = matchRefs.current[`${side}-${roundTo}-${toIdx}`];

        if (fromA && fromB && to) {
          const A = getGlobalMidpoint(fromA);
          const B = getGlobalMidpoint(fromB);
          const T = getGlobalMidpoint(to);

          if (side === 'right') {
            lines.push(drawCurve(A.right, A.top, T.left, T.top));
            lines.push(drawCurve(B.right, B.top, T.left, T.top));
          } else {
            lines.push(drawCurve(A.left, A.top, T.right, T.top));
            lines.push(drawCurve(B.left, B.top, T.right, T.top));
          }
        }
      }
    };

    connectRounds('left', 'R16', 'QF');
    connectRounds('left', 'QF', 'SF');
    connectRounds('right', 'R16', 'QF');
    connectRounds('right', 'QF', 'SF');

    const final = matchRefs.current['center-Final-0'];
    const leftSF = matchRefs.current['left-SF-0'];
    const rightSF = matchRefs.current['right-SF-0'];

    if (final && leftSF && rightSF) {
      const F = getGlobalMidpoint(final);
      const L = getGlobalMidpoint(leftSF);
      const R = getGlobalMidpoint(rightSF);
      lines.push(drawCurve(L.left, L.top, F.left, F.top));
      lines.push(drawCurve(R.right, R.top, F.left, F.top));
    }

    return lines;
  };


  return (
    <div className="bracket-page">
      <h1 className="bracket-title">Club World Cup Prediction</h1>
      <div className="input-section">
        <select onChange={(e) => setFavoriteTeam(e.target.value)} value={favoriteTeam}>
          <option value="">-- Choose Team --</option>
          {allTeams.map((team, idx) => (
            <option key={idx} value={team}>{team}</option>
          ))}
        </select>
        <div className="strategy-toggle">
          <label><input type="radio" value="ml" checked={strategy === 'ml'} onChange={() => setStrategy('ml')} /> AI</label>
          <label><input type="radio" value="random" checked={strategy === 'random'} onChange={() => setStrategy('random')} /> Random</label>
        </div>
        <button onClick={handleSimulate} disabled={!favoriteTeam}>{hasSimulated ? "Re-simulate Bracket" : "Simulate Bracket"}</button>
        <button onClick={handleReset} className="reset-button">Reset</button>
      </div>

      {results && (
        <>
          {renderGroupStage()}
          <div className="bracket-container" ref={containerRef}>
            <svg className="bracket-svg" key={lineRenderTrigger}>
              {drawLines()}
            </svg>
            <div className="rounds-layout symmetrical">
              <div className="bracket-half left-half">
                {renderRoundColumn('SF', 'left')}
                {renderRoundColumn('QF', 'left')}
                {renderRoundColumn('R16', 'left')}
              </div>
              <div className="center-final">
                {renderRoundColumn('Final', 'center')}
              </div>
              <div className="bracket-half right-half">
                {renderRoundColumn('SF', 'right')}
                {renderRoundColumn('QF', 'right')}
                {renderRoundColumn('R16', 'right')}
              </div>
            </div>
            <motion.h2 className="winner" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 3.5 }}>
              🏆 Final Winner: {results.final_winner}
            </motion.h2>
          </div>

          {results.favorite_path && (
            <div className="path">
              <h3>Your Team's Path:</h3>
              {results.favorite_path.map((step, idx) => (
                <div key={idx}>{step.round}: {step.team1} vs {step.team2} — Winner: {step.winner}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}