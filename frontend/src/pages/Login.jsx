import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getFlagUrl } from '../utils/countryFlags';
import './stylesheets/authPages.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamParam = searchParams.get('team'); // pre-selected team from carousel

  const { user, login, updateUser } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
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
    setLoading(true);

    try {
      // 1. Log in
      const res = await axios.post(`${backendUrl}/auth/login`, { email, password });
      const { user: userData, access_token } = res.data;
      login(userData, access_token);

      // 2. If a ?team param is present and user has no team yet, save it now
      if (teamParam && !userData.favorite_team) {
        try {
          const teamRes = await axios.post(
            `${backendUrl}/auth/select-team`,
            { team_name: teamParam },
            { headers: { Authorization: `Bearer ${access_token}` } }
          );
          if (teamRes.data.success) {
            updateUser({ ...userData, favorite_team: teamParam });
          }
        } catch {
          // Non-critical — user can still pick team on the home page
        }
      }

      // 3. Navigate: if user now has a team → flagship page, else → home to pick
      const finalUser = teamParam ? { ...userData, favorite_team: teamParam } : userData;
      navigate(finalUser.favorite_team ? '/world-cup-2026' : '/', { replace: true });

    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  if (user && user.favorite_team) return null;

  const teamFlagUrl = teamParam ? getFlagUrl(teamParam) : null;

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Team banner — shown when arriving from carousel */}
        {teamParam && (
          <div className="auth-team-banner">
            {teamFlagUrl && (
              <img src={teamFlagUrl} alt={teamParam} className="auth-team-flag"
                onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <span>Signing in as <strong>{teamParam}</strong></span>
          </div>
        )}

        <h1 className="auth-title">Sign In</h1>
        <p className="auth-subtitle">Welcome back to WC 2026 Predictor</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
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
            <label className="auth-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch-link">
          Don't have an account?{' '}
          <Link
            to={teamParam ? `/register?team=${encodeURIComponent(teamParam)}` : '/register'}
            className="auth-switch-anchor"
          >
            Create Account
          </Link>
        </p>

      </div>
    </div>
  );
}
