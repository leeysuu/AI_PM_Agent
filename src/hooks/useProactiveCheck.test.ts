import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { TeamContext } from '../context/TeamContext';
import { useProactiveCheck } from './useProactiveCheck';
import type { Team, TeamAction } from '../types/index';

const mockRunCheck = vi.fn();
const mockMergeReport = vi.fn();

vi.mock('../api/checkApi', () => ({
  runCheck: (...args: unknown[]) => mockRunCheck(...args),
}));

vi.mock('../api/mergeApi', () => ({
  mergeReport: (...args: unknown[]) => mockMergeReport(...args),
}));

function createMockTeam(overrides?: Partial<Team>): Team {
  return {
    id: 'team-1',
    projectName: '테스트 프로젝트',
    topic: 'AI 연구',
    deadline: '2026-06-01',
    members: [
      { id: 'm1', name: '김철수', department: '컴공', strength: '프로그래밍', assignedTasks: ['t1'] },
      { id: 'm2', name: '이영희', department: '디자인', strength: '디자인', assignedTasks: ['t2'] },
    ],
    tasks: [
      {
        id: 't1', title: '서론 작성', description: '서론', assigneeId: 'm1',
        startDate: '2026-04-01', deadline: '2026-05-15', progress: 50,
        status: 'inProgress', difficulty: '중', submittedContent: '서론 내용', review: null, lastUpdated: '2026-03-20',
      },
      {
        id: 't2', title: '본론 작성', description: '본론', assigneeId: 'm2',
        startDate: '2026-04-01', deadline: '2026-05-15', progress: 30,
        status: 'inProgress', difficulty: '중', submittedContent: null, review: null, lastUpdated: '2026-03-18',
      },
    ],
    milestones: [],
    chatMessages: [],
    aiSuggestions: [],
    alerts: [],
    report: null,
    pointAccounts: [],
    pointPredictions: [],
    settlementResult: null,
    createdAt: '2026-04-01',
    ...overrides,
  };
}

function createWrapper(team: Team | null, dispatch: React.Dispatch<TeamAction>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      TeamContext.Provider,
      { value: { team, dispatch } },
      children,
    );
  };
}

describe('useProactiveCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches ADD_ALERT for each alert returned', async () => {
    const dispatch = vi.fn();
    const team = createMockTeam();

    mockRunCheck.mockResolvedValueOnce({
      alerts: [
        { id: 'a1', message: '마감이 3일 남았습니다', type: 'deadline', target: '전체', priority: 'high', createdAt: '2026-05-28' },
        { id: 'a2', message: '이영희님 태스크 업데이트가 필요합니다', type: 'nudge', target: '이영희', priority: 'medium', createdAt: '2026-05-28' },
      ],
      triggerMerge: false,
      aiChatMessage: '',
    });

    const { result } = renderHook(() => useProactiveCheck(), {
      wrapper: createWrapper(team, dispatch),
    });

    await act(async () => {
      await result.current.performCheck();
    });

    const addAlertCalls = dispatch.mock.calls.filter((c) => c[0].type === 'ADD_ALERT');
    expect(addAlertCalls).toHaveLength(2);
    expect(addAlertCalls[0][0].payload.type).toBe('deadline');
    expect(addAlertCalls[1][0].payload.type).toBe('nudge');
  });

  it('dispatches ADD_MESSAGE when aiChatMessage is present', async () => {
    const dispatch = vi.fn();
    const team = createMockTeam();

    mockRunCheck.mockResolvedValueOnce({
      alerts: [],
      triggerMerge: false,
      aiChatMessage: '팀 여러분, 마감이 다가오고 있습니다!',
    });

    const { result } = renderHook(() => useProactiveCheck(), {
      wrapper: createWrapper(team, dispatch),
    });

    await act(async () => {
      await result.current.performCheck();
    });

    const addMsgCalls = dispatch.mock.calls.filter((c) => c[0].type === 'ADD_MESSAGE');
    expect(addMsgCalls).toHaveLength(1);
    expect(addMsgCalls[0][0].payload.sender).toBe('ai');
    expect(addMsgCalls[0][0].payload.content).toBe('팀 여러분, 마감이 다가오고 있습니다!');
  });

  it('does not dispatch ADD_MESSAGE when aiChatMessage is empty', async () => {
    const dispatch = vi.fn();
    const team = createMockTeam();

    mockRunCheck.mockResolvedValueOnce({
      alerts: [],
      triggerMerge: false,
      aiChatMessage: '',
    });

    const { result } = renderHook(() => useProactiveCheck(), {
      wrapper: createWrapper(team, dispatch),
    });

    await act(async () => {
      await result.current.performCheck();
    });

    const addMsgCalls = dispatch.mock.calls.filter((c) => c[0].type === 'ADD_MESSAGE');
    expect(addMsgCalls).toHaveLength(0);
  });

  it('triggers merge when triggerMerge is true and no report exists', async () => {
    const dispatch = vi.fn();
    const team = createMockTeam({ report: null });

    mockRunCheck.mockResolvedValueOnce({
      alerts: [{ id: 'a1', message: '전원 완료', type: 'completion', target: '전체', priority: 'low', createdAt: '2026-05-28' }],
      triggerMerge: true,
      aiChatMessage: '모든 태스크가 완료되었습니다!',
    });

    mockMergeReport.mockResolvedValueOnce({
      report: { title: '통합 보고서', sections: [], status: 'draft', pptSlides: null },
      pptSlides: [],
    });

    const { result } = renderHook(() => useProactiveCheck(), {
      wrapper: createWrapper(team, dispatch),
    });

    await act(async () => {
      await result.current.performCheck();
    });

    expect(mockMergeReport).toHaveBeenCalledWith({ teamState: team });
    const setReportCalls = dispatch.mock.calls.filter((c) => c[0].type === 'SET_REPORT');
    expect(setReportCalls).toHaveLength(1);
    expect(setReportCalls[0][0].payload.title).toBe('통합 보고서');
  });

  it('does not trigger merge when report already exists', async () => {
    const dispatch = vi.fn();
    const team = createMockTeam({
      report: { title: '기존 보고서', sections: [], status: 'draft', pptSlides: null },
    });

    mockRunCheck.mockResolvedValueOnce({
      alerts: [],
      triggerMerge: true,
      aiChatMessage: '',
    });

    const { result } = renderHook(() => useProactiveCheck(), {
      wrapper: createWrapper(team, dispatch),
    });

    await act(async () => {
      await result.current.performCheck();
    });

    expect(mockMergeReport).not.toHaveBeenCalled();
  });

  it('sets error when team is null', async () => {
    const dispatch = vi.fn();

    const { result } = renderHook(() => useProactiveCheck(), {
      wrapper: createWrapper(null, dispatch),
    });

    await act(async () => {
      await result.current.performCheck();
    });

    expect(result.current.error).toBe('팀 정보가 없습니다.');
    expect(mockRunCheck).not.toHaveBeenCalled();
  });

  it('sets error on API failure', async () => {
    const dispatch = vi.fn();
    const team = createMockTeam();

    mockRunCheck.mockRejectedValueOnce(new Error('네트워크 오류'));

    const { result } = renderHook(() => useProactiveCheck(), {
      wrapper: createWrapper(team, dispatch),
    });

    await act(async () => {
      await result.current.performCheck();
    });

    expect(result.current.error).toBe('네트워크 오류');
  });

  it('handles all alert types correctly (deadline, delay, nudge, completion)', async () => {
    const dispatch = vi.fn();
    const team = createMockTeam();

    mockRunCheck.mockResolvedValueOnce({
      alerts: [
        { id: 'a1', message: '마감 D-3', type: 'deadline', target: '전체', priority: 'high', createdAt: '2026-05-28' },
        { id: 'a2', message: '지연 감지', type: 'delay', target: '김철수', priority: 'high', createdAt: '2026-05-28' },
        { id: 'a3', message: '업데이트 독촉', type: 'nudge', target: '이영희', priority: 'medium', createdAt: '2026-05-28' },
        { id: 'a4', message: '태스크 완료 축하', type: 'completion', target: '김철수', priority: 'low', createdAt: '2026-05-28' },
      ],
      triggerMerge: false,
      aiChatMessage: '',
    });

    const { result } = renderHook(() => useProactiveCheck(), {
      wrapper: createWrapper(team, dispatch),
    });

    await act(async () => {
      await result.current.performCheck();
    });

    const addAlertCalls = dispatch.mock.calls.filter((c) => c[0].type === 'ADD_ALERT');
    expect(addAlertCalls).toHaveLength(4);

    const alertTypes = addAlertCalls.map((c) => c[0].payload.type);
    expect(alertTypes).toContain('deadline');
    expect(alertTypes).toContain('delay');
    expect(alertTypes).toContain('nudge');
    expect(alertTypes).toContain('completion');
  });

  it('manages loading state correctly', async () => {
    const dispatch = vi.fn();
    const team = createMockTeam();

    mockRunCheck.mockResolvedValueOnce({
      alerts: [],
      triggerMerge: false,
      aiChatMessage: '',
    });

    const { result } = renderHook(() => useProactiveCheck(), {
      wrapper: createWrapper(team, dispatch),
    });

    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.performCheck();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
