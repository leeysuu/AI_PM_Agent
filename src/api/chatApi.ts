import type { Team } from '../types';
import { apiPost } from './apiClient';

interface AnalyzeChatInput {
  teamState: Team;
  newMessage: string;
  sender: string;
}

interface AnalyzeChatResponse {
  detection: { type: string; confidence: number; detail: string };
  shouldIntervene: boolean;
  aiResponse: string;
  suggestedActions: { type: string; detail: string }[];
}

export async function analyzeChat(input: AnalyzeChatInput): Promise<AnalyzeChatResponse> {
  try {
    return await apiPost<AnalyzeChatResponse>('/api/chat', input);
  } catch (error) {
    const message = error instanceof Error ? error.message : '채팅 분석 중 오류가 발생했습니다';
    throw new Error(message);
  }
}
