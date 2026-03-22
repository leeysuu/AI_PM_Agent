import type { Team, Alert } from '../types/index';
import { apiPost } from './apiClient';

interface RunCheckInput {
  teamState: Team;
}

interface RunCheckResponse {
  alerts: Alert[];
  triggerMerge: boolean;
  aiChatMessage: string;
}

export async function runCheck(input: RunCheckInput): Promise<RunCheckResponse> {
  try {
    return await apiPost<RunCheckResponse>('/api/check', input);
  } catch (error) {
    const message = error instanceof Error ? error.message : '자동 점검 중 오류가 발생했습니다';
    throw new Error(message);
  }
}
