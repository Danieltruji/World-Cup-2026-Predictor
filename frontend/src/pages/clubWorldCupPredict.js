import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './stylesheets/clubBracket.css';

export default function ClubWorldCupPredict() {
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [strategy, setStrategy] = useState('ml');
  const [results, setResults] = useState(null);
  const [clubGroups, setClubGroups] = useState({});
  const [allTeams, setAllTeams] = useState([]);
  const [lineRenderTrigger, setLineRenderTrigger] = useState(0);
  const matchRefs = useRef({});
  const containerRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:5000/get_club_groups")
      .then(res => res.json())
      .then(data => {
        setClubGroups(data);
        const flat = Object.values(data).flat().map(t => typeof t === 'string' ? t : t.name);
        setAllTeams(flat.sort());
      });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      setLineRenderTrigger(prev => prev + 1);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSimulate = async () => {
    try {
      const response = await axios.post('http://localhost:5000/simulate_bracket', {
        favorite_team: favoriteTeam,
        strategy,
      });
      setResults(response.data);
      setTimeout(() => {
        requestAnimationFrame(() => setLineRenderTrigger(prev => prev + 1));
      }, 1400);
    } catch (err) {
      console.error('Error simulating bracket:', err);
    }
  };

  const renderRoundColumn = (round, side) => {
    if (!results?.results[round]) return null;
    const baseDelays = { R16: 0.5, QF: 0.7, SF: 1.0, Final: 2.0 };
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

  const drawLines = () => {
    const lines = [];
    const container = containerRef.current;
    if (!container || !results) return lines;

    const getGlobalMidpoint = (el) => {
      const rect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const top = rect.top - containerRect.top + rect.height / 2;
      const left = rect.left - containerRect.left;
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
            lines.push(<line key={`r-l1-${j}`} x1={A.right} y1={A.top} x2={T.left} y2={T.top} stroke="#aaa" strokeWidth="2" />);
            lines.push(<line key={`r-l2-${j}`} x1={B.right} y1={B.top} x2={T.left} y2={T.top} stroke="#aaa" strokeWidth="2" />);
          } else {
            lines.push(<line key={`l-l1-${j}`} x1={A.left} y1={A.top} x2={T.right} y2={T.top} stroke="#aaa" strokeWidth="2" />);
            lines.push(<line key={`l-l2-${j}`} x1={B.left} y1={B.top} x2={T.right} y2={T.top} stroke="#aaa" strokeWidth="2" />);
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
      lines.push(<line key="final-left" x1={L.left} y1={L.top} x2={F.left} y2={F.top} stroke="#aaa" strokeWidth="2" />);
      lines.push(<line key="final-right" x1={R.right} y1={R.top} x2={F.left} y2={F.top} stroke="#aaa" strokeWidth="2" />);
    }

    return lines;
  };

  return (
    <div className="bracket-page">
      <h1 className="bracket-title">🏆 Club World Cup Prediction</h1>
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
        <button onClick={handleSimulate} disabled={!favoriteTeam}>Simulate Bracket</button>
      </div>

      {results && (
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

          {results.favorite_path && (
            <div className="path">
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