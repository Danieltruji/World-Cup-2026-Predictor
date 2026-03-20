import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { COUNTRY_CODE_MAP, getFlagUrl } from '../utils/countryFlags';
import './stylesheets/home.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

// Build the carousel team list from the shared COUNTRY_CODE_MAP, sorted A→Z
const CAROUSEL_TEAMS = Object.keys(COUNTRY_CODE_MAP)
  .sort()
  .map((name) => ({ name, flagUrl: getFlagUrl(name) }));

export default function Welcome() {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();

  // ── Redirect: logged-in users with a team never see this page ──
  useEffect(() => {
    if (user && user.favorite_team) {
      navigate('/world-cup-2026', { replace: true });
    }
  }, [user, navigate]);

  // ── Carousel refs & state ────────────────────────────────
  const trackRef       = useRef(null);
  const scrollSpeedRef = useRef(80);  // ms per tick, decreases on hold
  const scrollTimerRef = useRef(null);
  const [selectingTeam, setSelectingTeam] = useState(null);
  const [error, setError]                 = useState('');

  // Stop accelerating scroll
  const stopScroll = useCallback(() => {
    clearTimeout(scrollTimerRef.current);
    scrollSpeedRef.current = 80;
  }, []);

  // Accelerating scroll loop
  const startScroll = useCallback((direction) => {
    const tick = () => {
      if (!trackRef.current) return;
      trackRef.current.scrollLeft += direction === 'right' ? 120 : -120;
      scrollSpeedRef.current = Math.max(12, scrollSpeedRef.current - 8);
      scrollTimerRef.current = setTimeout(tick, scrollSpeedRef.current);
    };
    tick();
  }, []);

  useEffect(() => () => stopScroll(), [stopScroll]);

  // ── Handle flag click ────────────────────────────────────
  const handleSelectTeam = async (team) => {
    if (selectingTeam) return;

    // State 1: not logged in → go to register with team pre-selected
    if (!user) {
      navigate(`/register?team=${encodeURIComponent(team.name)}`);
      return;
    }

    // State 2: logged in, no team yet → POST to backend
    setSelectingTeam(team.name);
    setError('');
    try {
      const res = await axios.post(
        `${backendUrl}/auth/select-team`,
        { team_name: team.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        updateUser({ ...user, favorite_team: team.name });
        navigate('/world-cup-2026');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save team. Try again.');
    } finally {
      setSelectingTeam(null);
    }
  };

  // Don't flash content while redirect resolves
  if (user && user.favorite_team) return null;

  return (
    <div className="hero-container">
      <div className="hero-content">

        {/* ── Headline ─────────────────────────────── */}
        {user ? (
          <>
            <h2 className="hero-title">Welcome, {user.username} 👋</h2>
            <p className="hero-subtext">
              One last step — pick your nation.<br />
              <strong>Choose wisely, you can't change it.</strong>
            </p>
          </>
        ) : (
          <>
            <h2 className="hero-title">Predict the World Cup 2026 Champion 🏆</h2>
            <p className="hero-subtext">
              Select your nation, then predict the winner.
            </p>
          </>
        )}

        {/* ── Flag Carousel ─────────────────────────── */}
        <div className="flag-carousel-section">
          <button
            className="carousel-arrow carousel-arrow-left"
            onMouseDown={() => startScroll('left')}
            onMouseUp={stopScroll}
            onMouseLeave={stopScroll}
            onTouchStart={() => startScroll('left')}
            onTouchEnd={stopScroll}
            aria-label="Scroll left"
          >
            ‹
          </button>

          <div className="flag-track-viewport">
            <div className="flag-track" ref={trackRef}>
              {CAROUSEL_TEAMS.map((team) => (
                <button
                  key={team.name}
                  className={`flag-circle-btn${selectingTeam === team.name ? ' flag-circle-selecting' : ''}`}
                  onClick={() => handleSelectTeam(team)}
                  title={team.name}
                  disabled={!!selectingTeam}
                >
                  {team.flagUrl ? (
                    <img
                      src={team.flagUrl}
                      alt={team.name}
                      className="flag-circle-img"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="flag-circle-abbrev">
                      {team.name.slice(0, 3).toUpperCase()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            className="carousel-arrow carousel-arrow-right"
            onMouseDown={() => startScroll('right')}
            onMouseUp={stopScroll}
            onMouseLeave={stopScroll}
            onTouchStart={() => startScroll('right')}
            onTouchEnd={stopScroll}
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>

        {error && <p className="carousel-error">{error}</p>}

        <p className="cant-find-team">
          Can't find your team?{' '}
          <Link to="/teams" className="cant-find-link">Learn more</Link>
        </p>

        {/* ── Auth CTAs — State 1 only (not logged in) ── */}
        {!user && (
          <div className="home-auth-section">
            <button
              className="home-auth-register"
              onClick={() => navigate('/register')}
            >
              Create Account
            </button>
            <button
              className="home-auth-login"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
