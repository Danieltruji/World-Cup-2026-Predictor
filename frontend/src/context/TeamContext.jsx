import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getFlagUrl, COUNTRY_CODE_MAP } from '../utils/countryFlags';

// ── TeamContext ───────────────────────────────────────────────
// Provides: selectedTeam, setSelectedTeam
//
// selectedTeam shape: { name, flagUrl, isoCode } | null
//
// Automatically syncs from AuthContext.user.favorite_team:
//   - When user logs in (or session is restored from localStorage),
//     selectedTeam is set immediately from user.favorite_team.
//   - When user logs out, selectedTeam is cleared to null.
//   - After POST /auth/select-team, call updateUser() in AuthContext —
//     this triggers the useEffect here and the header flag updates.

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const { user } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState(null);

  // ── Sync selectedTeam whenever the auth user changes ─────
  useEffect(() => {
    if (user?.favorite_team) {
      const name    = user.favorite_team;
      const isoCode = COUNTRY_CODE_MAP[name] || null;
      const flagUrl = getFlagUrl(name);
      setSelectedTeam({ name, flagUrl, isoCode });
    } else {
      setSelectedTeam(null);
    }
  }, [user]);

  return (
    <TeamContext.Provider value={{ selectedTeam, setSelectedTeam }}>
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => useContext(TeamContext);
