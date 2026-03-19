# World Cup 2026 Predictor — Project Reference
> Last updated: 2026-03-19  |  Branch: `Updating-UI-and-adding-updating-world-cup`
> Remote: https://github.com/Danieltruji/World_Cup_2026_Predictor.git

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 19.1.0 |
| Routing | React Router DOM | 7.6.2 |
| Animation | Framer Motion | 12.18.1 |
| Icons | Lucide React | 0.536.0 |
| HTTP | Axios + fetch API | 1.10.0 |
| Backend | Flask + Python 3 | — |
| Database | SQLite | `stickerbook.db` |
| ML model | scikit-learn LogisticRegression | — |
| Live data API | TheSportsDB (league 4503) | — |
| Flag images | flagcdn.com | — |

**Frontend proxy:** `localhost:3000` → `localhost:5000` (package.json proxy)
**Backend port:** `5001` default (`PORT` env var)
**Claude Code preview:** `.claude/launch.json` → `preview_start "World Cup 2026 Predictor"` → port 3000

---

## Directory Structure

```
World_Cup_2026_Predictor/
├── frontend/
│   ├── src/
│   │   ├── App.js                          ← Router + layout root
│   │   ├── App.css                         ← ALL design tokens (:root) + global keyframes
│   │   ├── index.js                        ← ReactDOM.createRoot entry point
│   │   ├── components/
│   │   │   ├── header.jsx                  ← Sticky glassmorphic navbar
│   │   │   ├── ContinentDropdown.jsx       ← Continent select (Teams page)
│   │   │   ├── selectedMatchDrawer.jsx     ← Slide-in match detail drawer
│   │   │   └── teamSlidePanel.jsx          ← Team info slide panel
│   │   ├── pages/
│   │   │   ├── home.jsx                    ← Route: /
│   │   │   ├── teams.jsx                   ← Route: /teams
│   │   │   ├── teamDetailPages.jsx         ← Route: /teams/:teamId
│   │   │   ├── clubWorldCup.jsx            ← Route: /club-world-cup
│   │   │   ├── clubWorldCupPredict.jsx     ← Route: /club-world-cup/predict
│   │   │   ├── worldCup2026.jsx            ← Route: /world-cup-2026
│   │   │   ├── stickerbook.jsx             ← Route: /stickerbook
│   │   │   ├── OpenPacksGame.jsx           ← Route: /open-packs
│   │   │   └── stylesheets/
│   │   │       ├── header.css              (190 lines)
│   │   │       ├── home.css                (187 lines)
│   │   │       ├── teams.css               (745 lines)
│   │   │       ├── teamDetailPages.css     (83 lines)
│   │   │       ├── clubWorldCup.css        (683 lines)
│   │   │       ├── clubBracket.css         (434 lines) ← predict page CSS
│   │   │       ├── groupStage.css          (189 lines)
│   │   │       ├── worldcup2026.css        (419 lines)
│   │   │       ├── stickerbook.css         (1020 lines)
│   │   │       ├── openPacksGame.css       (555 lines)
│   │   │       └── selectedMatchDrawer.css (517 lines)
│   │   └── data/
│   │       └── teamInfo.js                 ← Static team data by continent
│   └── package.json
├── backend/
│   ├── app.py                              ← Flask entry point + all API routes
│   ├── requirements.txt
│   ├── model.py                            ← LogisticRegression match predictor
│   ├── simulate_bracket.py                 ← Full tournament simulation
│   ├── stickerbook.py                      ← Club WC album logic
│   ├── wc2026_stickerbook.py               ← WC 2026 album logic
│   ├── db_setup.py / wc2026_db_setup.py    ← DB initializers
│   ├── fetch_wc2026_squads.py
│   ├── utils/
│   │   ├── bracket_utils.py
│   │   ├── feature_engineering.py
│   │   ├── predictor.py
│   │   └── scraper.py
│   └── data/
│       ├── stickerbook.db                  ← SQLite (all tables)
│       ├── club_wc_2025_groups.json        ← Club WC group structure
│       ├── club_wc_features.csv
│       ├── club_world_cup_raw.csv
│       ├── fifa_ranks.csv
│       └── wc2026_data.py
├── .claude/
│   └── launch.json                         ← preview_start config
└── PROJECT_REFERENCE.md                    ← This file
```

---

## Routes

| URL Path | Component File | Export Name | Primary CSS |
|----------|---------------|-------------|-------------|
| `/` | `pages/home.jsx` | `Welcome` | `home.css` |
| `/teams` | `pages/teams.jsx` | `Teams` | `teams.css` |
| `/teams/:teamId` | `pages/teamDetailPages.jsx` | `TeamDetailPage` | `teamDetailPages.css` |
| `/club-world-cup` | `pages/clubWorldCup.jsx` | `ClubWorldCup` | `clubWorldCup.css` |
| `/club-world-cup/predict` | `pages/clubWorldCupPredict.jsx` | `ClubWorldCupPredict` | `clubBracket.css` + `groupStage.css` |
| `/world-cup-2026` | `pages/worldCup2026.jsx` | `WorldCup2026` | `worldcup2026.css` |
| `/stickerbook` | `pages/stickerbook.jsx` | `Stickerbook` | `stickerbook.css` |
| `/open-packs` | `pages/OpenPacksGame.jsx` | `OpenPackGame` | `openPacksGame.css` |
| `/club-world-cup/match/:id` | `components/selectedMatchDrawer.jsx` | `SelectedMatchDrawer` | `selectedMatchDrawer.css` |

⚠️ Header navigates to `/Stickerbook` (capital S) — intentional, matches route exactly.

---

## Design System — "Liquid Glass Arena"

### Google Fonts Import (top of App.css)
```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
```

### CSS Custom Properties (:root in App.css) — Complete Token List

```css
/* Typography */
--font-display: 'Bebas Neue', 'Impact', sans-serif;
--font-body:    'DM Sans', 'Segoe UI', system-ui, sans-serif;

/* Backgrounds */
--bg-deep: #060a14;   --bg-deep-alt: #0a0f1e;
--bg-mid: #0f172a;    --bg-surface: #141e36;
--bg-surface-2: #1a253e;  --bg-hover: #1e2c48;

/* Glass layers */
--glass-0: rgba(255,255,255,0.02);   --glass-1: rgba(255,255,255,0.05);
--glass-2: rgba(255,255,255,0.08);   --glass-3: rgba(255,255,255,0.12);
--glass-4: rgba(255,255,255,0.18);
--glass-dark: rgba(0,0,0,0.35);      --glass-dark-heavy: rgba(0,0,0,0.55);

/* Gold palette */
--gold-bright: #ffd700;  --gold-mid: #f0c040;
--gold-warm: #c8a84b;    --gold-deep: #8b6914;  --gold-pale: #fde68a;

/* Gold glows */
--gold-glow-sm: 0 0 10px rgba(255,215,0,0.3);
--gold-glow-md: 0 0 20px rgba(255,215,0,0.5);
--gold-glow-lg: 0 0 40px rgba(255,215,0,0.7);
--gold-glow-text: 0 0 15px rgba(255,215,0,0.5);

/* Orange accent */
--orange: #ff6b35;  --orange-mid: #f55a20;
--orange-glow: 0 0 15px rgba(255,107,53,0.4);

/* Text hierarchy */
--text-primary: rgba(255,255,255,1.0);   --text-secondary: rgba(255,255,255,0.82);
--text-muted: rgba(255,255,255,0.55);    --text-ghost: rgba(255,255,255,0.30);

/* Borders */
--border-subtle: rgba(255,255,255,0.06);   --border-default: rgba(255,255,255,0.12);
--border-strong: rgba(255,255,255,0.22);
--border-gold: rgba(255,215,0,0.30);       --border-gold-mid: rgba(255,215,0,0.55);
--border-gold-bright: rgba(255,215,0,0.85);  --border-orange: rgba(255,107,53,0.45);

/* Radius scale */
--r-xs: 4px;  --r-sm: 8px;  --r-md: 12px;
--r-lg: 16px; --r-xl: 24px; --r-2xl: 32px;  --r-pill: 9999px;

/* Shadow scale */
--shadow-sm: 0 2px 8px rgba(0,0,0,0.35);
--shadow-md: 0 6px 20px rgba(0,0,0,0.50);
--shadow-lg: 0 12px 40px rgba(0,0,0,0.65);
--shadow-xl: 0 24px 60px rgba(0,0,0,0.75);
--shadow-gold: 0 8px 30px rgba(255,215,0,0.20);
--shadow-gold-strong: 0 12px 40px rgba(255,215,0,0.38);

/* Spacing scale */
--space-xs: 0.25rem;  --space-sm: 0.5rem;  --space-md: 1rem;
--space-lg: 1.5rem;   --space-xl: 2rem;    --space-2xl: 3rem;  --space-3xl: 4rem;

/* 3D perspective */
--perspective-near: 600px;   --perspective-mid: 1000px;
--perspective-far: 1800px;   --perspective-book: 2400px; /* stickerbook — DO NOT change */

/* Transitions */
--ease-out-expo: cubic-bezier(0.16,1,0.3,1);
--ease-in-out:   cubic-bezier(0.45,0.05,0.55,0.95);
--ease-spring:   cubic-bezier(0.34,1.56,0.64,1);
--ease-smooth:   cubic-bezier(0.4,0,0.2,1);
--t-fast: 0.15s;  --t-base: 0.25s;  --t-slow: 0.45s;  --t-page: 0.6s;

/* Layout */
--max-width: 1200px;  --max-width-wide: 1500px;  --header-height: 68px;
```

### Global @keyframes (App.css — shared)

| Name | Purpose |
|------|---------|
| `fadeInUp` | Page content entrance: opacity 0→1, translateY(30px)→0 |
| `glassShimmer` | Left→right light sweep on glass `::before` pseudo-elements |
| `goldPulse` | Breathing box-shadow glow on highlighted/winning elements |
| `float` | Ambient background orb float: translateY(0)↔translateY(-20px) |

### Reusable CSS Recipes

**Liquid Glass Card:**
```css
background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,215,0,0.02) 100%);
backdrop-filter: blur(16px) saturate(180%) brightness(1.05);
border: 1px solid var(--border-default);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.4);
border-radius: var(--r-md);
```

**Page Background (3-layer, all pages):**
```css
background:
  radial-gradient(ellipse 80% 50% at 20% -10%, rgba(255,215,0,0.05) 0%, transparent 60%),
  radial-gradient(ellipse 60% 40% at 80% 110%, rgba(255,107,53,0.04) 0%, transparent 60%),
  linear-gradient(160deg, var(--bg-deep) 0%, #0d1529 50%, var(--bg-mid) 100%);
```

**3D Card Hover:**
```css
/* Container: */ perspective: var(--perspective-far);
/* Card hover: */ transform: translateY(-6px) perspective(var(--perspective-near)) rotateX(3deg) scale(1.02);
```

**Gold 3D Button:**
```css
background: linear-gradient(135deg, var(--gold-warm), var(--gold-bright));
box-shadow: 0 6px 0 var(--gold-deep), 0 10px 30px rgba(255,215,0,0.28);
/* :active: */ transform: translateY(4px); box-shadow: 0 2px 0 var(--gold-deep);
```

**Gradient Heading Text:**
```css
background: linear-gradient(135deg, var(--text-primary) 30%, var(--gold-warm) 65%, var(--gold-bright) 100%);
-webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
```

### Critical: Stickerbook 3D CSS (NEVER MODIFY)
```css
.book-scene { perspective: 2400px; }
.book-container { transform-style: preserve-3d; }
.right-book-page.flipper {
  transform-origin: left center;
  transform-style: preserve-3d;
  transition: transform 0.62s cubic-bezier(0.45,0.05,0.55,0.95);
}
.flipper.flipping-forward  { transform: rotateY(-180deg); }
.flipper.flipping-backward { transform: rotateY(180deg); }
.flipper-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.flipper-back { transform: rotateY(180deg); }
/* Mobile (<=740px): axis changes to rotateX — also UNTOUCHED */
/* Paper colors (keep): .book-page/.page-inner background: #faf6f0; .blank-page: #f5f0e8 */
/* Cover (keep): crimson #8B0000/#C41E3A; spine: #5d2e0c/#8B4513 */
```

---

## Page Components

### home.jsx — `Welcome`
- **State:** none (stateless)
- **API:** none
- **Key classes:** `hero-container`, `hero-content`, `hero-title`, `hero-subtext`, `hero-button`

### teams.jsx — `Teams`
- **State:** `selectedTeam`, `isPanelVisible`, `searchTerm`, `selectedContinent`, `viewMode` ('dropdown'|'grid'), `sortBy`, `favoriteTeams` (localStorage), `recentlyViewed` (localStorage, max 5), `hoveredTeam`, `selectedTeamsForComparison` (max 3), `showFavoritesOnly`
- **Data source:** `teamsByContinent` from `../data/teamInfo` — Europe(22), SouthAmerica(10), NorthAmerica(10), Africa(15), Asia(12), Oceania(1) = 70 total teams
- **API:** none
- **Sub-components:** `TeamSlidePanel`, `ContinentDropdown`
- **Key classes:** `teams-page`, `teams-header`, `teams-controls`, `search-input`, `continent-filter`, `sort-select`, `favorites-toggle`, `view-toggle`, `recently-viewed`, `comparison-bar`, `teams-content`, `teams-dropdowns`, `teams-grid`, `team-card`, `team-card-header`, `team-card-actions`, `quick-stats-tooltip`, `no-teams-found`

### teamDetailPages.jsx — `TeamDetailPage`
- **Route param:** `teamId` via `useParams`
- **State:** none | **API:** none
- **Description:** Minimal — displays `name` + `fullHistory` from teamInfo. Candidate for expansion.

### worldCup2026.jsx — `WorldCup2026`
- **State:** `currentStat` (index 0-3, rotates every 2s), `countdown` ({days, hours, minutes, seconds} until 2026-06-11T00:00:00)
- **API:** none
- **Stats:** 48 Teams → 104 Matches → 16 Cities → 3 Countries
- **Key classes:** `worldcup2026-page`, `header-section`, `tournament-badge`, `host-countries`, `subtitle`, `stats-carousel`, `stat-display`, `stat-number`, `stats-label`, `button-section`, `open-packs-button`, `view-tournament-button`, `countdown-section`, `countdown-display`, `countdown-unit`, `countdown-number`, `countdown-label`, `countdown-separator`

### clubWorldCup.jsx — `ClubWorldCup`
- **State:** `upcomingMatches`, `liveMatches`, `activeTab` ('live'|'upcoming'), `selectedGroup`, `isLoading`, `selectedMatch`, `isDrawerOpen`
- **API:**
  - `GET /upcoming_matches`
  - `GET /live_scores`
  - `GET /match/{eventId}`
- **Icons (lucide):** Trophy, Calendar, Users, Play, Clock, ChevronRight, Star
- **Key classes:** `dynamic-club-world-cup-page`, `hero-section`, `hero-title`, `stats-bar`, `stat-item`, `tab-navigation`, `tab-button`, `active-live`, `active-upcoming`, `inactive`, `matches-grid`, `match-card`, `live`, `upcoming`, `match-header`, `match-status`, `score-display`, `score-number`, `groups-grid`, `group-card`, `selected`, `group-header`, `group-title`, `group-chevron`, `rotated`, `teams-container`, `expanded`, `collapsed`, `team-item`, `prediction-section`, `prediction-button`, `loading-container`, `loading-spinner`

### clubWorldCupPredict.jsx — `ClubWorldCupPredict`
- **State:** `favoriteTeam`, `strategy` ('ml'|'random'), `results`, `clubGroups`, `allTeams`, `lineRenderTrigger`, `hasSimulated`, `matchRefs` (useRef), `containerRef` (useRef)
- **HTTP:** axios
- **API:**
  - `GET /get_club_groups`
  - `POST /simulate_bracket` — body: `{favorite_team, strategy}`
- **Framer Motion:** `motion.div` with variants + transitions on round columns
- **SVG fix:** `.bracket-svg path { stroke: rgba(255,215,0,0.25) !important; }` — overrides inline `stroke="#aaa"` without touching JSX
- **Key classes:** `bracket-page`, `bracket-title`, `input-section`, `strategy-toggle`, `reset-button`, `group-stage`, `group-grid`, `group-card`, `group-table`, `group-header`, `group-row`, `advancing`, `bracket-container`, `bracket-svg`, `rounds-layout`, `symmetrical`, `bracket-half`, `left-half`, `right-half`, `center-final`, `round`, `round-label`, `match-box`, `highlight`, `match-text`, `winner`, `path`

### stickerbook.jsx — `Stickerbook`
- **State:** `mode` ('cover'|'album'), `teams`, `currentIndex` (spread index, steps by 2), `pageDataCache`, `progress` ({filled_slots, total_slots}), `isFlipping`, `flipDir` ('idle'|'forward'|'backward'|'reset'), `error`, `loading`, `flipTimerRef` (useRef)
- **Session ID:** `'test-user'` (hardcoded)
- **API:**
  - `GET /wc2026/teams` — header: `session-id`
  - `GET /wc2026/my_progress` — header: `session-id`
  - `GET /wc2026/team/{teamId}` — header: `session-id`
- **Flags:** `https://flagcdn.com/w80/{isoCode}.png` — large country→ISO code map inside component
- **3D classes (NEVER modify):** `book-scene`, `book-container`, `flipper`, `flipper-face`, `flipper-front`, `flipper-back`, `flipping-forward`, `flipping-backward`, `no-transition`
- **UI classes:** `stickerbook-page`, `album-cover`, `cover-bg`, `album-topbar`, `album-back-btn`, `album-topbar-title`, `album-progress-bar-wrap`, `album-progress-fill`, `book-spine`, `nav-btn`, `nav-prev`, `nav-next`, `page-inner`, `blank-page`, `page-header`, `page-flag`, `page-country-name`, `page-federation`, `page-conf-badge`, `page-body`, `player-grid`, `player-slot`, `placed`, `empty`, `pending`, `slot-photo-wrap`, `slot-photo`, `slot-label`, `slot-num`, `slot-name`, `slot-pos`, `slot-empty-inner`, `legend-slot`, `legend-slot-header`, `legend-card-content`, `legend-empty-content`, `silhouette-placeholder`, `page-counter`, `country-index`, `country-index-btn`, `active-btn`, `tbd-btn`, `tbd-page`

### OpenPacksGame.jsx — `OpenPackGame`
- **State:** `phase` ('idle'|'opening'|'revealed'), `cards`, `addedIds` (Set), `pendingIds` (Set), `showSparkles`, `error`, `allAddedToAlbum`
- **Session ID:** `'test-user'` (hardcoded)
- **API:**
  - `GET /wc2026/open_pack` — header: `session-id`
  - `POST /wc2026/place_sticker` — body: `{player_id}`, header: `session-id`
- **Framer Motion:** `motion.div`, `motion.img` — pack opening scale/rotation + stagger card reveal
- **Position colors:** GK `#f39c12`, DEF `#2980b9`, MID `#27ae60`, FWD `#e74c3c`
- **Pack card bg:** Warm cream `linear-gradient(180deg, #fdfaf5, #f5f0e8)` — intentional physical card feel, NOT glass
- **Key classes:** `open-pack-container`, `pack-page-title`, `pack-page-subtitle`, `pack-section`, `foil-pack-img`, `cards-section`, `pack-stats`, `stat-legend`, `stat-new`, `stat-dup`, `card-reveal-wrapper`, `pack-card`, `legend-card`, `added-card`, `legend-shimmer`, `pack-card-header`, `card-legend-badge`, `card-position-badge`, `pack-card-photo`, `card-photo-img`, `card-silhouette`, `pack-card-info`, `card-player-name`, `card-country`, `card-legend-years`, `card-legend-desc`, `pack-card-action`, `card-status-tag`, `just-added`, `duplicate`, `add-to-album-btn`, `btn-spinner`, `pack-actions`, `add-all-btn`, `open-pack-btn`, `reset-btn`, `sparkles-container`, `sparkle`

---

## Shared Components

### header.jsx — `Header`
- **Nav links:** `/` `/teams` `/club-world-cup` `/world-cup-2026` `/Stickerbook`
- **Logo:** `/world_cup.png`
- **Auth buttons:** Sign In + Create Account — NOT wired to backend yet
- **Key classes:** `navbar`, `logo-button`, `nav-links`, `nav-buttons`, `sign-in`, `create-account`

### teamSlidePanel.jsx — `TeamSlidePanel`
- **Props:** `team` (name, history, colors[]), `onClose`, `isVisible`
- **Classes:** `slide-panel`, `slide-in`, `slide-out`
- Uses inline gradient from `team.colors`

### selectedMatchDrawer.jsx — `SelectedMatchDrawer`
- **Props:** `match` (API object), `onClose`
- **Icons (lucide):** X, Clock, MapPin, Calendar, Play, Users, Target, AlertCircle, Trophy, Activity
- **Sections:** score, match-info-grid, stats, goals, lineup, video (YouTube iframe), description
- **Key classes:** `drawer-overlay`, `drawer`, `drawer-header`, `header-content`, `drawer-title`, `close-button`, `drawer-body`, `score-section`, `team-score`, `score`, `match-image-container`, `match-info-grid`, `info-card`, `stats-section`, `stats-grid`, `stat-row`, `goals-section`, `lineup-section`, `video-section`, `description-section`

### ContinentDropdown.jsx — `ContinentDropdown`
- **Props:** `continent`, `teams` (array), `onSelectTeam` (callback)
- Used only in Teams.jsx dropdown view mode

---

## Backend API Endpoints

**Base URL:** `process.env.REACT_APP_BACKEND_URL` || `http://localhost:5001`

### Match Prediction & Simulation

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/predict_match` | `{team1_elo, team2_elo}` | `{winner: "team1"\|"team2"}` |
| POST | `/simulate_bracket` | `{favorite_team, strategy: "ml"\|"random"}` | Full tournament results |
| POST | `/simulate_group` | `{favorite_team, strategy}` | Group stage results |
| GET | `/get_club_groups` | — | JSON from `club_wc_2025_groups.json` |

### Live Data (TheSportsDB)

| Method | Path | Returns |
|--------|------|---------|
| GET | `/live_scores` | 5 most recent events (EST formatted) |
| GET | `/upcoming_matches` | Future matches (EST formatted) |
| GET | `/match/<event_id>` | Full match details object |

### WC 2026 Sticker Album (primary)

| Method | Path | Header | Body | Returns |
|--------|------|--------|------|---------|
| GET | `/wc2026/teams` | `session-id` | — | 48 teams array |
| GET | `/wc2026/team/<team_id>` | `session-id` | — | Team + 23 player slots |
| GET | `/wc2026/my_progress` | `session-id` | — | Per-team fill stats |
| GET | `/wc2026/open_pack` | `session-id` | — | 5 cards (5% legend), 20/day limit |
| POST | `/wc2026/place_sticker` | `session-id` | `{player_id}` | Success / duplicate |

### Club WC Sticker Album (original)

| Method | Path | Returns |
|--------|------|---------|
| GET | `/open_pack` | Pack cards (IP/header session tracked) |
| POST | `/save_cards` | Confirmation |
| GET | `/my_stickerbook` | User's cards |

---

## Backend Modules

### model.py
```python
# Features: home_rank, away_rank, rank_diff, stage_encoded
# 80/20 train/test split, random_state=42
def train_model() -> LogisticRegression
def predict_match(model, team1_elo, team2_elo) -> "team1"|"team2"
```

### simulate_bracket.py
```python
# Groups (W/D/L tracking) → R16 → QF → SF → Final
# ML mode: 20% draw probability
def simulate_tournament(favorite_team=None, strategy="ml") -> dict
```

### wc2026_stickerbook.py
```python
# SQLite tables: wc2026_teams, wc2026_players, wc2026_album, wc2026_packs
def get_all_teams()                           # 48 teams (confirmed + TBD)
def get_team_page(team_id, user_id) -> dict
def place_sticker(user_id, player_id) -> dict # includes duplicate flag
def get_album_progress(user_id) -> dict
def open_wc2026_pack(user_id) -> list         # 5 cards, 5% legend drop rate
```

---

## Static Data

### frontend/src/data/teamInfo.js
```javascript
// teamsByContinent object
// Each team: { id, name, colors: ['#hex1', '#hex2'], history: string, fullHistory: string }
// Europe(22), SouthAmerica(10), NorthAmerica(10), Africa(15), Asia(12), Oceania(1) = 70 teams
```

### backend/data/club_wc_2025_groups.json
Club WC group structure — Groups A–H, 4 teams each. Served by `GET /get_club_groups`.

### backend/data/stickerbook.db
Shared SQLite for both albums. WC 2026 tables prefixed `wc2026_*`.

---

## Key Patterns & Gotchas

### API Call Pattern
```javascript
const backendUrl = process.env.REACT_APP_BACKEND_URL; // fallback: 'http://localhost:5001'

// fetch API (stickerbook pages):
const res = await fetch(`${backendUrl}/wc2026/teams`, {
  headers: { 'session-id': 'test-user' }
});
const data = await res.json();

// axios (bracket/predict pages):
const res = await axios.post(`${backendUrl}/simulate_bracket`, { favorite_team, strategy });
```

### State Patterns
- **localStorage** (Teams page): `favoriteTeams` + `recentlyViewed`
- **No global state:** No Redux/Zustand/Context — all component-local `useState` + props
- **Session ID:** hardcoded `'test-user'` — no real auth system yet

### Framer Motion Pattern
```javascript
// Stagger reveal (OpenPacksGame, ClubWorldCupPredict):
<motion.div variants={cardVariants} initial="hidden" animate="visible" custom={index} />
// Hover + tap interactions:
<motion.img whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} />
```

### Intentional Quirks (do NOT "fix" these)
- `header.jsx` navigates to `/Stickerbook` with capital S — matches route in App.js exactly
- Pack cards use cream `#fdfaf5/#f5f0e8` background — intentional physical card aesthetic, NOT glass
- Album cover is crimson `#8B0000/#C41E3A` — intentional classic sticker album look
- `clubBracket.css` is the stylesheet for `/club-world-cup/predict` (not `clubWorldCupPredict.css`)
- Frontend `package.json` proxy points to `:5000`, but backend runs on `:5001` — resolved via `REACT_APP_BACKEND_URL`

---

## Dev Commands

```bash
# Frontend
cd frontend
npm install
npm start          # → localhost:3000, proxies API to :5000 (override with REACT_APP_BACKEND_URL)
npm run build      # production build → /build/

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python app.py       # → localhost:5001

# Required env vars:
# frontend/.env  →  REACT_APP_BACKEND_URL=http://localhost:5001
# backend/.env   →  SPORTSDB_API_KEY=<key>   PORT=5001
```

---

## Component Hierarchy

```
App.js
├── Header (rendered on every route)
└── Routes
    ├── Welcome (/)
    ├── Teams (/teams)
    │   ├── TeamSlidePanel
    │   └── ContinentDropdown
    ├── TeamDetailPage (/teams/:teamId)
    ├── WorldCup2026 (/world-cup-2026)
    ├── ClubWorldCup (/club-world-cup)
    │   └── SelectedMatchDrawer
    ├── ClubWorldCupPredict (/club-world-cup/predict)
    ├── Stickerbook (/stickerbook)
    └── OpenPackGame (/open-packs)
```
