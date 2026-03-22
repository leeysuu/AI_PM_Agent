import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { Team, TeamAction } from '../types/index';
import { teamReducer } from './teamReducer';

const STORAGE_KEY = 'ai-pm-agent-team';

interface TeamContextValue {
  team: Team | null;
  dispatch: React.Dispatch<TeamAction>;
}

export const TeamContext = createContext<TeamContextValue | undefined>(undefined);

function loadTeamFromStorage(): Team | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return null;
    }
    return JSON.parse(stored) as Team;
  } catch {
    return null;
  }
}

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [team, dispatch] = useReducer(teamReducer, null, () => {
    const stored = loadTeamFromStorage();
    return stored;
  });

  useEffect(() => {
    try {
      if (team === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
      }
    } catch {
      // localStorage unavailable or quota exceeded
    }
  }, [team]);

  return (
    <TeamContext.Provider value={{ team, dispatch }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamContext(): TeamContextValue {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  return context;
}
