import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';
import type { Team, TeamAction } from '../../types';

// Mock the chatApi module
vi.mock('../../api/chatApi', () => ({
  analyzeChat: vi.fn(),
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).slice(2, 9)),
});

import { analyzeChat } from '../../api/chatApi';

const mockAnalyzeChat = vi.mocked(analyzeChat);

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 'team-1',
    projectName: 'Test Project',
    topic: 'AI',
    deadline: '2025-12-31',
    members: [
      { id: 'm1', name: '김철수', department: '컴공', strength: '코딩', assignedTasks: [] },
    ],
    tasks: [],
    milestones: [],
    chatMessages: [],
    aiSuggestions: [],
    alerts: [],
    report: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// Track dispatched actions
let dispatchedActions: TeamAction[] = [];
const mockDispatch = vi.fn((action: TeamAction) => {
  dispatchedActions.push(action);
});
const mockTeam = makeTeam();

// Mock TeamContext
vi.mock('../../context/TeamContext', () => ({
  useTeamContext: () => ({
    team: mockTeam,
    dispatch: mockDispatch,
  }),
}));

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dispatchedActions = [];
  });

  /**
   * Validates: Requirements 6.3
   * 메시지 전송 후 ADD_MESSAGE dispatch로 채팅 목록에 즉시 추가되는지 테스트
   */
  it('메시지 전송 시 ADD_MESSAGE를 dispatch하여 채팅 목록에 추가한다', async () => {
    mockAnalyzeChat.mockResolvedValueOnce({
      detection: { type: 'none', confidence: 0, detail: '' },
      shouldIntervene: false,
      aiResponse: '',
      suggestedActions: [],
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('안녕하세요', 'm1');
    });

    // First dispatch should be ADD_MESSAGE for the user message
    const addMessageActions = dispatchedActions.filter((a) => a.type === 'ADD_MESSAGE');
    expect(addMessageActions.length).toBeGreaterThanOrEqual(1);

    const userMsg = (addMessageActions[0] as { type: 'ADD_MESSAGE'; payload: { sender: string; content: string } }).payload;
    expect(userMsg.sender).toBe('m1');
    expect(userMsg.content).toBe('안녕하세요');
  });

  /**
   * Validates: Requirements 7.5
   * confidence >= 0.7이고 shouldIntervene=true일 때 AI 메시지가 채팅에 추가되는지 테스트
   */
  it('confidence >= 0.7 시 AI 메시지를 채팅에 추가한다', async () => {
    mockAnalyzeChat.mockResolvedValueOnce({
      detection: { type: 'decision', confidence: 0.85, detail: '의사결정 감지됨' },
      shouldIntervene: true,
      aiResponse: '📋 의사결정 감지: 프로젝트 방향 변경',
      suggestedActions: [],
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('프로젝트 방향을 바꾸자', 'm1');
    });

    const addMessageActions = dispatchedActions.filter((a) => a.type === 'ADD_MESSAGE');
    // Should have 2 ADD_MESSAGE: user message + AI message
    expect(addMessageActions.length).toBe(2);

    const aiMsg = (addMessageActions[1] as { type: 'ADD_MESSAGE'; payload: { sender: string; content: string } }).payload;
    expect(aiMsg.sender).toBe('ai');
    expect(aiMsg.content).toBe('📋 의사결정 감지: 프로젝트 방향 변경');
  });

  /**
   * Validates: Requirements 7.5, 7.6
   * confidence < 0.7일 때 ADD_DETECTION만 dispatch되고 AI 메시지는 추가되지 않는지 테스트
   */
  it('confidence < 0.7 시 ADD_DETECTION만 dispatch하고 AI 메시지는 추가하지 않는다', async () => {
    mockAnalyzeChat.mockResolvedValueOnce({
      detection: { type: 'risk', confidence: 0.5, detail: '일정 리스크 가능성' },
      shouldIntervene: false,
      aiResponse: '',
      suggestedActions: [],
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('마감이 좀 빡빡한데', 'm1');
    });

    // Should have ADD_MESSAGE (user) + ADD_DETECTION, but NO second ADD_MESSAGE (AI)
    const addMessageActions = dispatchedActions.filter((a) => a.type === 'ADD_MESSAGE');
    expect(addMessageActions.length).toBe(1); // Only user message

    const addDetectionActions = dispatchedActions.filter((a) => a.type === 'ADD_DETECTION');
    expect(addDetectionActions.length).toBe(1);

    const detection = (addDetectionActions[0] as { type: 'ADD_DETECTION'; payload: { detection: { type: string; confidence: number } } }).payload.detection;
    expect(detection.type).toBe('risk');
    expect(detection.confidence).toBe(0.5);
  });

  /**
   * Validates: Requirements 7.6
   * 감지 type이 'none'일 때 AI 응답이나 감지 결과가 dispatch되지 않는지 테스트
   */
  it('감지 type이 none이면 AI 메시지나 감지 결과를 dispatch하지 않는다', async () => {
    mockAnalyzeChat.mockResolvedValueOnce({
      detection: { type: 'none', confidence: 0, detail: '' },
      shouldIntervene: false,
      aiResponse: '',
      suggestedActions: [],
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('오늘 날씨 좋다', 'm1');
    });

    // Only user message, no AI message, no detection
    const addMessageActions = dispatchedActions.filter((a) => a.type === 'ADD_MESSAGE');
    expect(addMessageActions.length).toBe(1);

    const addDetectionActions = dispatchedActions.filter((a) => a.type === 'ADD_DETECTION');
    expect(addDetectionActions.length).toBe(0);
  });

  /**
   * Validates: Requirements 6.3
   * API 에러 시 에러 AI 메시지가 dispatch되는지 테스트
   */
  it('API 에러 시 에러 메시지를 AI 메시지로 dispatch한다', async () => {
    mockAnalyzeChat.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('테스트 메시지', 'm1');
    });

    const addMessageActions = dispatchedActions.filter((a) => a.type === 'ADD_MESSAGE');
    // User message + error AI message
    expect(addMessageActions.length).toBe(2);

    const errorMsg = (addMessageActions[1] as { type: 'ADD_MESSAGE'; payload: { sender: string; content: string } }).payload;
    expect(errorMsg.sender).toBe('ai');
    expect(errorMsg.content).toContain('오류');
  });
});
