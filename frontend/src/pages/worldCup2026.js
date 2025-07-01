import React from 'react';
import { Link } from 'react-router-dom';
import './stylesheets/worldcup2026.css';



export default function WorldCup2026() {
  return (
    <div className="worldcup2026-page">
      <h1>FIFA World Cup 2026</h1>
      <p>Explore teams, matches, and sticker packs!</p>

      <Link to="/open-packs" className="open-packs-button">
        Open a Player Pack →
      </Link>
    </div>
  );
}