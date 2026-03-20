import React from 'react';
import { motion } from 'framer-motion';
import './matchDetailModal.css';

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

function getFlag(name, size = 48) {
  const code = COUNTRY_CODES[name];
  if (!code) return null;
  return `https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${code}.png`;
}

export default function MatchDetailModal({ match, onClose, yourTeam }) {
  if (!match) return null;

  const probs = match.probabilities || {};
  const t1Pct = Math.round((probs.team1 || 0) * 100);
  const drawPct = Math.round((probs.draw || 0) * 100);
  const t2Pct = Math.round((probs.team2 || 0) * 100);
  const isYourTeamMatch = yourTeam && (match.team1 === yourTeam || match.team2 === yourTeam);

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-stage">{match.stage}</div>

        <div className="modal-matchup">
          <div className={`modal-team ${match.result === 'team1' ? 'winner' : ''}`}>
            {getFlag(match.team1, 64) && (
              <img src={getFlag(match.team1, 64)} alt="" className="modal-flag" />
            )}
            <span className="modal-team-name">{match.team1}</span>
          </div>

          <div className="modal-score">
            <span className="score-num">{match.score?.[0] ?? '?'}</span>
            <span className="score-divider">–</span>
            <span className="score-num">{match.score?.[1] ?? '?'}</span>
          </div>

          <div className={`modal-team ${match.result === 'team2' ? 'winner' : ''}`}>
            {getFlag(match.team2, 64) && (
              <img src={getFlag(match.team2, 64)} alt="" className="modal-flag" />
            )}
            <span className="modal-team-name">{match.team2}</span>
          </div>
        </div>

        {isYourTeamMatch && (
          <div className="your-team-indicator">Your Team</div>
        )}

        <div className="modal-probabilities">
          <div className="prob-header">
            <span>{match.team1}</span>
            <span>Draw</span>
            <span>{match.team2}</span>
          </div>
          <div className="prob-bar-container">
            <div className="prob-bar t1-bar" style={{ width: `${t1Pct}%` }}>
              {t1Pct > 10 && `${t1Pct}%`}
            </div>
            <div className="prob-bar draw-bar" style={{ width: `${drawPct}%` }}>
              {drawPct > 10 && `${drawPct}%`}
            </div>
            <div className="prob-bar t2-bar" style={{ width: `${t2Pct}%` }}>
              {t2Pct > 10 && `${t2Pct}%`}
            </div>
          </div>
        </div>

        <div className="modal-winner-line">
          Winner: <strong>{match.winner || 'Draw'}</strong>
        </div>
      </motion.div>
    </motion.div>
  );
}
