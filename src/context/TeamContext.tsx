<<<<<<< HEAD
import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from 'react';
import type { Team, TeamAction } from '../types';
=======
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { Team, TeamAction } from '../types/index';
>>>>>>> origin/main
import { teamReducer } from './teamReducer';

const STORAGE_KEY = 'ai-pm-agent-team';

interface TeamContextValue {
  team: Team | null;
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/main
    }
  }, [team]);

  return (
    <TeamContext.Provider value={{ team, dispatch }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamContext(): TeamContextValue {
<<<<<<< HEAD
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeamContext must be used within TeamProvider');
  return ctx;
=======
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  return context;
>>>>>>> origin/main
}
