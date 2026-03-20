# Plan: Home Page Flag Carousel + Auth System
> Stack: Vercel (React) + Render (Flask) + Supabase (PostgreSQL)
> Design system: Liquid Glass Arena — all tokens in App.css :root

---

## Core Concept

The home page (`/`) is a **one-time landing/onboarding page**. Its only purpose is to let users sign up, log in, and pick their nation. Once a user has an account AND a team selected, they are **automatically redirected away from `/`** and never see it again.

After onboarding, the header becomes their permanent identity:
- **Top left:** Their country's flag (replaces `world_cup.png` forever)
- **Top right:** Their username (replaces Sign In / Create Account forever)


BEFORE (not logged in / onboarding):
┌──────────────────────────────────────────────────────────┐
│ [world_cup.png Home] Teams CWC WC2026 Sticker [Sign In] [Create Account] │
└──────────────────────────────────────────────────────────┘

AFTER (logged in + team selected — permanent):
┌──────────────────────────────────────────────────────────┐
│ [🇧🇷] Teams Club World Cup World Cup 2026 Sticker Book danieltrujillo ▾ │
└──────────────────────────────────────────────────────────┘


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


STATE 1: Not logged in
┌─────────────────────────────────────────┐
│ World Cup 2026 Predictor │
│ Select your nation, predict the winner │
│ │
│ ‹ [🇦🇷][🇧🇷][🏴󠁧󠁢󠁥󠁮󠁧󠁿][🇫🇷][🇩🇪]... › │
│ Can't find your team? Learn more │
│ │
│ [Create Account] [Sign In] │
└─────────────────────────────────────────┘
Clicking a flag → /register?team=Argentina

STATE 2: Logged in but no team yet
┌─────────────────────────────────────────┐
│ Welcome, [username] 👋 │
│ One last step — pick your nation. │
│ Choose wisely, you can't change it. │
│ │
│ ‹ [🇦🇷][🇧🇷][🏴󠁧󠁢󠁥󠁮󠁧󠁿][🇫🇷][🇩🇪]... › │
│ Can't find your team? Learn more │
└─────────────────────────────────────────┘
Clicking a flag → POST /auth/select-team → redirect to /world-cup-2026


---

## Header — Permanent Identity After Onboarding

```jsx
export default function Header() {
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

export const COUNTRY_CODE_MAP = {
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

import { createContext, useContext, useState, useEffect } from 'react';
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
-- Added to users table migration:
ALTER TABLE users ADD COLUMN favorite_team TEXT DEFAULT NULL;
-- NULL = not yet selected. Backend enforces one-time-only via 409 if already set.

New Backend Endpoints
POST /auth/select-team (JWT required)
# Saves team once. Returns 409 if already set.
# Body: { team_name: "Brazil" }
# Returns: { success: true, favorite_team: "Brazil" }

POST /auth/register — returns favorite_team: null
POST /auth/login — returns favorite_team: null | "TeamName"
GET /auth/me — returns favorite_team: null | "TeamName"
All auth responses include favorite_team so frontend can immediately sync TeamContext.

Backend Files
File	Change
backend/requirements.txt	Add Flask-JWT-Extended==4.7.1 + psycopg2-binary==2.9.9
backend/db_setup.py	Migration: username, email, password_hash, created_at, is_active, favorite_team
backend/auth.py	NEW Blueprint: register, login, refresh, me, select-team
backend/app.py	JWTManager + register auth_bp + CORS → FRONTEND_URL
backend/stickerbook.py	sqlite3 → psycopg2
backend/wc2026_stickerbook.py	sqlite3 → psycopg2
sqlite3 → psycopg2 cheatsheet
SQLite	PostgreSQL
import sqlite3	import psycopg2, psycopg2.extras
sqlite3.connect(DB_PATH)	psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
conn.row_factory = sqlite3.Row	Handled by RealDictCursor
"WHERE x = ?"	"WHERE x = %s"
INTEGER PRIMARY KEY AUTOINCREMENT	SERIAL PRIMARY KEY
DEFAULT CURRENT_TIMESTAMP	DEFAULT NOW()
Frontend Files
frontend/src/context/AuthContext.jsx (NEW)
// user shape: { id, username, email, favorite_team }
// Exports: user, token, login(), logout(), updateUser(), getSessionId()
// updateUser() — patches user in state + localStorage after select-team call
// getSessionId() — returns String(user.id) or 'test-user' fallback

// On mount: restores user + token from localStorage
// TeamContext syncs from user.favorite_team via useEffect in App.js or TeamProvider

frontend/src/App.js (MODIFY)
// AuthProvider (outer) wraps TeamProvider (inner) wraps Router
// TeamProvider useEffect syncs selectedTeam when user changes:
//   if (user?.favorite_team) setSelectedTeam({ name, flagUrl, isoCode })
//   else setSelectedTeam(null)
// Routes added: /login, /register
// No protected route wrapper needed — redirects handled inside each page component

frontend/src/pages/home.jsx (MODIFY — full rewrite)
// useEffect: if (user && user.favorite_team) navigate('/world-cup-2026', { replace: true })
// State 1 (not logged in): carousel + Create Account + Sign In
// State 2 (logged in, no team): carousel with "choose wisely" message, no auth buttons
// handleSelectTeam:
//   - not logged in → navigate('/register?team=TeamName')
//   - logged in, no team → POST /auth/select-team → updateUser() → navigate('/world-cup-2026')

frontend/src/pages/Login.jsx (NEW)
// useEffect: if (user && user.favorite_team) navigate('/world-cup-2026', { replace: true })
// POST /auth/login → login() → navigate('/world-cup-2026' or '/' if no team)
// ?team param: if login succeeds and user has no team, POST /auth/select-team first
// Link: "Don't have an account?" → /register (preserves ?team param)

frontend/src/pages/Register.jsx (NEW)
// useEffect: if (user && user.favorite_team) navigate('/world-cup-2026', { replace: true })
// Shows team banner at top if ?team param present: "🇧🇷 Registering as Brazil"
// POST /auth/register → if ?team → POST /auth/select-team → login() → navigate('/world-cup-2026')
// Link: "Already have an account?" → /login (preserves ?team param)

frontend/src/pages/stylesheets/authPages.css (NEW)
/* Full-page centered layout matching Liquid Glass Arena */
.auth-page — page background (3-layer gradient) + min-height: 100vh + flex center
.auth-card — liquid glass card, max-width 440px, Bebas Neue title
.auth-team-banner — flag + country name shown when ?team present
.auth-input — glass input, gold focus ring
.auth-submit — gold 3D button
.auth-switch-link — "Already have an account?" muted text + gold link
.auth-error — red error text

frontend/src/pages/stylesheets/home.css (MODIFY)
/* Append: carousel + auth section styles */
.flag-carousel-section, .flag-track-viewport, .flag-track
.flag-circle-btn — circular, gold border, scale on hover
.carousel-arrow — circular glass button, gold, accelerates on hold
.cant-find-team — small muted link to /teams
.home-auth-section — only shown in State 1, flex row of two buttons
.home-auth-register — gold 3D button
.home-auth-login — glass button with gold border

frontend/src/pages/stylesheets/header.css (MODIFY)
/* Append: flag logo + username dropdown styles */
.logo-flag-only — no text, just the flag image, tighter padding
.logo-team-flag — 46x32px, rounded corners, gold border, gold glow
.username-btn — ghost button, font-body, text-secondary, chevron
.user-menu-wrapper — relative positioned wrapper for dropdown
.user-dropdown — absolute glass dropdown, shadow, 1 item (Sign Out)
.user-dropdown button — full width, hover gold tint

Implementation Sequence (20 steps)
#	File	Type	Notes
1	frontend/src/utils/countryFlags.js	NEW	Shared flag map + helpers
2	frontend/src/context/AuthContext.jsx	NEW	user, token, login, logout, updateUser, getSessionId
3	frontend/src/context/TeamContext.jsx	NEW	Syncs from user.favorite_team
4	frontend/src/App.js	MODIFY	Both providers + /login + /register routes
5	frontend/src/pages/home.jsx	MODIFY	2 states + redirect if has team
6	frontend/src/pages/stylesheets/home.css	MODIFY	Carousel + auth CTAs
7	frontend/src/components/header.jsx	MODIFY	Flag logo + username dropdown
8	frontend/src/pages/stylesheets/header.css	MODIFY	Flag logo + dropdown styles
9	frontend/src/pages/Login.jsx	NEW	Full page + ?team param + redirect
10	frontend/src/pages/Register.jsx	NEW	Full page + ?team param + team banner
11	frontend/src/pages/stylesheets/authPages.css	NEW	Auth page styles
12	backend/requirements.txt	MODIFY	Flask-JWT-Extended + psycopg2-binary
13	backend/db_setup.py	MODIFY	Auth + favorite_team migration
14	backend/auth.py	NEW	register, login, refresh, me, select-team
15	backend/app.py	MODIFY	JWTManager + blueprint + CORS
16	backend/stickerbook.py	MODIFY	sqlite3 → psycopg2
17	backend/wc2026_stickerbook.py	MODIFY	sqlite3 → psycopg2
18	frontend/src/pages/stickerbook.jsx	MODIFY	Shared countryFlags + getSessionId
19	frontend/src/pages/OpenPacksGame.jsx	MODIFY	getSessionId
20	PROJECT_REFERENCE.md	UPDATE	Document final state
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