import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from 'react';
import type { Team, TeamAction } from '../types';
import { teamReducer } from './teamReducer';

const STORAGE_KEY = 'ai-pm-agent-team';

interface TeamContextValue {
  team: Team | null;
  dispatch: Dispatch<TeamAction>;
}

const TeamContext = createContext<TeamContextValue | null>(null);

function loadFromStorage(): Team | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Team;
  } catch {
    // ignore parse errors
  }
  return null;
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const [team, dispatch] = useReducer(teamReducer, null, () => loadFromStorage());

  useEffect(() => {
    if (team) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
    }
  }, [team]);

  return (
    <TeamContext.Provider value={{ team, dispatch }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamContext(): TeamContextValue {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeamContext must be used within TeamProvider');
  return ctx;
}
