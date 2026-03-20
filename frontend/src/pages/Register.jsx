import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getFlagUrl } from '../utils/countryFlags';
import './stylesheets/authPages.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamParam = searchParams.get('team'); // pre-selected team from carousel

  const { user, login } = useAuth();

  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // ── Redirect if already fully onboarded ──────────────────
  useEffect(() => {
    if (user && user.favorite_team) {
      navigate('/world-cup-2026', { replace: true });
    }
  }, [user, navigate]);

  // ── Form submit ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // 1. Register
      const res = await axios.post(`${backendUrl}/auth/register`, {
        username, email, password,
      });
      const { user: userData, access_token } = res.data;

      // 2. If ?team param present, save it immediately after registration
      if (teamParam) {
        try {
          const teamRes = await axios.post(
            `${backendUrl}/auth/select-team`,
            { team_name: teamParam },
            { headers: { Authorization: `Bearer ${access_token}` } }
          );
          if (teamRes.data.success) {
            const updatedUser = { ...userData, favorite_team: teamParam };
            login(updatedUser, access_token);
            navigate('/world-cup-2026', { replace: true });
            return;
          }
        } catch {
          // Fall through — log in without team, they can pick on home page
        }
      }

      // 3. No team param (or team save failed) → log in and go home to pick
      login(userData, access_token);
      navigate('/', { replace: true });

    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try a different email or username.');
    } finally {
      setLoading(false);
    }
  };

  if (user && user.favorite_team) return null;

  const teamFlagUrl = teamParam ? getFlagUrl(teamParam) : null;

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Team banner — shown when arriving from carousel flag click */}
        {teamParam && (
          <div className="auth-team-banner">
            {teamFlagUrl && (
              <img src={teamFlagUrl} alt={teamParam} className="auth-team-flag"
                onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <span>Registering as <strong>{teamParam}</strong></span>
          </div>
        )}

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join the WC 2026 Predictor community</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              type="text"
              className="auth-input"
              placeholder="coolpredictor99"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              className="auth-input"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch-link">
          Already have an account?{' '}
          <Link
            to={teamParam ? `/login?team=${encodeURIComponent(teamParam)}` : '/login'}
            className="auth-switch-anchor"
          >
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}
