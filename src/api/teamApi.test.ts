import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTeam } from './teamApi';
import * as apiClient from './apiClient';

vi.mock('./apiClient');

describe('createTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const input = {
    projectName: '테스트 프로젝트',
    topic: 'AI 연구',
    deadline: '2025-12-31',
    members: [
      { name: '김철수', department: '컴퓨터공학', strength: '프로그래밍' },
      { name: '이영희', department: '디자인', strength: 'UI/UX' },
    ],
  };

  it('should call apiPost with /api/team and return response', async () => {
    const mockResponse = {
      tasks: [],
      milestones: [],
      aiMessage: '팀이 생성되었습니다',
    };
    vi.mocked(apiClient.apiPost).mockResolvedValue(mockResponse);

    const result = await createTeam(input);

    expect(apiClient.apiPost).toHaveBeenCalledWith('/api/team', input);
    expect(result).toEqual(mockResponse);
  });

  it('should throw descriptive error on failure', async () => {
    vi.mocked(apiClient.apiPost).mockRejectedValue(new Error('API 요청 실패: 500'));

    await expect(createTeam(input)).rejects.toThrow('API 요청 실패: 500');
  });

  it('should throw fallback error for non-Error exceptions', async () => {
    vi.mocked(apiClient.apiPost).mockRejectedValue('unknown error');

    await expect(createTeam(input)).rejects.toThrow('팀 생성 중 오류가 발생했습니다');
  });
});
