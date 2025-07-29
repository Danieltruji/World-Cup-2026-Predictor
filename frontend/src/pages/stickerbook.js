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
  'Norway': 'no',
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
  const [rarityFilter, setRarityFilter] = useState('all');

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

  // Filter cards based on selected rarity
  const filteredCards = rarityFilter === 'all' 
    ? cards 
    : cards.filter((card) => card.rarity === rarityFilter);

  // Get rarity counts for display
  const getRarityCounts = () => {
    const counts = {
      all: cards.length,
      legendary: cards.filter(card => card.rarity === 'legendary').length,
      rare: cards.filter(card => card.rarity === 'rare').length,
      common: cards.filter(card => card.rarity === 'common').length
    };
    return counts;
  };

  const rarityCounts = getRarityCounts();

  const handleRarityFilterChange = (rarity) => {
    setRarityFilter(rarity);
  };

  return (
    <div className="stickerbook-page">
      <h1>Stickerbook</h1>
      {error && <p className="error-msg">{error}</p>}

      <div className="rarity-filter">
        {['all', 'legendary', 'rare', 'common'].map((rarity) => (
          <button
            key={rarity}
            onClick={() => handleRarityFilterChange(rarity)}
            className={`filter-btn ${rarityFilter === rarity ? 'active' : ''}`}
            data-rarity={rarity}
          >
            <span className="filter-btn-content">
              {rarity === 'legendary' }
              {rarity === 'rare' }
              {rarity === 'common' }
              {rarity === 'all' && '🃏'}
              {RARITY_CONFIG[rarity]?.displayName || 'All'}
              <span className="filter-count-badge">
                {rarity === 'all' ? rarityCounts.all : rarityCounts[rarity]}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="sticker-grid">
        {filteredCards.length === 0 ? (
          <div className="empty-state">
            {rarityFilter === 'all' ? (
              <>
                <p>You haven't collected any cards yet!</p>
                <p className="empty-subtitle">Open some packs to start collecting!</p>
              </>
            ) : (
              <>
                <p>No {RARITY_CONFIG[rarityFilter]?.displayName || rarityFilter} cards found!</p>
                <p className="empty-subtitle">Try opening more packs or select a different rarity!</p>
              </>
            )}
          </div>
        ) : (
          filteredCards.map((card, index) => (
            <div 
              key={`${card.id}-${index}`} 
              className={`sticker-card ${card.rarity || 'common'}`}
            >
              <div className="card-img-container">
                <img 
                  src={card.image} 
                  alt={card.name} 
                  className={`card-img ${card.rarity || 'common'}`}
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
                <div className={`rarity-indicator ${card.rarity || 'common'}`}>
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
          <p>Total Cards Collected: <span className="stats-number">{cards.length}</span></p>
          <div className="rarity-breakdown">
            <span className="stat-item stat-legendary">
              ⭐ {rarityCounts.legendary} Legendary
            </span>
            <span className="stat-item stat-rare">
              💎 {rarityCounts.rare} Rare
            </span>
            <span className="stat-item stat-common">
              ⚪ {rarityCounts.common} Common
            </span>
          </div>
        </div>
      )}
    </div>
  );
}