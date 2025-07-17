import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './stylesheets/stickerbook.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL;

// Country code mapping for flag images (in case backend doesn't provide flag_url)
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
  // Add more mappings as needed
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

  // Get country code for flag display (fallback if backend doesn't provide flag_url)
  const getCountryCode = (country) => {
    return countryCodeMap[country] || 'unknown';
  };

  // Get flag URL - use backend provided URL or fallback to flagcdn
  const getFlagUrl = (card) => {
    if (card.flag_url) {
      return card.flag_url;
    }
    return `https://flagcdn.com/24x18/${getCountryCode(card.country)}.png`;
  };

  return (
    <div className="stickerbook-page">
      <h1>My Stickerbook</h1>
      {error && <p className="error-msg">{error}</p>}

      <div className="sticker-grid">
        {cards.length === 0 ? (
          <div className="empty-state">
            <p>You haven't collected any cards yet!</p>
            <p className="empty-subtitle">Open some packs to start collecting!</p>
          </div>
        ) : (
          cards.map((card) => (
            <div key={card.id} className="sticker-card">
              <div className="card-img-container">
                <img 
                  src={card.image} 
                  alt={card.name} 
                  className="card-img" 
                />
                <img 
                  src={getFlagUrl(card)}
                  alt={`${card.country} flag`} 
                  className="country-flag"
                  onError={(e) => {
                    // Fallback to flagcdn if backend flag fails
                    if (!e.target.src.includes('flagcdn.com')) {
                      e.target.src = `https://flagcdn.com/24x18/${getCountryCode(card.country)}.png`;
                    } else {
                      // Hide flag if both sources fail
                      e.target.style.display = 'none';
                    }
                  }}
                />
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
