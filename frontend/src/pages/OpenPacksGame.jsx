import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './stylesheets/openPacksGame.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
const SESSION_ID = 'test-user';

// Country → ISO code for flag display
const COUNTRY_CODE_MAP = {
  'Algeria': 'dz', 'Argentina': 'ar', 'Australia': 'au', 'Austria': 'at',
  'Belgium': 'be', 'Brazil': 'br', 'Canada': 'ca', 'Cape Verde': 'cv',
  'Colombia': 'co', 'Croatia': 'hr', 'Curaçao': 'cw', 'Ecuador': 'ec',
  'Egypt': 'eg', 'England': 'gb-eng', 'France': 'fr', 'Germany': 'de',
  'Ghana': 'gh', 'Haiti': 'ht', 'Iran': 'ir', 'Ivory Coast': 'ci',
  'Japan': 'jp', 'Jordan': 'jo', 'Mexico': 'mx', 'Morocco': 'ma',
  'Netherlands': 'nl', 'New Zealand': 'nz', 'Norway': 'no', 'Panama': 'pa',
  'Paraguay': 'py', 'Portugal': 'pt', 'Qatar': 'qa', 'Saudi Arabia': 'sa',
  'Scotland': 'gb-sct', 'Senegal': 'sn', 'South Africa': 'za',
  'South Korea': 'kr', 'Spain': 'es', 'Switzerland': 'ch', 'Tunisia': 'tn',
  'United States': 'us', 'Uruguay': 'uy', 'Uzbekistan': 'uz',
};

const getFlagUrl = (country) => {
  const code = COUNTRY_CODE_MAP[country];
  return code ? `https://flagcdn.com/24x18/${code}.png` : null;
};

const POSITION_COLORS = { GK: '#f39c12', DEF: '#2980b9', MID: '#27ae60', FWD: '#e74c3c' };

// ── Silhouette placeholder ───────────────────────────────────
function Silhouette({ isLegend }) {
  return (
    <div className={`card-silhouette ${isLegend ? 'legend-card-silhouette' : ''}`}>
      <svg viewBox="0 0 80 100" width="60%" height="60%">
        <circle cx="40" cy="28" r="14" fill="currentColor" opacity="0.4" />
        <ellipse cx="40" cy="75" rx="22" ry="28" fill="currentColor" opacity="0.4" />
      </svg>
    </div>
  );
}

// ── Individual card ──────────────────────────────────────────
function PlayerCard({ card, index, onAddToAlbum, addedIds, pendingIds }) {
  const flagUrl = getFlagUrl(card.country);
  const isLegend = card.is_legend;
  const isAdded = addedIds.has(card.id);
  const isDuplicate = card.in_album;
  const isPending = pendingIds.has(card.id);
  const canAdd = !isAdded && !isDuplicate && !isPending;

  return (
    <motion.div
      className={`pack-card ${isLegend ? 'legend-card' : ''} ${isAdded ? 'added-card' : ''}`}
      variants={{
        hidden:  { opacity: 0, y: 60, scale: 0.7, rotateX: -90 },
        visible: { opacity: 1, y: 0, scale: 1, rotateX: 0 }
      }}
      transition={{ duration: 0.55, ease: 'easeOut', type: 'spring', stiffness: 90 }}
      whileHover={canAdd ? { scale: 1.05, y: -6, transition: { duration: 0.15 } } : {}}
    >
      {/* Legend shimmer overlay */}
      {isLegend && <div className="legend-shimmer" />}

      {/* Card header */}
      <div className="pack-card-header">
        {isLegend
          ? <span className="card-legend-badge">★ LEGEND</span>
          : <span className="card-position-badge"
              style={{ background: POSITION_COLORS[card.position] || '#555' }}>
              {card.position || '—'}
            </span>
        }
        {flagUrl && (
          <img src={flagUrl} alt={card.country} className="card-flag"
            onError={e => e.target.style.display = 'none'} />
        )}
      </div>

      {/* Photo */}
      <div className="pack-card-photo">
        {card.photo_url ? (
          <>
            <img
              src={card.photo_url}
              alt={card.name}
              className="card-photo-img"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <Silhouette isLegend={isLegend} />
          </>
        ) : (
          <Silhouette isLegend={isLegend} />
        )}
      </div>

      {/* Info */}
      <div className="pack-card-info">
        <span className="card-player-name">{card.name}</span>
        <span className="card-country">{card.country}</span>
        {isLegend && card.legend_years && (
          <span className="card-legend-years">{card.legend_years}</span>
        )}
        {isLegend && card.legend_description && (
          <p className="card-legend-desc">{card.legend_description}</p>
        )}
      </div>

      {/* Add to album / status */}
      <div className="pack-card-action">
        {isDuplicate || isAdded ? (
          <div className={`card-status-tag ${isAdded ? 'just-added' : 'duplicate'}`}>
            {isAdded ? '✓ Added' : '⊘ In Album'}
          </div>
        ) : (
          <button
            className="add-to-album-btn"
            onClick={() => onAddToAlbum(card.id)}
            disabled={isPending}
          >
            {isPending ? (
              <span className="btn-spinner" />
            ) : (
              '+ Add to Album'
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Sparkle effect ───────────────────────────────────────────
function SparkleEffect({ cards, show }) {
  const [sparkles, setSparkles] = useState([]);
  const hasLegend = cards.some(c => c.is_legend);

  useEffect(() => {
    if (!show) return;
    const count = hasLegend ? 50 : 22;
    const color = hasLegend ? '#ffd700' : '#fff';
    const newSparkles = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 900,
      color,
    }));
    setSparkles(newSparkles);
    const t = setTimeout(() => setSparkles([]), 2500);
    return () => clearTimeout(t);
  }, [show, hasLegend]);

  return (
    <div className="sparkles-container" style={{ pointerEvents: 'none' }}>
      {sparkles.map(s => (
        <motion.div key={s.id} className="sparkle"
          style={{ left: `${s.left}%`, top: `${s.top}%`, background: s.color, boxShadow: `0 0 8px ${s.color}` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 1.8, delay: s.delay / 1000, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function OpenPackGame() {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'opening' | 'revealed'
  const [cards, setCards] = useState([]);
  const [addedIds, setAddedIds] = useState(new Set());
  const [pendingIds, setPendingIds] = useState(new Set());
  const [showSparkles, setShowSparkles] = useState(false);
  const [error, setError] = useState('');
  const [allAddedToAlbum, setAllAddedToAlbum] = useState(false);

  const handleOpen = async () => {
    if (phase === 'opening') return;
    setPhase('opening');
    setError('');
    setAddedIds(new Set());

    try {
      const res = await axios.get(`${backendUrl}/wc2026/open_pack`, {
        headers: { 'session-id': SESSION_ID }
      });
      const openedCards = res.data.cards || [];
      setCards(openedCards);
      setShowSparkles(true);
      setTimeout(() => setPhase('revealed'), 900);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong opening the pack.');
      setPhase('idle');
    }
  };

  const handleAddToAlbum = useCallback(async (playerId) => {
    setPendingIds(prev => new Set(prev).add(playerId));
    try {
      const res = await axios.post(
        `${backendUrl}/wc2026/place_sticker`,
        { player_id: playerId },
        { headers: { 'session-id': SESSION_ID } }
      );
      if (res.data.success || res.data.duplicate) {
        setAddedIds(prev => new Set(prev).add(playerId));
      }
    } catch {
      // silently handle
    } finally {
      setPendingIds(prev => { const s = new Set(prev); s.delete(playerId); return s; });
    }
  }, []);

  const handleAddAll = useCallback(async () => {
    const toAdd = cards.filter(c => !c.in_album && !addedIds.has(c.id));
    for (const card of toAdd) {
      await handleAddToAlbum(card.id);
    }
    setAllAddedToAlbum(true);
  }, [cards, addedIds, handleAddToAlbum]);

  const resetPack = () => {
    setPhase('idle');
    setCards([]);
    setAddedIds(new Set());
    setPendingIds(new Set());
    setShowSparkles(false);
    setError('');
    setAllAddedToAlbum(false);
  };

  const hasLegend = cards.some(c => c.is_legend);
  const newCardsCount = cards.filter(c => !c.in_album).length;
  const duplicatesCount = cards.filter(c => c.in_album).length;

  return (
    <div className="open-pack-container">
      <h1 className="pack-page-title">Open Your Pack</h1>
      <p className="pack-page-subtitle">FIFA World Cup 2026™ Sticker Collection</p>

      {error && <p className="error-msg">{error}</p>}

      {/* ── Pack / Idle ── */}
      {phase !== 'revealed' && (
        <div className="pack-section">
          <motion.img
            src="/player-cards/foil-pack.png"
            alt="WC 2026 Pack"
            className="foil-pack-img"
            initial={{ scale: 1 }}
            animate={{
              scale: phase === 'opening' ? [1, 1.12, 0] : [1, 1.04, 1],
              rotate: phase === 'opening' ? [0, -4, 4, 0] : 0
            }}
            whileHover={{ scale: phase === 'idle' ? 1.1 : 1 }}
            whileTap={{ scale: phase === 'idle' ? 0.95 : 1 }}
            transition={{ duration: phase === 'opening' ? 0.9 : 2, repeat: phase === 'idle' ? Infinity : 0, ease: 'easeInOut' }}
            onClick={phase === 'idle' ? handleOpen : undefined}
            style={{ cursor: phase === 'idle' ? 'pointer' : 'default' }}
          />
          {phase === 'idle' && (
            <motion.p className="pack-instruction"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              Click to open your pack!
            </motion.p>
          )}
        </div>
      )}

      {/* ── Revealed ── */}
      {phase === 'revealed' && (
        <div className="cards-section">
          {/* Pack stats */}
          <motion.div className="pack-stats"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            {hasLegend && <span className="stat-legend">★ LEGEND CARD!</span>}
            <span className="stat-new">{newCardsCount} new</span>
            {duplicatesCount > 0 && <span className="stat-dup">{duplicatesCount} duplicate{duplicatesCount > 1 ? 's' : ''}</span>}
          </motion.div>

          {/* Cards */}
          <motion.div className="card-reveal-wrapper"
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.18 } } }}>
            {cards.map((card, i) => (
              <PlayerCard
                key={card.id}
                card={card}
                index={i}
                onAddToAlbum={handleAddToAlbum}
                addedIds={addedIds}
                pendingIds={pendingIds}
              />
            ))}
          </motion.div>

          {/* Action row */}
          <motion.div className="pack-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: cards.length * 0.18 + 0.3 }}>

            {newCardsCount > 0 && !allAddedToAlbum && (
              <button className="add-all-btn" onClick={handleAddAll}>
                Add All New Cards to Album ({newCardsCount})
              </button>
            )}

            <motion.button className="open-pack-btn reset-btn" onClick={resetPack}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              Open Another Pack
            </motion.button>
          </motion.div>
        </div>
      )}

      <SparkleEffect cards={cards} show={showSparkles} />
    </div>
  );
}
