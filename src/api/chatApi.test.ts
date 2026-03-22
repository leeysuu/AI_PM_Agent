import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeChat } from './chatApi';
import * as apiClient from './apiClient';
import type { Team } from '../types/index';

vi.mock('./apiClient');

describe('analyzeChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTeam: Team = {
    id: 'team-1',
    projectName: '테스트',
    topic: 'AI',
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
  };

  it('should call apiPost with /api/chat and return response', async () => {
    const mockResponse = {
      detection: { type: 'decision', confidence: 0.8, detail: '결정 감지' },
      shouldIntervene: true,
      aiResponse: 'AI 응답',
      suggestedActions: [],
    };
    vi.mocked(apiClient.apiPost).mockResolvedValue(mockResponse);

    const input = { teamState: mockTeam, newMessage: '안녕', sender: 'member-1' };
    const result = await analyzeChat(input);

    expect(apiClient.apiPost).toHaveBeenCalledWith('/api/chat', input);
    expect(result).toEqual(mockResponse);
  });

  it('should throw fallback error for non-Error exceptions', async () => {
    vi.mocked(apiClient.apiPost).mockRejectedValue(42);

    await expect(
      analyzeChat({ teamState: mockTeam, newMessage: '', sender: '' })
    ).rejects.toThrow('채팅 분석 중 오류가 발생했습니다');
  });
});
