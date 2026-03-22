import type { Team, AISuggestion, AppliedChange } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface DecisionRequest {
  teamState: Team;
  suggestionId: string;
  accepted: boolean;
  rejectionReason?: string;
}

export interface DecisionResponse {
  action: 'apply' | 'newSuggestion';
  appliedChanges?: AppliedChange[];
  newSuggestion?: AISuggestion;
}

export async function processDecision(input: DecisionRequest): Promise<DecisionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('제안 처리 요청 실패');
  return response.json();
}
