import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './stylesheets/stickerbook.css';

export default function Stickerbook() {
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStickerbook = async () => {
      try {
        const res = await axios.get('http://localhost:5000/my_stickerbook', {
          headers: { 'session-id': 'test-user' }
        });
        setCards(res.data.cards);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load your stickerbook.');
      }
    };

    fetchStickerbook();
  }, []);

  return (
    <div className="stickerbook-page">
      <h1>Stickerbook</h1>
      {error && <p className="error-msg">{error}</p>}

      <div className="sticker-grid">
        {cards.length === 0 ? (
          <p>You haven’t collected any cards yet!</p>
        ) : (
          cards.map((card) => (
            <div key={card.id} className="sticker-card">
              <div className="flag-wrapper">
                <img src={card.flag_url} alt={`${card.country} flag`} className="country-flag" />
              </div>

              <img src={card.image} alt={card.name} className="player-image" />

              <h4>{card.name}</h4>
              <p className="club-name">{card.club}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}