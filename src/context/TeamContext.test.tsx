import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { TeamProvider, useTeamContext } from './TeamContext';
import type { Team } from '../types/index';

const STORAGE_KEY = 'ai-pm-agent-team';

function createMockTeam(overrides?: Partial<Team>): Team {
  return {
    id: 'team-1',
    projectName: 'Test Project',
    topic: 'AI Research',
    deadline: '2025-12-31',
    members: [],
    tasks: [],
    milestones: [],
    chatMessages: [],
    aiSuggestions: [],
    alerts: [],
    report: null,
    pointAccounts: [],
    pointPredictions: [],
    settlementResult: null,
    createdAt: '2025-01-01',
    ...overrides,
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <TeamProvider>{children}</TeamProvider>;
}

describe('TeamContext localStorage integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with null when localStorage is empty', () => {
    const { result } = renderHook(() => useTeamContext(), { wrapper });
    expect(result.current.team).toBeNull();
  });

  it('restores team from localStorage on mount', () => {
    const team = createMockTeam({ projectName: 'Restored' });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(team));

    const { result } = renderHook(() => useTeamContext(), { wrapper });
    expect(result.current.team).toEqual(team);
    expect(result.current.team?.projectName).toBe('Restored');
  });

  it('saves team to localStorage on SET_TEAM dispatch', () => {
    const { result } = renderHook(() => useTeamContext(), { wrapper });
    const team = createMockTeam({ projectName: 'New Team' });

    act(() => {
      result.current.dispatch({ type: 'SET_TEAM', payload: team });
    });

    expect(result.current.team).toEqual(team);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.projectName).toBe('New Team');
  });

  it('updates localStorage when team state changes via UPDATE_TASK', () => {
    const team = createMockTeam({
      tasks: [{
        id: 't1', title: 'Task 1', description: 'Desc', assigneeId: 'm1',
        startDate: '2025-01-01', deadline: '2025-06-30', progress: 0,
        status: 'todo', difficulty: '중', submittedContent: null, review: null, lastUpdated: '2025-01-01',
      }],
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(team));

    const { result } = renderHook(() => useTeamContext(), { wrapper });

    act(() => {
      result.current.dispatch({
        type: 'UPDATE_TASK',
        payload: { taskId: 't1', updates: { progress: 50 } },
      });
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as Team;
    expect(stored.tasks[0].progress).toBe(50);
  });

  it('handles corrupted localStorage data gracefully', () => {
    localStorage.setItem(STORAGE_KEY, '{corrupted json');
    const { result } = renderHook(() => useTeamContext(), { wrapper });
    expect(result.current.team).toBeNull();
  });

  it('throws error when useTeamContext is used outside TeamProvider', () => {
    expect(() => {
      renderHook(() => useTeamContext());
    }).toThrow('useTeamContext must be used within a TeamProvider');
  });
});
