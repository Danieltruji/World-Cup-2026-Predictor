import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './stylesheets/openPacksGame.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL;

// Country code mapping for flag images
const countryCodeMap = {
  'Argentina': 'ar',
  'England': 'gb-eng',
  'Brazil': 'br',
  'France': 'fr',
  'Norway': 'no',
  'Real Madrid': 'es', // Team-based fallback
  'Arsenal': 'gb-eng',
  'PSG': 'fr',
  'Inter Miami': 'us',
  'Manchester City': 'gb-eng',
  // Add more mappings as needed
};

export default function OpenPacksGame() {
  const [packOpened, setPackOpened] = useState(false);
  const [packOpening, setPackOpening] = useState(false);
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');
  const [showSparkles, setShowSparkles] = useState(false);

  const handleOpen = async () => {
    if (packOpening) return;
    
    try {
      setPackOpening(true);
      setError('');
      
      const res = await axios.get(`${backendUrl}/open_pack`, {
        headers: { 'session-id': 'test-user' }
      });
      
      const openedCards = res.data.cards;
      setCards(openedCards);
      
      // Trigger sparkles during opening
      setShowSparkles(true);
      
      // Wait for pack opening animation to complete
      setTimeout(() => {
        setPackOpened(true);
        setPackOpening(false);
      }, 1000);
      
      // Send the player IDs to /save_cards
      const ids = openedCards.map(card => card.id);
      await axios.post(`${backendUrl}/save_cards`, {
        player_ids: ids
      }, {
        headers: { 'session-id': 'test-user' }
      });
      
    } catch (err) {
      console.error('Error opening pack:', err);
      setError(err.response?.data?.error || 'Something went wrong');
      setPackOpening(false);
    }
  };

  const resetPack = () => {
    setPackOpened(false);
    setPackOpening(false);
    setCards([]);
    setError('');
    setShowSparkles(false);
  };

  // Get country code for flag display
  const getCountryCode = (country) => {
    return countryCodeMap[country] || 'unknown';
  };

  // Sparkle effect component
  const SparkleEffect = () => {
    const [sparkles, setSparkles] = useState([]);

    useEffect(() => {
      if (showSparkles) {
        const newSparkles = [];
        for (let i = 0; i < 30; i++) {
          newSparkles.push({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            delay: Math.random() * 800
          });
        }
        setSparkles(newSparkles);
        
        // Clear sparkles after animation
        setTimeout(() => {
          setSparkles([]);
          setShowSparkles(false);
        }, 2500);
      }
    }, [showSparkles]);

    return (
      <div className="sparkles-container">
        {sparkles.map(sparkle => (
          <motion.div
            key={sparkle.id}
            className="sparkle"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
            }}
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 2,
              delay: sparkle.delay / 1000,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="open-pack-container">
      <h1>Open Your Player Pack</h1>
      
      {error && <p className="error-msg">{error}</p>}
      
      {!packOpened && (
        <div className="pack-section">
          <motion.img
            src="/player-cards/foil-pack.png"
            alt="Foil Pack"
            className={`foil-pack-img ${packOpening ? 'pack-opening' : ''}`}
            initial={{ scale: 1 }}
            animate={{ 
              scale: packOpening ? [1, 1.1, 0] : 1.1,
              rotate: packOpening ? [0, -5, 5, 0] : 0
            }}
            whileHover={{ scale: packOpening ? 1 : 1.15 }}
            whileTap={{ scale: packOpening ? 1 : 0.95 }}
            transition={{ 
              duration: packOpening ? 1 : 0.3,
              ease: packOpening ? "easeOut" : "easeInOut"
            }}
            onClick={handleOpen}
            style={{ 
              cursor: packOpening ? 'default' : 'pointer',
              pointerEvents: packOpening ? 'none' : 'auto'
            }}
          />
          
          {!packOpening && (
            <motion.p
              className="pack-instruction"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Click the pack to open it!
            </motion.p>
          )}
        </div>
      )}
      
      {packOpened && (
        <div className="cards-section">
          <motion.div
            className="card-reveal-wrapper"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.2
                }
              }
            }}
          >
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                className="card"
                variants={{
                  hidden: { 
                    opacity: 0, 
                    y: 50,
                    scale: 0.8,
                    rotateX: -90
                  },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    scale: 1,
                    rotateX: 0
                  }
                }}
                transition={{ 
                  duration: 0.6,
                  ease: "easeOut",
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{
                  scale: 1.05,
                  y: -10,
                  rotateY: 5,
                  transition: { duration: 0.2 }
                }}
              >
                <div className="card-img-container">
                  <img src={card.image} alt={card.name} className="card-img" />
                  <img 
                    src={`https://flagcdn.com/24x18/${getCountryCode(card.country)}.png`} 
                    alt={card.country}
                    className="country-flag"
                    onError={(e) => {
                      // Fallback to a default flag or hide if flag doesn't exist
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <h4>{card.name}</h4>
                <p>{card.club}</p>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.button
            className="open-pack-btn reset-btn"
            onClick={resetPack}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: cards.length * 0.2 + 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Open Another Pack
          </motion.button>
        </div>
      )}
      
      <SparkleEffect />
    </div>
  );
}