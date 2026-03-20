Context
Both bugs share the same root cause: wc2026_teams and wc2026_players tables in Supabase are empty because fetch_wc2026_squads.py was written for SQLite and has never been run against the PostgreSQL database.

Bug 1 ("daily limit hit" with 0 packs opened): open_wc2026_pack() queries wc2026_players for the card pool. When regular_pool = [] (no data), it returns []. The app.py route interprets any empty return as "daily limit hit" — wrong error, same underlying cause.
Bug 2 (blank sticker book pages): The /wc2026/teams endpoint calls get_all_teams() which queries wc2026_teams. Empty table → empty response → frontend shows blank pages.

Files to Change
FileWhat changesbackend/fetch_wc2026_squads.pyFull SQLite → psycopg2 migrationbackend/app.pyFix misleading "daily limit" error when player pool is empty
Step-by-Step
Step 1 — Migrate fetch_wc2026_squads.py to psycopg2
Imports:
python# Remove:
import sqlite3
from wc2026_db_setup import setup_wc2026_tables
DB_PATH = ...

# Add:
import psycopg2
import psycopg2.extras
DATABASE_URL = os.getenv("DATABASE_URL")
get_conn():
pythondef get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
All query changes:

? → %s everywhere
INSERT OR IGNORE INTO wc2026_teams → INSERT INTO wc2026_teams ... ON CONFLICT (name) DO NOTHING
cursor.fetchone()[0] → cursor.fetchone()["id"] (RealDictCursor returns dicts)
is_legend = 0 → is_legend = false
is_legend = 1 → is_legend = true
WHERE team_id = ? AND is_legend = 1 → WHERE team_id = %s AND is_legend = true
cursor.execute("SELECT id FROM wc2026_teams WHERE name = ?") → %s
Add explicit conn.commit() after each write (already present in most places, verify all)

main() function: Remove setup_wc2026_tables() call (tables already exist from db_setup.py)
reset_wc2026_data(): Works as-is for PostgreSQL (DELETE FROM is standard SQL)
Step 2 — Fix misleading error in app.py
Current code (line 251-252):
pythonif not cards:
    return jsonify({"error": "You have reached your daily pack limit (20 packs/day)."}), 403
Problem: returns same error whether limit is hit OR no player data exists.
Fix — check limit separately before calling open pack:
pythonfrom wc2026_stickerbook import _can_open_pack  # add to imports

@app.route("/wc2026/open_pack", methods=["GET"])
def wc2026_open_pack():
    session_id = request.headers.get("session-id", request.remote_addr)
    user_id    = get_or_create_user(session_id)
    if not _can_open_pack(user_id):
        return jsonify({"error": "You have reached your daily pack limit (20 packs/day)."}), 403
    cards = open_wc2026_pack(user_id)
    if not cards:
        return jsonify({"error": "No player data available yet."}), 503
    return jsonify({"cards": cards})
Step 3 — Run the seeding script (external action, user does this)
bashcd backend
source venv/bin/activate
python fetch_wc2026_squads.py
```

- Takes ~6 minutes for all 42 confirmed teams (rate limit: 10 req/min on free tier)
- Safe to stop and resume — already-seeded teams are skipped
- Can use `--limit 5` to test with just 5 teams first

## Verification
1. After running the script: `wc2026_teams` should have 48 rows (42 confirmed + 6 TBD), `wc2026_players` should have ~26 players per team
2. Sticker book at `/Stickerbook` should show team pages with player slots
3. Open packs should deal cards instead of showing limit error
4. If limit IS truly hit, error message is correct

---

# Plan: Home Page Flag Carousel + Auth System
> Stack: Vercel (React) + Render (Flask) + Supabase (PostgreSQL)
> Design system: Liquid Glass Arena — all tokens in App.css :root

---

## Core Concept

The home page (`/`) is a **one-time landing/onboarding page**. Its only purpose is to let users sign up, log in, and pick their nation. Once a user has an account AND a team selected, they are **automatically redirected away from `/`** and never see it again.

After onboarding, the header becomes their permanent identity:
- **Top left:** Their country's flag (replaces `world_cup.png` forever)
- **Top right:** Their username (replaces Sign In / Create Account forever)
```
BEFORE (not logged in / onboarding):
┌──────────────────────────────────────────────────────────┐
│  [world_cup.png Home]   Teams  CWC  WC2026  Sticker   [Sign In] [Create Account]  │
└──────────────────────────────────────────────────────────┘

AFTER (logged in + team selected — permanent):
┌──────────────────────────────────────────────────────────┐
│  [🇧🇷]   Teams  Club World Cup  World Cup 2026  Sticker Book   danieltrujillo ▾  │
└──────────────────────────────────────────────────────────┘
```

---

## Route Behavior

| Route | Not logged in | Logged in, no team | Logged in + team |
|-------|--------------|-------------------|-----------------|
| `/` | ✅ Show landing page | ✅ Show landing page (team picker only) | 🔀 Redirect → `/world-cup-2026` |
| `/login` | ✅ Show login page | ✅ Show login page | 🔀 Redirect → `/world-cup-2026` |
| `/register` | ✅ Show register page | ✅ Show register page | 🔀 Redirect → `/world-cup-2026` |
| All other routes | ✅ Accessible | ✅ Accessible | ✅ Accessible |

> **Why `/world-cup-2026`?** It's the flagship page and the natural "home" after onboarding. Can be changed easily to any route.

---

## Home Page — Landing / Onboarding Only

The home page has **2 states** (State 3 from before is gone — users are redirected instead):
```
STATE 1: Not logged in
┌─────────────────────────────────────────┐
│  World Cup 2026 Predictor               │
│  Select your nation, predict the winner │
│                                         │
│  ‹  [🇦🇷][🇧🇷][🏴󠁧󠁢󠁥󠁮󠁧󠁿][🇫🇷][🇩🇪]...  ›    │
│  Can't find your team? Learn more       │
│                                         │
│  [Create Account]     [Sign In]         │
└─────────────────────────────────────────┘
Clicking a flag → /register?team=Argentina

STATE 2: Logged in but no team yet
┌─────────────────────────────────────────┐
│  Welcome, [username] 👋                 │
│  One last step — pick your nation.      │
│  Choose wisely, you can't change it.    │
│                                         │
│  ‹  [🇦🇷][🇧🇷][🏴󠁧󠁢󠁥󠁮󠁧󠁿][🇫🇷][🇩🇪]...  ›    │
│  Can't find your team? Learn more       │
└─────────────────────────────────────────┘
Clicking a flag → POST /auth/select-team → redirect to /world-cup-2026

Header — Permanent Identity After Onboarding
jsxexport default function Header() {
  const navigate = useNavigate();
  const { selectedTeam } = useTeam();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="navbar">

      {/* LEFT: Flag (logged in + team) OR world_cup.png (otherwise) */}
      {selectedTeam ? (
        <button className="logo-button logo-flag-only"
          onClick={() => navigate('/world-cup-2026')}>
          <img src={selectedTeam.flagUrl} alt={selectedTeam.name} className="logo-team-flag" />
        </button>
      ) : (
        <button className="logo-button" onClick={() => navigate('/')}>
          <img src="/world_cup.png" alt="World Cup Logo" />
          <span>Home</span>
        </button>
      )}

      {/* CENTER: Nav links — always the same */}
      <div className="nav-links">
        <button onClick={() => navigate('/teams')}>Teams</button>
        <button onClick={() => navigate('/club-world-cup')}>Club World Cup</button>
        <button onClick={() => navigate('/world-cup-2026')}>World Cup 2026</button>
        <button onClick={() => navigate('/Stickerbook')}>Sticker Book</button>
      </div>

      {/* RIGHT: Username dropdown (logged in) OR Sign In / Create Account (not logged in) */}
      <div className="nav-buttons">
        {user ? (
          <div className="user-menu-wrapper">
            <button className="username-btn" onClick={() => setShowUserMenu(p => !p)}>
              {user.username} ▾
            </button>
            {showUserMenu && (
              <div className="user-dropdown">
                <button onClick={() => { logout(); setShowUserMenu(false); navigate('/'); }}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button className="sign-in" onClick={() => navigate('/login')}>Sign In</button>
            <button className="create-account" onClick={() => navigate('/register')}>Create Account</button>
          </>
        )}
      </div>

    </nav>
  );
}
Header behavior notes:

Flag logo clicks → /world-cup-2026 (their real home after onboarding)
world_cup.png logo clicks → / (onboarding/landing)
Nav links: no CTA buttons added — the permanent nav is sufficient
Username: small dropdown with Sign Out only (can add Settings, Profile later)
No team name text next to flag — just the flag itself, clean


Feature 1 — New Files
frontend/src/utils/countryFlags.js
Extracted from stickerbook.jsx, shared utility:
javascriptexport const COUNTRY_CODE_MAP = {
  'Algeria': 'dz', 'Argentina': 'ar', 'Australia': 'au', 'Belgium': 'be',
  'Brazil': 'br', 'Canada': 'ca', 'England': 'gb-eng', 'France': 'fr',
  // ... all 60+ entries copied verbatim from stickerbook.jsx
};
export const getFlagUrl = (name) => {
  const code = COUNTRY_CODE_MAP[name];
  return code ? `https://flagcdn.com/64x48/${code}.png` : null;
};
export const getFlagUrlLarge = (name) => {
  const code = COUNTRY_CODE_MAP[name];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
};
frontend/src/context/TeamContext.jsx
Syncs from user.favorite_team automatically:
jsximport { createContext, useContext, useState, useEffect } from 'react';
import { getFlagUrl, COUNTRY_CODE_MAP } from '../utils/countryFlags';

export const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const [selectedTeam, setSelectedTeam] = useState(null);
  // TeamProvider reads user from AuthContext via prop or useContext
  // selectedTeam: { name, flagUrl, isoCode } | null
  return (
    <TeamContext.Provider value={{ selectedTeam, setSelectedTeam }}>
      {children}
    </TeamContext.Provider>
  );
}
export const useTeam = () => useContext(TeamContext);

TeamContext is populated from AuthContext.user.favorite_team inside home.jsx and on auth restore — see AuthContext below.


Feature 2 — Auth System
DB Schema Addition
sql-- Added to users table migration:
ALTER TABLE users ADD COLUMN favorite_team TEXT DEFAULT NULL;
-- NULL = not yet selected. Backend enforces one-time-only via 409 if already set.
New Backend Endpoints
POST /auth/select-team (JWT required)
python# Saves team once. Returns 409 if already set.
# Body: { team_name: "Brazil" }
# Returns: { success: true, favorite_team: "Brazil" }
POST /auth/register — returns favorite_team: null
POST /auth/login — returns favorite_team: null | "TeamName"
GET /auth/me — returns favorite_team: null | "TeamName"
All auth responses include favorite_team so frontend can immediately sync TeamContext.
Backend Files
FileChangebackend/requirements.txtAdd Flask-JWT-Extended==4.7.1 + psycopg2-binary==2.9.9backend/db_setup.pyMigration: username, email, password_hash, created_at, is_active, favorite_teambackend/auth.pyNEW Blueprint: register, login, refresh, me, select-teambackend/app.pyJWTManager + register auth_bp + CORS → FRONTEND_URLbackend/stickerbook.pysqlite3 → psycopg2backend/wc2026_stickerbook.pysqlite3 → psycopg2
sqlite3 → psycopg2 cheatsheet
SQLitePostgreSQLimport sqlite3import psycopg2, psycopg2.extrassqlite3.connect(DB_PATH)psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)conn.row_factory = sqlite3.RowHandled by RealDictCursor"WHERE x = ?""WHERE x = %s"INTEGER PRIMARY KEY AUTOINCREMENTSERIAL PRIMARY KEYDEFAULT CURRENT_TIMESTAMPDEFAULT NOW()
Frontend Files
frontend/src/context/AuthContext.jsx (NEW)
jsx// user shape: { id, username, email, favorite_team }
// Exports: user, token, login(), logout(), updateUser(), getSessionId()
// updateUser() — patches user in state + localStorage after select-team call
// getSessionId() — returns String(user.id) or 'test-user' fallback

// On mount: restores user + token from localStorage
// TeamContext syncs from user.favorite_team via useEffect in App.js or TeamProvider
frontend/src/App.js (MODIFY)
jsx// AuthProvider (outer) wraps TeamProvider (inner) wraps Router
// TeamProvider useEffect syncs selectedTeam when user changes:
//   if (user?.favorite_team) setSelectedTeam({ name, flagUrl, isoCode })
//   else setSelectedTeam(null)
// Routes added: /login, /register
// No protected route wrapper needed — redirects handled inside each page component
frontend/src/pages/home.jsx (MODIFY — full rewrite)
jsx// useEffect: if (user && user.favorite_team) navigate('/world-cup-2026', { replace: true })
// State 1 (not logged in): carousel + Create Account + Sign In
// State 2 (logged in, no team): carousel with "choose wisely" message, no auth buttons
// handleSelectTeam:
//   - not logged in → navigate('/register?team=TeamName')
//   - logged in, no team → POST /auth/select-team → updateUser() → navigate('/world-cup-2026')
frontend/src/pages/Login.jsx (NEW)
jsx// useEffect: if (user && user.favorite_team) navigate('/world-cup-2026', { replace: true })
// POST /auth/login → login() → navigate('/world-cup-2026' or '/' if no team)
// ?team param: if login succeeds and user has no team, POST /auth/select-team first
// Link: "Don't have an account?" → /register (preserves ?team param)
frontend/src/pages/Register.jsx (NEW)
jsx// useEffect: if (user && user.favorite_team) navigate('/world-cup-2026', { replace: true })
// Shows team banner at top if ?team param present: "🇧🇷 Registering as Brazil"
// POST /auth/register → if ?team → POST /auth/select-team → login() → navigate('/world-cup-2026')
// Link: "Already have an account?" → /login (preserves ?team param)
frontend/src/pages/stylesheets/authPages.css (NEW)
css/* Full-page centered layout matching Liquid Glass Arena */
.auth-page — page background (3-layer gradient) + min-height: 100vh + flex center
.auth-card — liquid glass card, max-width 440px, Bebas Neue title
.auth-team-banner — flag + country name shown when ?team present
.auth-input — glass input, gold focus ring
.auth-submit — gold 3D button
.auth-switch-link — "Already have an account?" muted text + gold link
.auth-error — red error text
frontend/src/pages/stylesheets/home.css (MODIFY)
css/* Append: carousel + auth section styles */
.flag-carousel-section, .flag-track-viewport, .flag-track
.flag-circle-btn — circular, gold border, scale on hover
.carousel-arrow — circular glass button, gold, accelerates on hold
.cant-find-team — small muted link to /teams
.home-auth-section — only shown in State 1, flex row of two buttons
.home-auth-register — gold 3D button
.home-auth-login — glass button with gold border
frontend/src/pages/stylesheets/header.css (MODIFY)
css/* Append: flag logo + username dropdown styles */
.logo-flag-only — no text, just the flag image, tighter padding
.logo-team-flag — 46x32px, rounded corners, gold border, gold glow
.username-btn — ghost button, font-body, text-secondary, chevron
.user-menu-wrapper — relative positioned wrapper for dropdown
.user-dropdown — absolute glass dropdown, shadow, 1 item (Sign Out)
.user-dropdown button — full width, hover gold tint

Implementation Sequence (20 steps)
#FileTypeNotes1frontend/src/utils/countryFlags.jsNEWShared flag map + helpers2frontend/src/context/AuthContext.jsxNEWuser, token, login, logout, updateUser, getSessionId3frontend/src/context/TeamContext.jsxNEWSyncs from user.favorite_team4frontend/src/App.jsMODIFYBoth providers + /login + /register routes5frontend/src/pages/home.jsxMODIFY2 states + redirect if has team6frontend/src/pages/stylesheets/home.cssMODIFYCarousel + auth CTAs7frontend/src/components/header.jsxMODIFYFlag logo + username dropdown8frontend/src/pages/stylesheets/header.cssMODIFYFlag logo + dropdown styles9frontend/src/pages/Login.jsxNEWFull page + ?team param + redirect10frontend/src/pages/Register.jsxNEWFull page + ?team param + team banner11frontend/src/pages/stylesheets/authPages.cssNEWAuth page styles12backend/requirements.txtMODIFYFlask-JWT-Extended + psycopg2-binary13backend/db_setup.pyMODIFYAuth + favorite_team migration14backend/auth.pyNEWregister, login, refresh, me, select-team15backend/app.pyMODIFYJWTManager + blueprint + CORS16backend/stickerbook.pyMODIFYsqlite3 → psycopg217backend/wc2026_stickerbook.pyMODIFYsqlite3 → psycopg218frontend/src/pages/stickerbook.jsxMODIFYShared countryFlags + getSessionId19frontend/src/pages/OpenPacksGame.jsxMODIFYgetSessionId20PROJECT_REFERENCE.mdUPDATEDocument final state

Key Constraints

/ is onboarding only — redirect to /world-cup-2026 if user && user.favorite_team
Same redirect applies to /login and /register
Header flag logo → navigates to /world-cup-2026, never /
world_cup.png logo only shown when user is not logged in or has no team
No team name text in header — flag only (clean, minimal)
Username shown top-right when logged in; clicking shows dropdown with Sign Out
No "Create Account" / "Sign In" buttons in header — those live on / only
favorite_team stored in Supabase — one-time, enforced 409 on backend if already set
updateUser() patches localStorage without re-login
getSessionId() → String(user.id) or 'test-user' fallback
All CSS tokens from App.css :root — no hardcoded hex
Stickerbook 3D flip CSS untouched
/Stickerbook capital S preserved
CORS → FRONTEND_URL env var only
JWT secret → JWT_SECRET_KEY env var on Render


Verification Checklist
Onboarding (State 1 — not logged in):

Visit / → see carousel + "Create Account" + "Sign In"
Click flag → redirected to /register?team=Brazil
Register form shows "🇧🇷 Registering as Brazil" banner
Complete registration → redirected to /world-cup-2026
Header now shows: [🇧🇷] on left, danieltrujillo ▾ on right
Visit / again → immediately redirected to /world-cup-2026 (never see landing again)

Onboarding (logged in, no team — State 2):
7. Log in with account that has no team → / shows carousel with "choose wisely" message
8. Click flag → saves to DB → redirected to /world-cup-2026
9. Header updates to show flag + username
Permanent state (logged in + team):
10. All subsequent visits to /, /login, /register → redirect to /world-cup-2026
11. Flag logo in header → navigates to /world-cup-2026
12. Username ▾ click → dropdown with "Sign Out"
13. Sign Out → clears state, redirects to / (landing page shown again)
14. Refresh page → still logged in, still redirected away from /
Backend:
15. POST /auth/select-team second call → 409
16. GET /auth/me → includes favorite_team
17. CORS only allows FRONTEND_URL
Backward compatibility:
18. Stickerbook + Open Packs work with getSessionId() (real ID or 'test-user')