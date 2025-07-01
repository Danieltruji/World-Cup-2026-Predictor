import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './stylesheets/openPacksGame.css';

export default function OpenPacksGame() {
  const [packOpened, setPackOpened] = useState(false);
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');

const handleOpen = async () => {
  try {
    const res = await axios.get('http://localhost:5000/open_pack', {
      headers: { 'session-id': 'test-user' }
    });

    const openedCards = res.data.cards;
    setCards(openedCards);
    setPackOpened(true);
    setError('');

    // Step 2: Send the player IDs to /save_cards
    const ids = openedCards.map(card => card.id);
    await axios.post('http://localhost:5000/save_cards', {
      player_ids: ids
    }, {
      headers: { 'session-id': 'test-user' }
    });

  } catch (err) {
    setError(err.response?.data?.error || 'Something went wrong');
  }
};
  return (
    <div className="open-pack-container">
      <h1>Open Your Player Pack</h1>

      {error && <p className="error-msg">{error}</p>}

      {!packOpened && (
        <motion.img
          src="/player-cards/foil-pack.png"
          alt="Foil Pack"
          className="foil-pack-img"
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3 }}
          onClick={handleOpen}
        />
      )}

      {packOpened && (
        <motion.div
          className="card-reveal-wrapper"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.3
              }
            }
          }}
        >
          {cards.map((card) => (
            <motion.div
              key={card.id}
              className="card"
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.5 }}
            >
              <img src={card.image} alt={card.name} className="card-img" />
              <h4>{card.name}</h4>
              <p>{card.country}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}