import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAISuggestion } from '../useAISuggestion';
import type { Team, TeamAction, AISuggestion } from '../../types';

// Mock the decisionApi module
vi.mock('../../api/decisionApi', () => ({
  processDecision: vi.fn(),
}));

import { processDecision } from '../../api/decisionApi';

const mockProcessDecision = vi.mocked(processDecision);

function makeSuggestion(overrides: Partial<AISuggestion> = {}): AISuggestion {
  return {
    id: 'sug-1',
    type: 'reassign',
    content: '김철수에게 태스크를 이관합니다.',
    status: 'pending',
    relatedTaskId: 'task-1',
    round: 1,
    previousSuggestions: [],
    createdAt: '2025-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 'team-1',
    projectName: 'Test Project',
    topic: 'AI',
    deadline: '2025-12-31',
    members: [
      { id: 'm1', name: '김철수', department: '컴공', strength: '코딩', assignedTasks: [] },
      { id: 'm2', name: '이영희', department: '디자인', strength: '디자인', assignedTasks: [] },
    ],
    tasks: [{ id: 'task-1', title: '자료조사', description: '', assigneeId: 'm1', startDate: '2025-06-01', deadline: '2025-06-15', progress: 30, status: 'inProgress', difficulty: '중', submittedContent: null, review: null, lastUpdated: '2025-06-01T00:00:00.000Z' }],
    milestones: [],
    chatMessages: [],
    aiSuggestions: [makeSuggestion()],
    alerts: [],
    report: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

let dispatchedActions: TeamAction[] = [];
const mockDispatch = vi.fn((action: TeamAction) => {
  dispatchedActions.push(action);
});
let currentTeam: Team;

vi.mock('../../context/TeamContext', () => ({
  useTeamContext: () => ({
    team: currentTeam,
    dispatch: mockDispatch,
  }),
}));

describe('useAISuggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dispatchedActions = [];
    currentTeam = makeTeam();
  });

  /**
   * Validates: Requirement 10.2
   * 수락 시 UPDATE_SUGGESTION(accepted) + APPLY_CHANGES dispatch 테스트
   */
  it('수락 시 UPDATE_SUGGESTION과 APPLY_CHANGES를 dispatch한다', async () => {
    mockProcessDecision.mockResolvedValueOnce({
      action: 'apply',
      appliedChanges: [
        { type: 'reassign_task', taskId: 'task-1', details: { newAssigneeId: 'm2' } },
      ],
    });

    const { result } = renderHook(() => useAISuggestion());

    await act(async () => {
      await result.current.acceptSuggestion('sug-1');
    });

    const updateActions = dispatchedActions.filter((a) => a.type === 'UPDATE_SUGGESTION');
    expect(updateActions.length).toBe(1);
    expect((updateActions[0] as { payload: { status: string } }).payload.status).toBe('accepted');

    const applyActions = dispatchedActions.filter((a) => a.type === 'APPLY_CHANGES');
    expect(applyActions.length).toBe(1);
  });

  /**
   * Validates: Requirement 10.3, 11.1
   * 거절 시 UPDATE_SUGGESTION(rejected) + ADD_SUGGESTION(새 대안) dispatch 테스트
   */
  it('거절 시 UPDATE_SUGGESTION과 새 대안 ADD_SUGGESTION을 dispatch한다', async () => {
    mockProcessDecision.mockResolvedValueOnce({
      action: 'newSuggestion',
      newSuggestion: {
        id: 'sug-2',
        type: 'extend',
        content: '마감을 3일 연장합니다.',
        status: 'pending',
        relatedTaskId: 'task-1',
        round: 2,
        previousSuggestions: ['sug-1'],
        createdAt: '2025-06-02T00:00:00.000Z',
      },
    });

    const { result } = renderHook(() => useAISuggestion());

    await act(async () => {
      await result.current.rejectSuggestion('sug-1', '다른 팀원도 바쁩니다');
    });

    const updateActions = dispatchedActions.filter((a) => a.type === 'UPDATE_SUGGESTION');
    expect(updateActions.length).toBe(1);
    const updatePayload = (updateActions[0] as { payload: { status: string; rejectionReason?: string } }).payload;
    expect(updatePayload.status).toBe('rejected');
    expect(updatePayload.rejectionReason).toBe('다른 팀원도 바쁩니다');

    const addActions = dispatchedActions.filter((a) => a.type === 'ADD_SUGGESTION');
    expect(addActions.length).toBe(1);
  });

  /**
   * Validates: Requirement 11.4, 11.5
   * round >= 3인 제안 거절 시 API 호출 없이 UPDATE_SUGGESTION만 dispatch하고 새 대안을 생성하지 않는 테스트
   */
  it('round >= 3인 제안 거절 시 API 호출 없이 거절만 처리한다', async () => {
    currentTeam = makeTeam({
      aiSuggestions: [makeSuggestion({ id: 'sug-3', round: 3 })],
    });

    const { result } = renderHook(() => useAISuggestion());

    await act(async () => {
      await result.current.rejectSuggestion('sug-3', '이 방법도 안 됩니다');
    });

    // API should NOT be called
    expect(mockProcessDecision).not.toHaveBeenCalled();

    // Only UPDATE_SUGGESTION should be dispatched, no ADD_SUGGESTION
    const updateActions = dispatchedActions.filter((a) => a.type === 'UPDATE_SUGGESTION');
    expect(updateActions.length).toBe(1);

    const addActions = dispatchedActions.filter((a) => a.type === 'ADD_SUGGESTION');
    expect(addActions.length).toBe(0);
  });

  /**
   * Validates: Requirement 11.5
   * round > 3인 제안이 존재할 때 maxRoundReached가 true인지 테스트
   */
  it('round > 3인 제안이 있으면 maxRoundReached가 true이다', () => {
    currentTeam = makeTeam({
      aiSuggestions: [
        makeSuggestion({ id: 'sug-1', round: 1, status: 'rejected' }),
        makeSuggestion({ id: 'sug-2', round: 2, status: 'rejected' }),
        makeSuggestion({ id: 'sug-3', round: 3, status: 'rejected' }),
        makeSuggestion({ id: 'sug-4', round: 4, status: 'pending' }),
      ],
    });

    const { result } = renderHook(() => useAISuggestion());
    expect(result.current.maxRoundReached).toBe(true);
  });

  /**
   * Validates: Requirement 10.4
   * 거절 사유가 빈 문자열이 아닌지는 UI(SuggestionCard)에서 차단하지만,
   * 훅 레벨에서도 reason이 전달되는지 확인
   */
  it('거절 시 사유가 dispatch payload에 포함된다', async () => {
    mockProcessDecision.mockResolvedValueOnce({
      action: 'newSuggestion',
      newSuggestion: {
        id: 'sug-2',
        type: 'pair_work',
        content: '페어워크로 진행합니다.',
        status: 'pending',
        relatedTaskId: 'task-1',
        round: 2,
        previousSuggestions: ['sug-1'],
        createdAt: '2025-06-02T00:00:00.000Z',
      },
    });

    const { result } = renderHook(() => useAISuggestion());

    await act(async () => {
      await result.current.rejectSuggestion('sug-1', '페어워크가 더 나을 것 같아요');
    });

    const updateActions = dispatchedActions.filter((a) => a.type === 'UPDATE_SUGGESTION');
    const payload = (updateActions[0] as { payload: { rejectionReason?: string } }).payload;
    expect(payload.rejectionReason).toBe('페어워크가 더 나을 것 같아요');
  });
});
