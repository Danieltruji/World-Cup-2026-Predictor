import { createContext, useContext, useState, useEffect } from 'react';

// ── AuthContext ───────────────────────────────────────────────
// Provides: user, token, login(), logout(), updateUser(), getSessionId()
//
// user shape: { id, username, email, favorite_team }
// token: JWT access token string | null
//
// On mount: restores user + token from localStorage so sessions persist
// across page refreshes.

const AuthContext = createContext(null);

const LS_USER  = 'wc_user';
const LS_TOKEN = 'wc_token';

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);

  // ── Restore session from localStorage on first load ──────
  useEffect(() => {
    try {
      const savedUser  = localStorage.getItem(LS_USER);
      const savedToken = localStorage.getItem(LS_TOKEN);
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch {
      // Corrupted storage — clear it
      localStorage.removeItem(LS_USER);
      localStorage.removeItem(LS_TOKEN);
    }
  }, []);

  // ── login() — called after successful /auth/login or /auth/register ──
  // Accepts the full API response body: { user: {...}, access_token: "..." }
  const login = (userData, accessToken) => {
    localStorage.setItem(LS_USER,  JSON.stringify(userData));
    localStorage.setItem(LS_TOKEN, accessToken);
    setUser(userData);
    setToken(accessToken);
  };

  // ── logout() — clears all auth state ─────────────────────
  const logout = () => {
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_TOKEN);
    setUser(null);
    setToken(null);
  };

  // ── updateUser() — patches user in state + localStorage ──
  // Used after POST /auth/select-team so we don't need a full re-login.
  const updateUser = (updatedUser) => {
    localStorage.setItem(LS_USER, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // ── getSessionId() — backward-compat for stickerbook APIs ──
  // Returns the real user ID as a string when logged in,
  // or 'test-user' as a fallback so unauthenticated sticker
  // features keep working exactly as before.
  const getSessionId = () => {
    return user ? String(user.id) : 'test-user';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, getSessionId }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
