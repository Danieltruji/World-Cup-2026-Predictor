import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import '../pages/stylesheets/header.css';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedTeam }  = useTeam();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <nav className="navbar">

      {/* ── LEFT: Flag only (logged in + team) OR world_cup.png ── */}
      {selectedTeam ? (
        <button
          className="logo-button logo-flag-only"
          onClick={() => navigate('/world-cup-2026')}
          title={selectedTeam.name}
        >
          <img
            src={selectedTeam.flagUrl}
            alt={selectedTeam.name}
            className="logo-team-flag"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </button>
      ) : (
        <button className="logo-button" onClick={() => navigate('/')}>
          <img src="/world_cup.png" alt="World Cup Logo" />
          <span>Home</span>
        </button>
      )}

      {/* ── CENTER: Nav links — always the same ─────────────────── */}
      <div className="nav-links">
        <button onClick={() => navigate('/teams')}>Teams</button>
        <button onClick={() => navigate('/club-world-cup')}>Club World Cup</button>
        <button onClick={() => navigate('/world-cup-2026')}>World Cup 2026</button>
        <button onClick={() => navigate('/Stickerbook')}>Sticker Book</button>
      </div>

      {/* ── RIGHT: Username dropdown OR Sign In / Create Account ── */}
      <div className="nav-buttons">
        {user ? (
          <div className="user-menu-wrapper">
            <button
              className="username-btn"
              onClick={() => setShowUserMenu((prev) => !prev)}
            >
              {user.username} ▾
            </button>
            {showUserMenu && (
              <div className="user-dropdown">
                <button onClick={handleSignOut}>Sign Out</button>
              </div>
            )}
          </div>
        ) : null}
      </div>

    </nav>
  );
}
