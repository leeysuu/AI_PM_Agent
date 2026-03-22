import type { Team } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function analyzeChat(input: {
  teamState: Team;
  newMessage: string;
  sender: string;
}): Promise<{
  detection: { type: string; confidence: number; detail: string };
  shouldIntervene: boolean;
  aiResponse: string;
  suggestedActions: { type: string; detail: string }[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('채팅 분석 요청 실패');
  return response.json();
}
