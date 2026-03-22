<<<<<<< HEAD
import type { Team } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function analyzeChat(input: {
  teamState: Team;
  newMessage: string;
  sender: string;
}): Promise<{
=======
import type { Team } from '../types/index';
import { apiPost } from './apiClient';

interface AnalyzeChatInput {
  teamState: Team;
  newMessage: string;
  sender: string;
}

interface AnalyzeChatResponse {
>>>>>>> origin/main
  detection: { type: string; confidence: number; detail: string };
  shouldIntervene: boolean;
  aiResponse: string;
  suggestedActions: { type: string; detail: string }[];
<<<<<<< HEAD
}> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('채팅 분석 요청 실패');
  return response.json();
=======
}

export async function analyzeChat(input: AnalyzeChatInput): Promise<AnalyzeChatResponse> {
  try {
    return await apiPost<AnalyzeChatResponse>('/api/chat', input);
  } catch (error) {
    const message = error instanceof Error ? error.message : '채팅 분석 중 오류가 발생했습니다';
    throw new Error(message);
  }
>>>>>>> origin/main
}
