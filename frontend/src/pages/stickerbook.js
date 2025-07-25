import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './stylesheets/stickerbook.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL;

const countryCodeMap = {
  'Argentina': 'ar',
  'England': 'gb-eng',
  'Brazil': 'br',
  'France': 'fr',
  'Spain': 'es',
  'Germany': 'de',
  'Italy': 'it',
  'Portugal': 'pt',
  'Netherlands': 'nl',
  'Belgium': 'be',
};

const RARITY_CONFIG = {
  legendary: {
    displayName: 'Legendary',
    color: '#f1c40f'
  },
  rare: {
    displayName: 'Rare',
    color: '#9b59b6'
  },
  common: {
    displayName: 'Common',
    color: '#666'
  }
};

export default function Stickerbook() {
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStickerbook = async () => {
      try {
        const res = await axios.get(`${backendUrl}/my_stickerbook`, {
          headers: { 'session-id': 'test-user' }
        });
        setCards(res.data.cards);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load your stickerbook.');
      }
    };

    fetchStickerbook();
  }, []);

  const getCountryCode = (country) => {
    return countryCodeMap[country] || 'unknown';
  };

  const getFlagUrl = (card) => {
    if (card.flag_url) {
      return card.flag_url;
    }
    return `https://flagcdn.com/24x18/${getCountryCode(card.country)}.png`;
  };

  return (
    <div className="stickerbook-page">
      <h1>Stickerbook</h1>
      {error && <p className="error-msg">{error}</p>}

      <div className="sticker-grid">
        {cards.length === 0 ? (
          <div className="empty-state">
            <p>You haven't collected any cards yet!</p>
            <p className="empty-subtitle">Open some packs to start collecting!</p>
          </div>
        ) : (
          cards.map((card) => (
            <div 
              key={card.id} 
              className={`sticker-card ${card.rarity || 'common'}`}  // Apply rarity class
            >
              <div className="card-img-container">
                <img 
                  src={card.image} 
                  alt={card.name} 
                  className={`card-img ${card.rarity}`} // Glow styling
                />
                <img 
                  src={getFlagUrl(card)}
                  alt={`${card.country} flag`} 
                  className="country-flag"
                  onError={(e) => {
                    if (!e.target.src.includes('flagcdn.com')) {
                      e.target.src = `https://flagcdn.com/24x18/${getCountryCode(card.country)}.png`;
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                />
                {/* Rarity badge */}
                <div 
                  className="rarity-indicator"
                  style={{
                    background: RARITY_CONFIG[card.rarity]?.color || '#666',
                    color: card.rarity === 'common' ? '#fff' : '#000'
                  }}
                >
                  {RARITY_CONFIG[card.rarity]?.displayName || 'Common'}
                </div>
              </div>

              <h4>{card.name}</h4>
              <p className="club-name">{card.club || card.country}</p>
            </div>
          ))
        )}
      </div>

      {cards.length > 0 && (
        <div className="collection-stats">
          <p>Total Cards Collected: <span className="stat-number">{cards.length}</span></p>
        </div>
      )}
    </div>
  );
}