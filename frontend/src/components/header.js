import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/stylesheets/header.css';

export default function Header() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <button className="logo-button" onClick={() => navigate('/')}>
        <img src="/world_cup.png" alt="World Cup Logo" />
        <span>Home</span>
      </button>

      <div className="nav-links">
        <button onClick={() => navigate('/teams')}>Teams</button>
        <button onClick={() => navigate('/club-world-cup')}>Club World Cup</button>
      </div>

      <div className="nav-buttons">
        <button className="sign-in">Sign In</button>
        <button className="create-account">Create Account</button>
      </div>
    </nav>
  );
}
