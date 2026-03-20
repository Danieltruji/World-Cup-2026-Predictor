# World Cup 2026 Predictor — Project Reference
> Last updated: 2026-03-19  |  Branch: `adding-login/signup-miragting-supabaseDB-to-add-real-users`
> Remote: https://github.com/Danieltruji/World_Cup_2026_Predictor.git

---

## Tech Stack

### Frontend (Vercel)
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.1.0 |
| Routing | React Router DOM | 7.6.2 |
| Animation | Framer Motion | 12.18.1 |
| Icons | Lucide React | 0.536.0 |
| HTTP | Axios + fetch API | 1.10.0 |
| Fonts | Bebas Neue + DM Sans | Google Fonts |
| Flags | flagcdn.com | Public CDN |

### Backend (Render)
| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Flask + Python 3 | gunicorn in prod |
| Auth tokens | Flask-JWT-Extended | Access (1hr) + Refresh (30d) |
| Password hashing | werkzeug.security | Bundled with Flask |
| DB driver | psycopg2-binary | PostgreSQL |
| ML model | scikit-learn LogisticRegression | Trained on club WC data |
| Timezone | pytz | UTC → US/Eastern |
| HTTP client | requests | TheSportsDB + API-Football calls |

### Database (Supabase)
| Layer | Technology | Notes |
|-------|-----------|-------|
| Database | PostgreSQL | Hosted on Supabase free tier |
| Previously | SQLite (`stickerbook.db`) | Migrating to Supabase |

### External APIs
| API | Base URL | Key Env Var | Used For |
|-----|----------|-------------|---------|
| TheSportsDB | `https://www.thesportsdb.com/api/v1/json/` | `SPORTSDB_API_KEY` | Live scores, upcoming matches, match details (league 4503) |
| API-Football | `https://v3.football.api-sports.io` | `API_SPORTS_KEY` | WC 2026 squad data — one-time setup script only |
| RapidAPI | — | `X_RAPIDAPI_KEY` | ⚠️ Loaded in .env but NOT used anywhere |
| flagcdn.com | `https://flagcdn.com` | none | Country flag images (frontend only) |

**API-Football note:** Only called from `fetch_wc2026_squads.py` (one-time population script). Free tier = 10 req/min; script enforces 7s delay. NOT called from any live route.

**Deployment ports:**
- Frontend proxy: `localhost:3000` → `localhost:5000` (package.json, overridden by env var)
- Backend: `5001` default (`PORT` env var)
- Claude Code preview: `.claude/launch.json` → `preview_start "World Cup 2026 Predictor"` → port 3000

---

## Deployment Environment Variables

### Render (backend)
```
DATABASE_URL      = postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres
JWT_SECRET_KEY    = your-long-random-secret-string
SPORTSDB_API_KEY  = your-key
API_SPORTS_KEY    = your-api-football-key
FRONTEND_URL      = https://your-app.vercel.app
PORT              = 5001
```

### Vercel (frontend)
```
REACT_APP_BACKEND_URL = https://your-api.onrender.com
```

---

## Directory Structure

```
World_Cup_2026_Predictor/
├── frontend/
│   ├── src/
│   │   ├── App.js                              ← Router + layout root
│   │   ├── App.css                             ← ALL design tokens (:root) + global keyframes
│   │   ├── index.js                            ← ReactDOM.createRoot entry point
│   │   ├── context/                            ← (NEW) Global React Context providers
│   │   │   ├── TeamContext.jsx                 ← Selected WC nation (home → header)
│   │   │   └── AuthContext.jsx                 ← JWT auth state + getSessionId()
│   │   ├── utils/                              ← (NEW) Shared utilities
│   │   │   └── countryFlags.js                 ← COUNTRY_CODE_MAP + getFlagUrl()
│   │   ├── components/
│   │   │   ├── header.jsx                      ← Sticky glassmorphic navbar
│   │   │   ├── ContinentDropdown.jsx           ← Continent select (Teams page)
│   │   │   ├── selectedMatchDrawer.jsx         ← Slide-in match detail drawer
│   │   │   └── teamSlidePanel.jsx              ← Team info slide panel
│   │   ├── pages/
│   │   │   ├── home.jsx                        ← Route: /
│   │   │   ├── teams.jsx                       ← Route: /teams
│   │   │   ├── teamDetailPages.jsx             ← Route: /teams/:teamId
│   │   │   ├── clubWorldCup.jsx                ← Route: /club-world-cup
│   │   │   ├── clubWorldCupPredict.jsx         ← Route: /club-world-cup/predict
│   │   │   ├── worldCup2026.jsx                ← Route: /world-cup-2026
│   │   │   ├── stickerbook.jsx                 ← Route: /stickerbook
│   │   │   ├── OpenPacksGame.jsx               ← Route: /open-packs
│   │   │   ├── AuthModal.jsx                   ← (NEW) Login/Register modal
│   │   │   └── stylesheets/
│   │   │       ├── header.css                  (190 lines)
│   │   │       ├── home.css                    (187 lines)
│   │   │       ├── teams.css                   (745 lines)
│   │   │       ├── teamDetailPages.css         (83 lines)
│   │   │       ├── clubWorldCup.css            (683 lines)
│   │   │       ├── clubBracket.css             (434 lines) ← predict page CSS
│   │   │       ├── groupStage.css              (189 lines)
│   │   │       ├── worldcup2026.css            (419 lines)
│   │   │       ├── stickerbook.css             (1020 lines)
│   │   │       ├── openPacksGame.css           (555 lines)
│   │   │       ├── selectedMatchDrawer.css     (517 lines)
│   │   │       └── authModal.css               ← (NEW) Auth modal styles
│   │   └── data/
│   │       └── teamInfo.js                     ← Static team data by continent
│   └── package.json
├── backend/
│   ├── app.py                                  ← Flask entry point + all 15 API routes
│   ├── auth.py                                 ← (NEW) Auth Blueprint: register/login/refresh/me
│   ├── requirements.txt
│   ├── model.py                                ← LogisticRegression match predictor
│   ├── simulate_bracket.py                     ← Full tournament simulation
│   ├── stickerbook.py                          ← Club WC album logic
│   ├── wc2026_stickerbook.py                   ← WC 2026 album logic
│   ├── wc2026_model.py                         ← GradientBoosting ML model for WC2026 predictions
│   ├── wc2026_simulate.py                      ← 48-team tournament simulation engine
│   ├── scrape_wc_history.py                    ← One-time: generates historical WC match CSV
│   ├── db_setup.py                             ← DB initializer (SQLite → PostgreSQL migration)
│   ├── wc2026_db_setup.py                      ← WC 2026 table setup
│   ├── fetch_wc2026_squads.py                  ← ONE-TIME script: populates players via API-Football
│   ├── utils/
│   │   ├── bracket_utils.py                    (empty placeholder)
│   │   ├── feature_engineering.py              ← Merges FIFA ranks + match data → CSV
│   │   ├── predictor.py                        (empty placeholder)
│   │   └── scraper.py                          (empty placeholder)
│   └── data/
│       ├── stickerbook.db                      ← SQLite (migrating to Supabase PostgreSQL)
│       ├── wc2026_groups.json                  ← 12 confirmed groups (48 teams + FIFA ranks)
│       ├── wc2026_historical_matches.csv       ← 256 matches from 2010-2022 World Cups
│       ├── club_wc_2025_groups.json            ← Club WC group structure (8 groups, 4 teams each)
│       ├── club_wc_features.csv                ← ML training data (28 historical matches)
│       ├── club_world_cup_raw.csv              ← Raw club WC match data (2020-2023)
│       ├── fifa_ranks.csv                      ← 37 teams with FIFA rank numbers
│       └── wc2026_data.py                      ← 21KB: 42 confirmed teams + 6 TBD + all legends
├── .claude/
│   └── launch.json                             ← preview_start config (port 3000)
└── PROJECT_REFERENCE.md                        ← This file
```

---

## Frontend Routes

| URL Path | Component | Export | Primary CSS |
|----------|-----------|--------|-------------|
| `/` | `pages/home.jsx` | `Welcome` | `home.css` |
| `/teams` | `pages/teams.jsx` | `Teams` | `teams.css` |
| `/teams/:teamId` | `pages/teamDetailPages.jsx` | `TeamDetailPage` | `teamDetailPages.css` |
| `/club-world-cup` | `pages/clubWorldCup.jsx` | `ClubWorldCup` | `clubWorldCup.css` |
| `/club-world-cup/predict` | `pages/clubWorldCupPredict.jsx` | `ClubWorldCupPredict` | `clubBracket.css` + `groupStage.css` |
| `/world-cup-2026` | `pages/worldCup2026.jsx` | `WorldCup2026` | `worldcup2026.css` |
| `/world-cup-2026/predict` | `pages/WorldCup2026Predict.jsx` | `WorldCup2026Predict` | `wc2026Bracket.css` |
| `/stickerbook` | `pages/stickerbook.jsx` | `Stickerbook` | `stickerbook.css` |
| `/open-packs` | `pages/OpenPacksGame.jsx` | `OpenPackGame` | `openPacksGame.css` |

⚠️ Header navigates to `/Stickerbook` (capital S) — intentional, matches route in App.js exactly.

---

## Backend API Endpoints (all 15 + 4 new auth)

**Base URL:** `process.env.REACT_APP_BACKEND_URL` || `http://localhost:5001`

### Auth (NEW)
| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/auth/register` | `{username, email, password}` | `{access_token, refresh_token, user}` |
| POST | `/auth/login` | `{email, password}` | `{access_token, refresh_token, user}` |
| POST | `/auth/refresh` | — (Bearer refresh token) | `{access_token}` |
| GET | `/auth/me` | — (Bearer access token) | `{id, username, email, created_at}` |

### Match Prediction & Simulation
| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/predict_match` | `{team1_elo, team2_elo}` | `{winner: "team1"\|"team2"}` |
| POST | `/simulate_bracket` | `{favorite_team, strategy: "ml"\|"random"}` | Full tournament results object |
| POST | `/simulate_group` | `{favorite_team, strategy}` | Group stage results |
| GET | `/get_club_groups` | — | JSON from `club_wc_2025_groups.json` |

### Live Data (TheSportsDB — league 4503)
| Method | Path | Returns |
|--------|------|---------|
| GET | `/live_scores` | Last 5 Club WC events (UTC→EST formatted) |
| GET | `/upcoming_matches` | Future Club WC fixtures (UTC→EST formatted) |
| GET | `/match/<event_id>` | Full match detail object |

### WC 2026 Prediction Bracket (NEW)
| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/wc2026/groups` | — | 12 groups from `wc2026_groups.json` (48 teams with ranks, confederations, WC titles) |
| POST | `/wc2026/simulate` | `{strategy: "ml"\|"random", your_team?, seed?}` | Full tournament results: group stage, 3rd-place ranking, R32→R16→QF→SF→Final knockout bracket, your_team_path |
| POST | `/wc2026/match_detail` | `{team1, team2, stage}` | Detailed match prediction with base prediction + 5 alternative outcomes |

### WC 2026 Sticker Album
| Method | Path | Header | Body | Returns |
|--------|------|--------|------|---------|
| GET | `/wc2026/teams` | `session-id` | — | 48 teams array |
| GET | `/wc2026/team/<team_id>` | `session-id` | — | Team + 23 player slots + legend |
| GET | `/wc2026/my_progress` | `session-id` | — | Overall + per-team completion stats |
| GET | `/wc2026/open_pack` | `session-id` | — | 5 cards (5% legend chance), 20/day limit |
| POST | `/wc2026/place_sticker` | `session-id` | `{player_id}` | `{success}` or `{duplicate}` |

### Club WC Sticker Album (original system)
| Method | Path | Returns |
|--------|------|---------|
| GET | `/open_pack` | 5 club player cards (rarity: 70% common, 25% rare, 5% legendary) |
| POST | `/save_cards` | Saves to `collected_cards` table |
| GET | `/my_stickerbook` | All user's collected club cards |

---

## Database Schema (PostgreSQL on Supabase)

> Previously SQLite `stickerbook.db` — migrating to Supabase PostgreSQL.
> All `?` placeholders → `%s`, `sqlite3` → `psycopg2`, `AUTOINCREMENT` → `SERIAL`

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | SERIAL PK | |
| `session_id` | TEXT | Legacy session tracking, indexed |
| `username` | TEXT UNIQUE | NEW — auth |
| `email` | TEXT UNIQUE | NEW — auth |
| `password_hash` | TEXT | NEW — werkzeug hash |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `is_active` | INTEGER | DEFAULT 1 |
| `packs_opened_today` | INTEGER | Pack limit tracking |
| `last_opened` | DATE | Daily reset reference |

### `wc2026_teams`
| Column | Type | Notes |
|--------|------|-------|
| `id` | SERIAL PK | |
| `name` | TEXT UNIQUE | e.g. "Brazil" |
| `api_team_id` | INTEGER | From API-Football |
| `confederation` | TEXT | CAF/UEFA/CONMEBOL/AFC/OFC/CONCACAF |
| `federation` | TEXT | |
| `status` | TEXT | 'confirmed' or 'tbd' |
| `tbd_description` | TEXT | |
| `tbd_teams_json` | TEXT | JSON array of possible teams |
| `tbd_detail` | TEXT | |
| `playoff_date` | TEXT | |

### `wc2026_players`
| Column | Type | Notes |
|--------|------|-------|
| `id` | SERIAL PK | |
| `team_id` | INTEGER FK | → wc2026_teams |
| `api_player_id` | INTEGER | From API-Football |
| `name` | TEXT | |
| `position` | TEXT | GK/DEF/MID/FWD |
| `shirt_number` | INTEGER | |
| `photo_url` | TEXT | From API-Football CDN |
| `slot_number` | INTEGER | Sequential 1→N per team; 0 = legend |
| `is_legend` | INTEGER | 0 or 1 |
| `legend_description` | TEXT | |
| `legend_years` | TEXT | e.g. "1994–2006" |

### `user_album` (WC 2026 stickers placed)
| Column | Type | Notes |
|--------|------|-------|
| `id` | SERIAL PK | |
| `user_id` | INTEGER FK | → users |
| `player_id` | INTEGER FK | → wc2026_players |
| `placed_at` | TIMESTAMP | DEFAULT NOW() |
| UNIQUE | (user_id, player_id) | Prevents duplicates |

### `collected_cards` (Club WC album — original)
| Column | Type | Notes |
|--------|------|-------|
| `id` | SERIAL PK | |
| `user_id` | INTEGER FK | → users |
| `player_id` | INTEGER FK | → players |
| `rarity` | TEXT | 'common', 'rare', 'legendary' |
| `timestamp` | TIMESTAMP | |

### `players` (Club WC players — original)
| Column | Type | Notes |
|--------|------|-------|
| `id` | SERIAL PK | |
| `name` | TEXT | |
| `country` | TEXT | |
| `image_url` | TEXT | |
| `club` | TEXT | |
| `flag_url` | TEXT | |

---

## Backend Modules

### `app.py`
- Flask entry point + all 15 routes (+ 4 auth via blueprint)
- CORS: `FRONTEND_URL` env var restricts to Vercel domain in production
- JWTManager registered here
- `auth_bp` blueprint registered at `/auth`

### `auth.py` (NEW)
```python
# Blueprint: url_prefix='/auth'
# POST /auth/register  — werkzeug.generate_password_hash, returns JWT pair
# POST /auth/login     — werkzeug.check_password_hash, returns JWT pair
# POST /auth/refresh   — @jwt_required(refresh=True), returns new access_token
# GET  /auth/me        — @jwt_required(), returns user row
```

### `model.py`
```python
# Features: home_rank, away_rank, rank_diff, stage_encoded (1-5)
# Training: 80/20 split, random_state=42 on club_wc_features.csv
def train_model() -> LogisticRegression
def predict_match(model, team1_elo, team2_elo) -> "team1" | "team2"
```

### `simulate_bracket.py`
```python
# Group stage (W/D/L) → R16 → QF → SF → Final
# ML mode: uses predict_match(); 20% draw probability
# Random mode: random.choice()
def simulate_tournament(favorite_team=None, strategy="ml") -> dict
```

### `wc2026_model.py` (NEW — Prediction Bracket)
```python
def train_wc2026_model()                       # GradientBoostingClassifier on 256 historical WC matches
def predict_wc_match(model, t1, t2, stage)     # 3-class prediction (win/draw/loss) + Poisson scores
def predict_wc_match_with_variance(model, t1, t2, stage, seed)  # Same + seeded jitter for regeneration
```
Features: home_rank, away_rank, rank_diff, stage_encoded, confederation, historical WC titles.

### `wc2026_simulate.py` (NEW — Prediction Bracket)
```python
def simulate_wc2026_tournament(strategy, your_team, seed)
# Returns: group_results, third_place_ranking, knockout (R32→R16→QF→SF→3rd→Final),
#          final_winner, your_team_path, seed
```
Format: 12 groups of 4 → top 2 + 8 best 3rd → R32 (16 matches) → R16 → QF → SF → Final.
R32 uses FIFA-mapped bracket with backtracking solver for 3rd-place slot assignment.

### `wc2026_stickerbook.py`
```python
def get_all_teams()                             # 48 teams (42 confirmed + 6 TBD)
def get_team_page(team_id, user_id) -> dict     # squad + legend + user fill state
def place_sticker(user_id, player_id) -> dict   # duplicate-safe via UNIQUE constraint
def get_album_progress(user_id) -> dict         # overall + per-team completion
def open_wc2026_pack(user_id) -> list           # 5 cards, 5% legend drop rate
```

### `stickerbook.py`
```python
def get_or_create_user(session_id)              # Session-based user tracking
def open_pack(user_id)                          # 5 club player cards
def save_cards(user_id, cards_data)
def get_user_stickerbook(user_id)
def assign_rarity()                             # 70% common, 25% rare, 5% legendary
```

### `fetch_wc2026_squads.py` (ONE-TIME SETUP SCRIPT)
- Calls API-Football `/teams?name=` then `/players/squads?team=`
- Populates `wc2026_teams` + `wc2026_players` tables
- 7s delay between calls to respect free tier rate limit (10 req/min)
- Run once locally, data lives in DB permanently after that

### `utils/feature_engineering.py`
- Merges `club_world_cup_raw.csv` + `fifa_ranks.csv`
- Outputs `club_wc_features.csv` for ML training
- Run once to regenerate training data

---

## Static Data Files

### `backend/data/wc2026_data.py` (21.2 KB — most important)
```python
WC2026_CONFIRMED_TEAMS = [...]   # 42 teams, each has:
  # name, api_search_name, confederation, federation,
  # legend: { name, description, years_active }

WC2026_TBD_TEAMS = [...]         # 6 TBD playoff paths
  # UEFA Playoff Path A/B/C/D + 2 intercontinental

ALL_WC2026_TEAMS = sorted(       # Combined list of all 48
  WC2026_CONFIRMED_TEAMS + WC2026_TBD_TEAMS, key=...)
```

### `backend/data/club_wc_2025_groups.json`
8 groups (A–H), 4 club teams each. Served by `GET /get_club_groups`.

### `backend/data/club_wc_features.csv`
28 rows of historical club WC matches with: home_rank, away_rank, rank_diff, stage_encoded, winner. Used to train the LogisticRegression model.

### `frontend/src/data/teamInfo.js`
```javascript
// teamsByContinent: { Europe, SouthAmerica, NorthAmerica, Africa, Asia, Oceania }
// Each team: { id, name, colors: ['#hex1', '#hex2'], history: string, fullHistory: string }
// Total: 70 teams (different from WC 2026 48 — this is all-time/broader list)
```

---

## Design System — "Liquid Glass Arena"

### Typography
```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
--font-display: 'Bebas Neue', 'Impact', sans-serif;   /* headings, badges, labels */
--font-body:    'DM Sans', 'Segoe UI', system-ui, sans-serif; /* all body copy */
```

### CSS Custom Properties (:root in App.css) — Complete Token List
```css
/* Backgrounds */
--bg-deep: #060a14;   --bg-deep-alt: #0a0f1e;
--bg-mid: #0f172a;    --bg-surface: #141e36;
--bg-surface-2: #1a253e;  --bg-hover: #1e2c48;

/* Glass layers */
--glass-0: rgba(255,255,255,0.02);  --glass-1: rgba(255,255,255,0.05);
--glass-2: rgba(255,255,255,0.08);  --glass-3: rgba(255,255,255,0.12);
--glass-4: rgba(255,255,255,0.18);
--glass-dark: rgba(0,0,0,0.35);     --glass-dark-heavy: rgba(0,0,0,0.55);

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
--border-subtle: rgba(255,255,255,0.06);  --border-default: rgba(255,255,255,0.12);
--border-strong: rgba(255,255,255,0.22);
--border-gold: rgba(255,215,0,0.30);      --border-gold-mid: rgba(255,215,0,0.55);
--border-gold-bright: rgba(255,215,0,0.85); --border-orange: rgba(255,107,53,0.45);

/* Radius scale */
--r-xs: 4px;  --r-sm: 8px;  --r-md: 12px;
--r-lg: 16px; --r-xl: 24px; --r-2xl: 32px; --r-pill: 9999px;

/* Shadow scale */
--shadow-sm: 0 2px 8px rgba(0,0,0,0.35);
--shadow-md: 0 6px 20px rgba(0,0,0,0.50);
--shadow-lg: 0 12px 40px rgba(0,0,0,0.65);
--shadow-xl: 0 24px 60px rgba(0,0,0,0.75);
--shadow-gold: 0 8px 30px rgba(255,215,0,0.20);
--shadow-gold-strong: 0 12px 40px rgba(255,215,0,0.38);

/* Spacing scale */
--space-xs: 0.25rem; --space-sm: 0.5rem; --space-md: 1rem;
--space-lg: 1.5rem;  --space-xl: 2rem;   --space-2xl: 3rem; --space-3xl: 4rem;

/* 3D perspective */
--perspective-near: 600px;  --perspective-mid: 1000px;
--perspective-far: 1800px;  --perspective-book: 2400px; /* stickerbook — DO NOT change */

/* Transitions */
--ease-out-expo: cubic-bezier(0.16,1,0.3,1);
--ease-in-out:   cubic-bezier(0.45,0.05,0.55,0.95);
--ease-spring:   cubic-bezier(0.34,1.56,0.64,1);
--ease-smooth:   cubic-bezier(0.4,0,0.2,1);
--t-fast: 0.15s; --t-base: 0.25s; --t-slow: 0.45s; --t-page: 0.6s;

/* Layout */
--max-width: 1200px; --max-width-wide: 1500px; --header-height: 68px;
```

### Global @keyframes (App.css — shared across all pages)
| Name | Purpose |
|------|---------|
| `fadeInUp` | Page entrance: opacity 0→1, translateY(30px)→0 |
| `glassShimmer` | Left→right light sweep on glass `::before` pseudo-elements |
| `goldPulse` | Breathing box-shadow glow on highlighted elements |
| `float` | Ambient background orb: translateY(0)↔translateY(-20px) |

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
/* :active */ transform: translateY(4px); box-shadow: 0 2px 0 var(--gold-deep);
```

**Gradient Heading Text:**
```css
background: linear-gradient(135deg, var(--text-primary) 30%, var(--gold-warm) 65%, var(--gold-bright) 100%);
-webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
```

### ⚠️ Critical: Stickerbook 3D CSS (NEVER MODIFY)
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
/* Mobile (≤740px): uses rotateX instead of rotateY — also untouched */
/* Paper: .book-page/.page-inner → #faf6f0; .blank-page → #f5f0e8 */
/* Cover: crimson #8B0000/#C41E3A; spine: #5d2e0c/#8B4513 */
```

---

## Page Components

### home.jsx — `Welcome`
- **State (NEW):** `teams` (48 WC nations from API), `isLoading`, `scrollPos` (carousel translateX), `arrowHoldRef`, `scrollSpeedRef`
- **Context (NEW):** `useTeam()` → calls `setSelectedTeam` on flag click
- **API (NEW):** `GET /wc2026/teams`
- **Key classes:** `hero-container`, `hero-content`, `hero-title`, `hero-subtext`, `flag-carousel-section`, `flag-carousel-label`, `flag-carousel-wrapper`, `flag-track-viewport`, `flag-track`, `flag-circle-btn`, `flag-tooltip`, `carousel-arrow`, `cant-find-team`

### teams.jsx — `Teams`
- **State:** `selectedTeam`, `isPanelVisible`, `searchTerm`, `selectedContinent`, `viewMode` ('dropdown'|'grid'), `sortBy`, `favoriteTeams` (localStorage), `recentlyViewed` (localStorage, max 5), `hoveredTeam`, `selectedTeamsForComparison` (max 3), `showFavoritesOnly`
- **Data source:** `teamsByContinent` from `../data/teamInfo` — 70 teams across 6 continents
- **API:** none
- **Sub-components:** `TeamSlidePanel`, `ContinentDropdown`
- **Key classes:** `teams-page`, `teams-header`, `teams-controls`, `search-input`, `continent-filter`, `sort-select`, `favorites-toggle`, `view-toggle`, `recently-viewed`, `comparison-bar`, `teams-content`, `teams-dropdowns`, `teams-grid`, `team-card`, `team-card-header`, `team-card-actions`, `quick-stats-tooltip`, `no-teams-found`

### teamDetailPages.jsx — `TeamDetailPage`
- **Route param:** `teamId` via `useParams` | **State:** none | **API:** none
- Minimal — displays `name` + `fullHistory` from teamInfo. Candidate for expansion.

### worldCup2026.jsx — `WorldCup2026`
- **State:** `currentStat` (0-3, rotates every 2s), `countdown` ({days, hours, minutes, seconds} until 2026-06-11)
- **API:** none
- **Key classes:** `worldcup2026-page`, `header-section`, `tournament-badge`, `host-countries`, `subtitle`, `stats-carousel`, `stat-display`, `stat-number`, `stats-label`, `button-section`, `open-packs-button`, `view-tournament-button`, `countdown-section`, `countdown-display`, `countdown-unit`, `countdown-number`, `countdown-label`, `countdown-separator`

### clubWorldCup.jsx — `ClubWorldCup`
- **State:** `upcomingMatches`, `liveMatches`, `activeTab` ('live'|'upcoming'), `selectedGroup`, `isLoading`, `selectedMatch`, `isDrawerOpen`
- **API:** `GET /upcoming_matches`, `GET /live_scores`, `GET /match/{eventId}` (all TheSportsDB via backend)
- **Icons (lucide):** Trophy, Calendar, Users, Play, Clock, ChevronRight, Star
- **Key classes:** `dynamic-club-world-cup-page`, `hero-section`, `hero-title`, `stats-bar`, `stat-item`, `tab-navigation`, `tab-button`, `active-live`, `active-upcoming`, `inactive`, `matches-grid`, `match-card`, `live`, `upcoming`, `match-header`, `match-status`, `score-display`, `score-number`, `groups-grid`, `group-card`, `selected`, `group-header`, `group-title`, `group-chevron`, `rotated`, `teams-container`, `expanded`, `collapsed`, `team-item`, `prediction-section`, `prediction-button`, `loading-container`, `loading-spinner`

### clubWorldCupPredict.jsx — `ClubWorldCupPredict`
- **State:** `favoriteTeam`, `strategy` ('ml'|'random'), `results`, `clubGroups`, `allTeams`, `lineRenderTrigger`, `hasSimulated`, `matchRefs` (useRef), `containerRef` (useRef)
- **HTTP:** axios
- **API:** `GET /get_club_groups`, `POST /simulate_bracket`
- **Framer Motion:** `motion.div` with variants + transitions on round columns
- **SVG fix:** `.bracket-svg path { stroke: rgba(255,215,0,0.25) !important; }` overrides inline `stroke="#aaa"`
- **Key classes:** `bracket-page`, `bracket-title`, `input-section`, `strategy-toggle`, `reset-button`, `group-stage`, `group-grid`, `group-card`, `group-table`, `group-header`, `group-row`, `advancing`, `bracket-container`, `bracket-svg`, `rounds-layout`, `symmetrical`, `bracket-half`, `left-half`, `right-half`, `center-final`, `round`, `round-label`, `match-box`, `highlight`, `match-text`, `winner`, `path`

### stickerbook.jsx — `Stickerbook`
- **State:** `mode` ('cover'|'album'), `teams`, `currentIndex` (steps by 2), `pageDataCache`, `progress`, `isFlipping`, `flipDir` ('idle'|'forward'|'backward'|'reset'), `error`, `loading`, `flipTimerRef`
- **Session ID:** `getSessionId()` from AuthContext (falls back to `'test-user'`)
- **API:** `GET /wc2026/teams`, `GET /wc2026/my_progress`, `GET /wc2026/team/{teamId}`
- **Flags:** `https://flagcdn.com/w80/{isoCode}.png` — uses shared `countryFlags.js` utility
- **3D classes (NEVER modify):** `book-scene`, `book-container`, `flipper`, `flipper-face`, `flipper-front`, `flipper-back`, `flipping-forward`, `flipping-backward`, `no-transition`

### OpenPacksGame.jsx — `OpenPackGame`
- **State:** `phase` ('idle'|'opening'|'revealed'), `cards`, `addedIds` (Set), `pendingIds` (Set), `showSparkles`, `error`, `allAddedToAlbum`
- **Session ID:** `getSessionId()` from AuthContext (falls back to `'test-user'`)
- **API:** `GET /wc2026/open_pack`, `POST /wc2026/place_sticker`
- **Framer Motion:** pack opening scale/rotation + stagger card reveal
- **Position colors:** GK `#f39c12`, DEF `#2980b9`, MID `#27ae60`, FWD `#e74c3c`
- **Pack card bg:** Warm cream `linear-gradient(180deg, #fdfaf5, #f5f0e8)` — intentional physical card feel, NOT glass

### AuthModal.jsx — `AuthModal` (NEW)
- **Props:** `initialTab` ('login'|'register'), `onClose`
- **State:** `tab`, `form` ({username, email, password, confirm}), `error`, `loading`
- **Context:** `useAuth()` → calls `login()` on success
- **API:** `POST /auth/register`, `POST /auth/login`
- **Key classes:** `auth-overlay`, `auth-modal`, `auth-tabs`, `auth-tab`, `auth-form`, `auth-input`, `auth-error`, `auth-submit`, `auth-close`

---

## Shared Components

### header.jsx — `Header`
- **Context (NEW):** `useTeam()` — swaps logo for selected nation flag; shows CTA buttons
- **Context (NEW):** `useAuth()` — shows username/sign-out when logged in; triggers AuthModal
- **State (NEW):** `showAuth` ('login'|'register'|null) — controls AuthModal visibility
- **Nav links:** `/` `/teams` `/club-world-cup` `/world-cup-2026` `/Stickerbook`
- **Logo:** `/world_cup.png` (default) OR selected nation flag (when team selected)
- **Extra CTA buttons (when team selected):** "Club World Cup" + "World Cup 2026"
- **Key classes:** `navbar`, `logo-button`, `logo-team-selected`, `logo-team-flag`, `logo-team-name`, `nav-links`, `nav-team-ctas`, `nav-cta-cwc`, `nav-cta-wc`, `nav-buttons`, `sign-in`, `create-account`, `user-greeting`

### teamSlidePanel.jsx — `TeamSlidePanel`
- **Props:** `team` (name, history, colors[]), `onClose`, `isVisible`
- Uses inline gradient from `team.colors`

### selectedMatchDrawer.jsx — `SelectedMatchDrawer`
- **Props:** `match` (TheSportsDB event object), `onClose`
- **Icons (lucide):** X, Clock, MapPin, Calendar, Play, Users, Target, AlertCircle, Trophy, Activity

### ContinentDropdown.jsx — `ContinentDropdown`
- **Props:** `continent`, `teams` (array), `onSelectTeam` (callback)
- Used only in Teams.jsx dropdown view mode

---

## React Context (NEW)

### TeamContext (`context/TeamContext.jsx`)
```javascript
// selectedTeam shape: { id, name, flagUrl, isoCode } | null
const { selectedTeam, setSelectedTeam } = useTeam();
```
- Provided at App.js level, inside AuthProvider
- Consumed by: `home.jsx` (sets it), `header.jsx` (reads it)

### AuthContext (`context/AuthContext.jsx`)
```javascript
const { user, token, login, logout, getSessionId } = useAuth();
// user shape: { id, username, email } | null
// getSessionId() → user.id (string) when logged in, 'test-user' when not
// login(accessToken, refreshToken, userData) — stores in localStorage
// logout() — clears localStorage + state
```
- Provided at App.js top level (wraps everything)
- Consumed by: `header.jsx`, `stickerbook.jsx`, `OpenPacksGame.jsx`, `AuthModal.jsx`
- localStorage keys: `wc_access_token`, `wc_refresh_token`, `wc_user`

---

## Shared Utility (`utils/countryFlags.js`)

```javascript
export const COUNTRY_CODE_MAP = { 'Algeria': 'dz', 'Argentina': 'ar', ... }; // 60+ entries
export const getFlagUrl = (name) => `https://flagcdn.com/64x48/${COUNTRY_CODE_MAP[name]}.png`;
export const getFlagUrlLarge = (name) => `https://flagcdn.com/w80/${COUNTRY_CODE_MAP[name]}.png`;
```
- Previously duplicated inside `stickerbook.jsx` — now shared
- Used by: `home.jsx` (carousel), `stickerbook.jsx` (album pages)

---

## Key Patterns & Gotchas

### API Call Pattern
```javascript
const backendUrl = process.env.REACT_APP_BACKEND_URL; // 'http://localhost:5001' locally

// fetch (stickerbook, packs):
const { getSessionId } = useAuth();
const res = await fetch(`${backendUrl}/wc2026/teams`, {
  headers: { 'session-id': getSessionId() }  // was hardcoded 'test-user'
});

// axios (bracket pages):
const res = await axios.post(`${backendUrl}/simulate_bracket`, { favorite_team, strategy });

// auth:
const res = await fetch(`${backendUrl}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

### PostgreSQL vs SQLite differences
```python
# SQLite                          # PostgreSQL (Supabase)
import sqlite3                    import psycopg2, psycopg2.extras
sqlite3.connect(DB_PATH)          psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
conn.row_factory = sqlite3.Row    # handled by RealDictCursor
"WHERE id = ?"                    "WHERE id = %s"
"INTEGER PRIMARY KEY AUTOINCREMENT" "SERIAL PRIMARY KEY"
"DEFAULT CURRENT_TIMESTAMP"       "DEFAULT NOW()"
PRAGMA table_info(users)          SELECT column_name FROM information_schema.columns WHERE table_name='users'
```

### State Architecture
- **AuthContext** (top level) — user session, JWT tokens
- **TeamContext** (inside Auth, outside Router) — selected WC nation
- **Local state** — everything else (no Redux/Zustand)
- **localStorage** — JWT tokens (`wc_access_token`, `wc_refresh_token`, `wc_user`) + Teams page favorites/recently-viewed

### Framer Motion Pattern
```javascript
// Stagger (OpenPacksGame, ClubWorldCupPredict):
<motion.div variants={cardVariants} initial="hidden" animate="visible" custom={index} />
// Hover/tap:
<motion.img whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} />
```

### Intentional Quirks (do NOT fix)
- `header.jsx` → `/Stickerbook` capital S — matches route in App.js exactly
- Pack cards → cream `#fdfaf5/#f5f0e8` — intentional physical card feel, NOT glass
- Album cover → crimson `#8B0000/#C41E3A` — intentional classic sticker album look
- `clubBracket.css` = stylesheet for `/club-world-cup/predict` (not `clubWorldCupPredict.css`)
- `package.json` proxy → `:5000` but backend runs `:5001` — resolved by `REACT_APP_BACKEND_URL`
- TheSportsDB key `123` = free/dummy key, rate limited

---

## Dev Commands

```bash
# Frontend
cd frontend && npm install && npm start   # → localhost:3000
cd frontend && npm run build              # → /build/

# Backend
cd backend && source venv/bin/activate
pip install -r requirements.txt
python app.py                             # → localhost:5001

# One-time setup scripts (run locally, data persists in DB):
python fetch_wc2026_squads.py             # Populate WC 2026 squads via API-Football
python utils/feature_engineering.py      # Regenerate ML training CSV

# Required env vars:
# frontend/.env  →  REACT_APP_BACKEND_URL=http://localhost:5001
# backend/.env   →  DATABASE_URL=<supabase-url>  JWT_SECRET_KEY=<secret>
#                   SPORTSDB_API_KEY=123  API_SPORTS_KEY=<key>
#                   FRONTEND_URL=http://localhost:3000  PORT=5001
```

---

## Component Hierarchy

```
App.js
└── AuthProvider (context/AuthContext.jsx)
    └── TeamProvider (context/TeamContext.jsx)
        └── Router
            ├── Header (every route)
            │   └── AuthModal (conditional, when showAuth !== null)
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

---

## Full Deployment Stack

```
Vercel (React)  ──HTTPS──►  Render (Flask)  ──psycopg2──►  Supabase (PostgreSQL)
                                    │
                                    └──HTTPS──► TheSportsDB API (live scores)
                                    └──HTTPS──► API-Football (squad data, setup only)
flagcdn.com (flags, direct from browser, no backend)
Google Fonts (fonts, direct from browser, no backend)
```

| Service | Tier | Cost | Limit |
|---------|------|------|-------|
| Vercel | Hobby free | $0 | 100GB bandwidth/month |
| Render | Free | $0 | Cold starts after 15min idle |
| Supabase | Free | $0 | 500MB DB, 2GB bandwidth |
| flagcdn.com | Free | $0 | Public CDN |
| TheSportsDB | Free | $0 | Rate limited |
| **Total** | | **$0/month** | |
