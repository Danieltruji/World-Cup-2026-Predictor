import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import './stylesheets/stickerbook.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
const SESSION_ID = 'test-user';

// ── flag helper ──────────────────────────────────────────────
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
  'Italy': 'it', 'Northern Ireland': 'gb-nir', 'Wales': 'gb-wls',
  'Bosnia & Herzegovina': 'ba', 'Ukraine': 'ua', 'Sweden': 'se',
  'Poland': 'pl', 'Albania': 'al', 'Türkiye': 'tr', 'Romania': 'ro',
  'Slovakia': 'sk', 'Kosovo': 'xk', 'Denmark': 'dk',
  'North Macedonia': 'mk', 'Czech Republic': 'cz', 'Republic of Ireland': 'ie',
  'DR Congo': 'cd', 'New Caledonia': 'nc', 'Jamaica': 'jm',
  'Iraq': 'iq', 'Bolivia': 'bo', 'Suriname': 'sr',
};

const getFlagUrl = (country) => {
  const code = COUNTRY_CODE_MAP[country];
  if (!code) return null;
  return `https://flagcdn.com/64x48/${code}.png`;
};

// Confederation badge colors
const CONF_COLORS = {
  UEFA: '#003DA5', CONMEBOL: '#007A4D', CONCACAF: '#BF0D3E',
  CAF: '#009A44', AFC: '#FF6600', OFC: '#00ADEF', Mixed: '#6B46C1',
};

// ── Silhouette placeholder ───────────────────────────────────
function SilhouetteCard({ isLegend }) {
  return (
    <div className={`silhouette-placeholder ${isLegend ? 'legend-silhouette' : ''}`}>
      <svg viewBox="0 0 80 100" className="silhouette-svg">
        <circle cx="40" cy="28" r="14" fill="currentColor" opacity="0.35" />
        <ellipse cx="40" cy="75" rx="22" ry="28" fill="currentColor" opacity="0.35" />
      </svg>
    </div>
  );
}

// ── Player Slot ──────────────────────────────────────────────
function PlayerSlot({ slot, teamAbbrev, onAddToAlbum, pendingIds }) {
  const isPlaced = slot.in_album;
  const isPending = pendingIds.has(slot.player_id);

  const handleAdd = () => {
    if (!isPlaced && !isPending) onAddToAlbum(slot.player_id);
  };

  return (
    <div className={`player-slot ${isPlaced ? 'placed' : 'empty'} ${isPending ? 'pending' : ''}`}>
      {isPlaced ? (
        <>
          <div className="slot-photo-wrap">
            {slot.photo_url ? (
              <img
                src={slot.photo_url}
                alt={slot.name}
                className="slot-photo"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <SilhouetteCard isLegend={false} />
          </div>
          <div className="slot-label placed-label">
            <span className="slot-num">{teamAbbrev} {slot.slot_number}</span>
            <span className="slot-name">{slot.name}</span>
            {slot.position && <span className="slot-pos">{slot.position}</span>}
          </div>
        </>
      ) : (
        <div className="slot-empty-inner" onClick={handleAdd} title={isPending ? 'Placing...' : 'Place from pack'}>
          <span className="slot-empty-num">{teamAbbrev}</span>
          <span className="slot-empty-big-num">{slot.slot_number}</span>
        </div>
      )}
    </div>
  );
}

// ── Legend Slot ──────────────────────────────────────────────
function LegendSlot({ slot, onAddToAlbum, pendingIds }) {
  if (!slot) return null;
  const isPlaced = slot.in_album;
  const isPending = pendingIds.has(slot.player_id);

  return (
    <div className={`legend-slot ${isPlaced ? 'legend-placed' : 'legend-empty'}`}>
      <div className="legend-slot-header">
        <span className="legend-star">★</span>
        <span className="legend-label-text">LEGEND</span>
        <span className="legend-star">★</span>
      </div>
      {isPlaced ? (
        <div className="legend-card-content">
          <div className="legend-photo-wrap">
            <SilhouetteCard isLegend={true} />
          </div>
          <div className="legend-info">
            <span className="legend-name">{slot.name}</span>
            {slot.legend_years && <span className="legend-years">{slot.legend_years}</span>}
            <p className="legend-desc">{slot.legend_description}</p>
          </div>
        </div>
      ) : (
        <div className="legend-empty-content" onClick={() => !isPending && onAddToAlbum(slot.player_id)}>
          <SilhouetteCard isLegend={true} />
          <span className="legend-empty-name">{slot.name}</span>
          <span className="legend-empty-hint">Place from pack</span>
        </div>
      )}
    </div>
  );
}

// ── Country Page (single album page) ────────────────────────
function CountryPage({ team, pageData, userAlbum, onAddToAlbum, pendingIds }) {
  if (!team) return <div className="page-inner blank-page" />;

  // TBD team page
  if (team.status === 'tbd') {
    return (
      <div className="page-inner tbd-page">
        <div className="tbd-header">
          <span className="tbd-badge">TBD</span>
          <h2 className="tbd-title">{team.tbd_description}</h2>
          <p className="tbd-detail">{team.tbd_detail}</p>
          {team.playoff_date && (
            <p className="tbd-date">📅 Finals: {team.playoff_date}</p>
          )}
        </div>
        <div className="tbd-teams-grid">
          {(team.tbd_teams || []).map((tname) => (
            <div key={tname} className="tbd-team-chip">
              {getFlagUrl(tname) && (
                <img src={getFlagUrl(tname)} alt={tname} className="tbd-flag"
                  onError={(e) => e.target.style.display = 'none'} />
              )}
              <span>{tname}</span>
            </div>
          ))}
        </div>
        <div className="tbd-lock">
          <span className="tbd-lock-icon">🔒</span>
          <span>This page unlocks when the team qualifies</span>
        </div>
      </div>
    );
  }

  const slots = pageData?.slots || [];
  const regularSlots = slots.filter(s => !s.is_legend);
  const legendSlot = slots.find(s => s.is_legend);
  const placedCount = regularSlots.filter(s => s.in_album).length;
  const totalCount = regularSlots.length;

  const confColor = CONF_COLORS[team.confederation] || '#333';
  const flagUrl = getFlagUrl(team.name);

  // Generate a short team abbreviation (up to 3 chars) for empty slot labels
  const abbrev = team.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);

  return (
    <div className="page-inner country-page">
      {/* ── Page Header ── */}
      <div className="page-header" style={{ borderTopColor: confColor }}>
        <div className="page-header-left">
          {flagUrl && (
            <img src={flagUrl} alt={team.name} className="page-flag"
              onError={(e) => e.target.style.display = 'none'} />
          )}
          <div className="page-header-text">
            <h2 className="page-country-name">{team.name}</h2>
            <p className="page-federation">{team.federation}</p>
          </div>
        </div>
        <div className="page-header-right">
          <span className="page-conf-badge" style={{ background: confColor }}>
            {team.confederation}
          </span>
          <span className="page-progress-text">
            {placedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* ── Team Photo Slot ── */}
      <div className="team-photo-slot">
        <div className="team-photo-inner">
          <span className="team-photo-label">TEAM PHOTO</span>
        </div>
      </div>

      {/* ── Player Grid + Legend ── */}
      <div className="page-body">
        <div className="player-grid">
          {regularSlots.map(slot => (
            <PlayerSlot
              key={slot.player_id}
              slot={slot}
              teamAbbrev={abbrev}
              onAddToAlbum={onAddToAlbum}
              pendingIds={pendingIds}
            />
          ))}
        </div>

        {/* ── Legend Slot (bottom left) ── */}
        <LegendSlot
          slot={legendSlot}
          onAddToAlbum={onAddToAlbum}
          pendingIds={pendingIds}
        />
      </div>
    </div>
  );
}

// ── Album Cover ──────────────────────────────────────────────
function AlbumCover({ onOpen }) {
  return (
    <div className="album-cover" onClick={onOpen}>
      <div className="cover-bg">
        <div className="cover-trophy">🏆</div>
        <div className="cover-title-block">
          <span className="cover-fifa">FIFA</span>
          <h1 className="cover-title">WORLD CUP</h1>
          <span className="cover-year">2026™</span>
        </div>
        <div className="cover-flags-row">
          {['🇺🇸','🇨🇦','🇲🇽','🇧🇷','🇦🇷','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇫🇷','🇩🇪','🇪🇸','🇵🇹'].map((f,i) => (
            <span key={i} className="cover-flag-emoji">{f}</span>
          ))}
        </div>
        <div className="cover-subtitle">OFFICIAL STICKER ALBUM</div>
        <div className="cover-hosts">
          USA · CANADA · MEXICO
        </div>
        <div className="cover-click-hint">Click to open album →</div>
      </div>
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="album-progress-bar-wrap">
      <div className="album-progress-bar">
        <div className="album-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="album-progress-label">{current}/{total} stickers placed ({pct}%)</span>
    </div>
  );
}

// ── Main Stickerbook Component ───────────────────────────────
export default function Stickerbook() {
  const [mode, setMode] = useState('cover'); // 'cover' | 'album'
  const [teams, setTeams] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // left-page index (0-based)
  const [pageDataCache, setPageDataCache] = useState({});
  const [progress, setProgress] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState('idle'); // 'idle' | 'forward' | 'backward' | 'reset'
  const [pendingIds, setPendingIds] = useState(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const flipTimerRef = useRef(null);

  // ── Load teams list ──────────────────────────────────────
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${backendUrl}/wc2026/teams`, {
          headers: { 'session-id': SESSION_ID }
        });
        setTeams(res.data.teams || []);
      } catch {
        setError('Could not load album. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // ── Load progress ────────────────────────────────────────
  const fetchProgress = useCallback(async () => {
    try {
      const res = await axios.get(`${backendUrl}/wc2026/my_progress`, {
        headers: { 'session-id': SESSION_ID }
      });
      setProgress(res.data);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  // ── Load page data for visible teams ────────────────────
  const loadPageData = useCallback(async (teamId) => {
    if (!teamId || pageDataCache[teamId]) return;
    try {
      const res = await axios.get(`${backendUrl}/wc2026/team/${teamId}`, {
        headers: { 'session-id': SESSION_ID }
      });
      setPageDataCache(prev => ({ ...prev, [teamId]: res.data }));
    } catch { /* silently fail — page will show empty */ }
  }, [pageDataCache]);

  // Pre-load current spread and adjacent teams
  useEffect(() => {
    if (teams.length === 0) return;
    const toLoad = [
      teams[currentIndex]?.id,
      teams[currentIndex + 1]?.id,
      teams[currentIndex + 2]?.id,
      teams[currentIndex - 1]?.id,
    ].filter(Boolean);
    toLoad.forEach(id => loadPageData(id));
  }, [currentIndex, teams, loadPageData]);

  // ── Navigation ───────────────────────────────────────────
  const canGoNext = currentIndex + 2 < teams.length;
  const canGoPrev = currentIndex > 0;

  const navigateNext = useCallback(() => {
    if (!canGoNext || flipDir !== 'idle' || isFlipping) return;
    setFlipDir('forward');
    setIsFlipping(true);
    clearTimeout(flipTimerRef.current);
    flipTimerRef.current = setTimeout(() => {
      setCurrentIndex(prev => prev + 2);
      setFlipDir('reset');
      // Re-enable after DOM settles
      setTimeout(() => {
        setFlipDir('idle');
        setIsFlipping(false);
      }, 50);
    }, 620);
  }, [canGoNext, flipDir, isFlipping]);

  const navigatePrev = useCallback(() => {
    if (!canGoPrev || flipDir !== 'idle' || isFlipping) return;
    setFlipDir('backward');
    setIsFlipping(true);
    clearTimeout(flipTimerRef.current);
    flipTimerRef.current = setTimeout(() => {
      setCurrentIndex(prev => Math.max(0, prev - 2));
      setFlipDir('reset');
      setTimeout(() => {
        setFlipDir('idle');
        setIsFlipping(false);
      }, 50);
    }, 620);
  }, [canGoPrev, flipDir, isFlipping]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (mode !== 'album') return;
      if (e.key === 'ArrowRight') navigateNext();
      if (e.key === 'ArrowLeft')  navigatePrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, navigateNext, navigatePrev]);

  // ── Place sticker ────────────────────────────────────────
  const handleAddToAlbum = useCallback(async (playerId) => {
    setPendingIds(prev => new Set(prev).add(playerId));
    try {
      const res = await axios.post(
        `${backendUrl}/wc2026/place_sticker`,
        { player_id: playerId },
        { headers: { 'session-id': SESSION_ID } }
      );
      if (res.data.success) {
        // Refresh the affected page cache
        const affected = Object.entries(pageDataCache).find(([, pd]) =>
          pd?.slots?.some(s => s.player_id === playerId)
        );
        if (affected) {
          setPageDataCache(prev => {
            const updated = { ...prev };
            delete updated[affected[0]]; // force re-fetch
            return updated;
          });
        }
        fetchProgress();
      }
    } catch { /* silently fail */ }
    finally {
      setPendingIds(prev => { const s = new Set(prev); s.delete(playerId); return s; });
    }
  }, [pageDataCache, fetchProgress]);

  // ── Teams for current spread ─────────────────────────────
  const leftTeam  = teams[currentIndex];
  const rightTeam = teams[currentIndex + 1];
  const nextTeam  = teams[currentIndex + 2]; // back face of right page (forward flip)
  const prevTeam  = teams[currentIndex - 1]; // for backward flip

  const leftData  = leftTeam  ? pageDataCache[leftTeam.id]  : null;
  const rightData = rightTeam ? pageDataCache[rightTeam.id] : null;
  const nextData  = nextTeam  ? pageDataCache[nextTeam.id]  : null;

  // ── Render ───────────────────────────────────────────────
  if (mode === 'cover') {
    return <AlbumCover onOpen={() => setMode('album')} />;
  }

  if (loading) {
    return (
      <div className="album-loading">
        <div className="loading-spinner" />
        <p>Loading sticker album…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="album-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="stickerbook-page">
      {/* ── Top Bar ── */}
      <div className="album-topbar">
        <button className="album-back-btn" onClick={() => setMode('cover')}>
          ← Back to Cover
        </button>
        <h1 className="album-topbar-title">FIFA World Cup 2026™ Sticker Album</h1>
        {progress && (
          <ProgressBar
            current={progress.filled_slots}
            total={progress.total_slots}
          />
        )}
      </div>

      {/* ── Book ── */}
      <div className="book-scene">
        <div className="book-container">
          {/* Left Page */}
          <div className="book-page left-book-page">
            <CountryPage
              team={leftTeam}
              pageData={leftData}
              onAddToAlbum={handleAddToAlbum}
              pendingIds={pendingIds}
            />
          </div>

          {/* Right Page with flip animation */}
          <div className={`book-page right-book-page flipper
              ${flipDir === 'forward' ? 'flipping-forward' : ''}
              ${flipDir === 'backward' ? 'flipping-backward' : ''}
              ${flipDir === 'reset' ? 'no-transition' : ''}`
          }>
            {/* Front face — current right page */}
            <div className="flipper-face flipper-front">
              <CountryPage
                team={rightTeam}
                pageData={rightData}
                onAddToAlbum={handleAddToAlbum}
                pendingIds={pendingIds}
              />
            </div>
            {/* Back face — next page (revealed after flip) */}
            <div className="flipper-face flipper-back">
              <CountryPage
                team={flipDir === 'backward' ? leftTeam : nextTeam}
                pageData={flipDir === 'backward' ? leftData : nextData}
                onAddToAlbum={handleAddToAlbum}
                pendingIds={pendingIds}
              />
            </div>
          </div>

          {/* Book spine */}
          <div className="book-spine" />
        </div>

        {/* ── Navigation ── */}
        <button
          className="nav-btn nav-prev"
          onClick={navigatePrev}
          disabled={!canGoPrev || isFlipping}
          title="Previous page (←)"
        >
          ‹
        </button>
        <button
          className="nav-btn nav-next"
          onClick={navigateNext}
          disabled={!canGoNext || isFlipping}
          title="Next page (→)"
        >
          ›
        </button>
      </div>

      {/* ── Page counter ── */}
      <div className="page-counter">
        {leftTeam && <span className="page-counter-left">{leftTeam.name}</span>}
        <span className="page-counter-nums">
          {currentIndex + 1}–{Math.min(currentIndex + 2, teams.length)} / {teams.length}
        </span>
        {rightTeam && <span className="page-counter-right">{rightTeam.name}</span>}
      </div>

      {/* ── Countries quick-jump ── */}
      <div className="country-index">
        {teams.map((t, i) => (
          <button
            key={t.id}
            className={`country-index-btn ${t.status === 'tbd' ? 'tbd-btn' : ''}
              ${i === currentIndex || i === currentIndex + 1 ? 'active-btn' : ''}`}
            onClick={() => {
              if (isFlipping) return;
              // Navigate to the spread containing this team
              const spreadStart = i % 2 === 0 ? i : i - 1;
              setCurrentIndex(spreadStart);
            }}
            title={t.name}
          >
            {t.status === 'tbd'
              ? '?'
              : (getFlagUrl(t.name)
                ? <img src={getFlagUrl(t.name)} alt={t.name}
                    onError={(e) => { e.target.outerHTML = `<span>${t.name.slice(0,3)}</span>`; }} />
                : t.name.slice(0, 3)
              )
            }
          </button>
        ))}
      </div>
    </div>
  );
}
