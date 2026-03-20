import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import MatchDetailModal from '../components/MatchDetailModal';
import './stylesheets/wc2026Bracket.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL;

const COUNTRY_CODES = {
  "Argentina": "ar", "Australia": "au", "Austria": "at", "Algeria": "dz",
  "Belgium": "be", "Brazil": "br", "Canada": "ca", "Cape Verde": "cv",
  "Colombia": "co", "Croatia": "hr", "Curaçao": "cw", "Ecuador": "ec",
  "Egypt": "eg", "England": "gb-eng", "France": "fr", "Germany": "de",
  "Ghana": "gh", "Haiti": "ht", "Iran": "ir", "Ivory Coast": "ci",
  "Japan": "jp", "Jordan": "jo", "Mexico": "mx", "Morocco": "ma",
  "Netherlands": "nl", "New Zealand": "nz", "Norway": "no", "Panama": "pa",
  "Paraguay": "py", "Portugal": "pt", "Qatar": "qa", "Saudi Arabia": "sa",
  "Scotland": "gb-sct", "Senegal": "sn", "South Africa": "za",
  "South Korea": "kr", "Spain": "es", "Switzerland": "ch", "Tunisia": "tn",
  "United States": "us", "Uruguay": "uy", "Uzbekistan": "uz",
  "UEFA Path A": "eu", "UEFA Path B": "eu", "UEFA Path C": "eu", "UEFA Path D": "eu",
  "Interconf PO 1": "un", "Interconf PO 2": "un",
};

function getFlag(name) {
  const code = COUNTRY_CODES[name];
  if (!code) return null;
  return `https://flagcdn.com/24x18/${code}.png`;
}

function TeamName({ name }) {
  const flag = getFlag(name);
  return (
    <span className="team-name-flag">
      {flag && <img src={flag} alt="" className="inline-flag" />}
      {name}
    </span>
  );
}

export default function WorldCup2026Predict() {
  const { user } = useAuth();
  const yourTeam = user?.favorite_team || null;

  const [strategy, setStrategy] = useState('ml');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const matchRefs = useRef({});
  const containerRef = useRef(null);
  const [lineKey, setLineKey] = useState(0);

  const handleSimulate = useCallback(async (newSeed) => {
    setLoading(true);
    try {
      const body = { strategy };
      if (yourTeam) body.your_team = yourTeam;
      if (newSeed) body.seed = newSeed;

      const res = await axios.post(`${backendUrl}/wc2026/simulate`, body);
      setResults(res.data);
      matchRefs.current = {};
      setTimeout(() => {
        requestAnimationFrame(() => setLineKey(k => k + 1));
      }, 1800);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  }, [strategy, yourTeam]);

  const handleRegenerate = () => {
    const newSeed = Math.floor(Math.random() * 999999);
    handleSimulate(newSeed);
  };

  const toggleGroupMatches = (g) => {
    setExpandedGroups(prev => ({ ...prev, [g]: !prev[g] }));
  };

  // ── Group stage rendering ────────────────────────────────────
  const renderGroupStage = () => {
    const groups = results?.group_results;
    if (!groups) return null;

    const qualifyingThirds = (results.third_place_ranking || []).slice(0, 8).map(t => t.name);

    return (
      <motion.div
        className="wc-group-stage"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">Group Stage Results</h2>
        <div className="wc-group-grid">
          {Object.entries(groups).sort().map(([letter, data]) => (
            <motion.div
              key={letter}
              className="wc-group-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: letter.charCodeAt(0) * 0.04 - 2.4 }}
            >
              <div className="wc-group-header">Group {letter}</div>
              <table className="wc-group-table">
                <thead>
                  <tr>
                    <th className="team-col">Team</th>
                    <th>W</th><th>D</th><th>L</th>
                    <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {data.standings.map((team, idx) => {
                    const isAdvancing = idx < 2;
                    const isThirdQualifying = idx === 2 && qualifyingThirds.includes(team.name);
                    const isYourTeam = team.name === yourTeam;
                    return (
                      <tr
                        key={team.name}
                        className={[
                          isAdvancing ? 'advancing' : '',
                          isThirdQualifying ? 'third-qualifying' : '',
                          isYourTeam ? 'your-team-row' : '',
                        ].join(' ')}
                      >
                        <td className="team-col"><TeamName name={team.name} /></td>
                        <td>{team.W}</td><td>{team.D}</td><td>{team.L}</td>
                        <td>{team.GF}</td><td>{team.GA}</td>
                        <td>{team.GD > 0 ? `+${team.GD}` : team.GD}</td>
                        <td className="pts-col">{team.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button
                className="toggle-matches-btn"
                onClick={() => toggleGroupMatches(letter)}
              >
                {expandedGroups[letter] ? 'Hide Matches' : 'Show Matches'}
              </button>
              <AnimatePresence>
                {expandedGroups[letter] && (
                  <motion.div
                    className="wc-group-matches"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {data.matches.map((m, idx) => (
                      <div key={idx} className="wc-group-match-row">
                        <TeamName name={m.team1} />
                        <span className="match-score">{m.score[0]} - {m.score[1]}</span>
                        <TeamName name={m.team2} />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  // ── Bracket rendering ────────────────────────────────────────
  const renderRoundColumn = (round, side) => {
    const knockout = results?.knockout;
    if (!knockout) return null;

    const matches = knockout[round];
    if (!matches || !Array.isArray(matches)) return null;

    const half = Math.floor(matches.length / 2);
    let displayMatches;
    if (side === 'left') displayMatches = matches.slice(0, half);
    else if (side === 'right') displayMatches = matches.slice(half);
    else displayMatches = matches;

    const baseDelays = { R32: 0.1, R16: 0.8, QF: 1.5, SF: 2.2 };
    const delay = baseDelays[round] || 0.1;

    const roundLabels = { R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarter-Finals', SF: 'Semi-Finals' };

    return (
      <motion.div
        className={`wc-round ${side}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay }}
      >
        <h3 className="round-label">{roundLabels[round] || round}</h3>
        {displayMatches.map((match, idx) => {
          const globalIdx = side === 'right' ? idx + half : idx;
          const matchKey = `${side}-${round}-${globalIdx}`;
          const isYourTeamMatch = yourTeam && (match.team1 === yourTeam || match.team2 === yourTeam);
          const yourTeamWon = isYourTeamMatch && match.winner === yourTeam;

          return (
            <motion.div
              key={matchKey}
              ref={(el) => { matchRefs.current[matchKey] = el; }}
              className={`wc-match-box ${yourTeamWon ? 'highlight' : ''} ${isYourTeamMatch && !yourTeamWon ? 'your-team-lost' : ''}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + idx * 0.08 }}
              onClick={() => setSelectedMatch({ ...match, stage: round })}
            >
              <div className="match-teams">
                <div className={`match-team ${match.result === 'team1' ? 'winner' : ''}`}>
                  {getFlag(match.team1)
                    ? <img src={getFlag(match.team1)} alt="" className="inline-flag" />
                    : <span className="flag-placeholder" />}
                  <span className="team-name-text">{match.team1}</span>
                  <span className="match-goals">{match.score?.[0] ?? '-'}</span>
                </div>
                <div className={`match-team ${match.result === 'team2' ? 'winner' : ''}`}>
                  {getFlag(match.team2)
                    ? <img src={getFlag(match.team2)} alt="" className="inline-flag" />
                    : <span className="flag-placeholder" />}
                  <span className="team-name-text">{match.team2}</span>
                  <span className="match-goals">{match.score?.[1] ?? '-'}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  const renderSpecialMatch = (matchData, label, delayBase) => {
    if (!matchData) return null;
    const isYourTeamMatch = yourTeam && (matchData.team1 === yourTeam || matchData.team2 === yourTeam);
    const yourTeamWon = isYourTeamMatch && matchData.winner === yourTeam;

    return (
      <motion.div
        className="wc-special-match"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delayBase }}
      >
        <h3 className="round-label">{label}</h3>
        <motion.div
          className={`wc-match-box final-box ${yourTeamWon ? 'highlight' : ''}`}
          onClick={() => setSelectedMatch({ ...matchData, stage: label })}
          whileHover={{ scale: 1.02 }}
        >
          <div className="match-teams">
            <div className={`match-team ${matchData.result === 'team1' ? 'winner' : ''}`}>
              {getFlag(matchData.team1)
                ? <img src={getFlag(matchData.team1)} alt="" className="inline-flag" />
                : <span className="flag-placeholder" />}
              <span className="team-name-text">{matchData.team1}</span>
              <span className="match-goals">{matchData.score?.[0] ?? '-'}</span>
            </div>
            <div className={`match-team ${matchData.result === 'team2' ? 'winner' : ''}`}>
              {getFlag(matchData.team2)
                ? <img src={getFlag(matchData.team2)} alt="" className="inline-flag" />
                : <span className="flag-placeholder" />}
              <span className="team-name-text">{matchData.team2}</span>
              <span className="match-goals">{matchData.score?.[1] ?? '-'}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // ── SVG bracket lines ────────────────────────────────────────
  const drawCurve = (x1, y1, x2, y2) => {
    const dx = Math.abs(x2 - x1) * 0.5;
    const curve = x2 > x1
      ? `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
      : `M${x1},${y1} C${x1 - dx},${y1} ${x2 + dx},${y2} ${x2},${y2}`;
    return <path d={curve} fill="none" strokeWidth="2" key={`${x1}-${y1}-${x2}-${y2}`} />;
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
      return {
        top: rect.top - containerRect.top + scrollTop + rect.height / 2,
        left: rect.left - containerRect.left + scrollLeft,
        right: rect.left - containerRect.left + scrollLeft + rect.width,
      };
    };

    const connectRounds = (side, roundFrom, roundTo) => {
      const fromMatches = results.knockout[roundFrom];
      const toMatches = results.knockout[roundTo];
      if (!fromMatches || !toMatches || !Array.isArray(fromMatches) || !Array.isArray(toMatches)) return;

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
            lines.push(drawCurve(A.left, A.top, T.right, T.top));
            lines.push(drawCurve(B.left, B.top, T.right, T.top));
          } else {
            lines.push(drawCurve(A.right, A.top, T.left, T.top));
            lines.push(drawCurve(B.right, B.top, T.left, T.top));
          }
        }
      }
    };

    connectRounds('left', 'R32', 'R16');
    connectRounds('left', 'R16', 'QF');
    connectRounds('left', 'QF', 'SF');
    connectRounds('right', 'R32', 'R16');
    connectRounds('right', 'R16', 'QF');
    connectRounds('right', 'QF', 'SF');

    return lines;
  };

  // ── Your Team's Journey ──────────────────────────────────────
  const renderYourTeamPath = () => {
    if (!yourTeam || !results?.your_team_path) return null;
    const path = results.your_team_path;

    return (
      <motion.div
        className="your-team-journey"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.5 }}
      >
        <h3 className="journey-title">Your Team's Journey</h3>
        <div className="journey-badge">
          <TeamName name={yourTeam} />
        </div>
        <div className="journey-steps">
          {path.map((step, idx) => (
            <motion.div
              key={idx}
              className={`journey-step ${step.won === false ? 'eliminated' : 'advanced'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 3.6 + idx * 0.15 }}
            >
              <span className="step-round">{step.round}</span>
              {step.round === 'Group Stage' ? (
                <span className="step-detail">
                  Group {step.group} — {step.position}{step.position === 1 ? 'st' : step.position === 2 ? 'nd' : 'rd'} place
                  ({step.points} pts, GD {step.GD > 0 ? `+${step.GD}` : step.GD})
                  {step.advanced ? ' ✓' : ' ✗'}
                </span>
              ) : (
                <span className="step-detail">
                  vs <TeamName name={step.opponent} /> — {step.score[0]}-{step.score[1]}
                  {step.won ? ' ✓' : ' ✗'}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="wc-bracket-page">
      <h1 className="wc-bracket-title">World Cup 2026 Prediction</h1>

      {/* Your Team badge */}
      {yourTeam && (
        <div className="your-team-badge">
          Your Team: <TeamName name={yourTeam} />
        </div>
      )}

      {/* Strategy picker + controls */}
      <div className="wc-controls">
        <div className="strategy-toggle">
          <label className={strategy === 'ml' ? 'active' : ''}>
            <input
              type="radio"
              value="ml"
              checked={strategy === 'ml'}
              onChange={() => setStrategy('ml')}
            />
            AI Prediction
          </label>
          <label className={strategy === 'random' ? 'active' : ''}>
            <input
              type="radio"
              value="random"
              checked={strategy === 'random'}
              onChange={() => setStrategy('random')}
            />
            Random
          </label>
        </div>
        <div className="wc-buttons">
          <button
            className="simulate-btn"
            onClick={() => handleSimulate()}
            disabled={loading}
          >
            {loading ? 'Simulating...' : results ? 'Re-simulate' : 'Simulate Tournament'}
          </button>
          {results && (
            <button
              className="regenerate-btn"
              onClick={handleRegenerate}
              disabled={loading}
            >
              Regenerate Bracket
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {results && (
        <>
          {renderGroupStage()}

          {/* Knockout bracket */}
          <motion.div
            className="wc-bracket-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="section-title">Knockout Stage</h2>

            <div className="wc-bracket-container" ref={containerRef}>
              <svg className="bracket-svg" key={lineKey}>
                {drawLines()}
              </svg>
              <div className="wc-rounds-layout">
                <div className="wc-bracket-half left-half">
                  {renderRoundColumn('R32', 'left')}
                  {renderRoundColumn('R16', 'left')}
                  {renderRoundColumn('QF', 'left')}
                  {renderRoundColumn('SF', 'left')}
                </div>

                <div className="wc-center-column">
                  {renderSpecialMatch(results.knockout.Final, 'Final', 3.0)}
                  {renderSpecialMatch(results.knockout.third_place_match, '3rd Place', 2.8)}
                </div>

                <div className="wc-bracket-half right-half">
                  {renderRoundColumn('R32', 'right')}
                  {renderRoundColumn('R16', 'right')}
                  {renderRoundColumn('QF', 'right')}
                  {renderRoundColumn('SF', 'right')}
                </div>
              </div>
            </div>

            {/* Winner display */}
            <motion.div
              className="wc-winner-display"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 3.5, type: 'spring', stiffness: 200 }}
            >
              <span className="trophy-icon">🏆</span>
              <span className="winner-text">
                <TeamName name={results.final_winner} /> wins the 2026 World Cup!
              </span>
            </motion.div>
          </motion.div>

          {renderYourTeamPath()}
        </>
      )}

      {/* Match detail modal */}
      <AnimatePresence>
        {selectedMatch && (
          <MatchDetailModal
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
            yourTeam={yourTeam}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
