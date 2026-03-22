<<<<<<< HEAD
import type { Team, AISuggestion, AppliedChange } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface DecisionRequest {
=======
import type { Team, AISuggestion, AppliedChange } from '../types/index';
import { apiPost } from './apiClient';

interface ProcessDecisionInput {
>>>>>>> origin/main
  teamState: Team;
  suggestionId: string;
  accepted: boolean;
  rejectionReason?: string;
}

<<<<<<< HEAD
export interface DecisionResponse {
=======
interface ProcessDecisionResponse {
>>>>>>> origin/main
  action: 'apply' | 'newSuggestion';
  appliedChanges?: AppliedChange[];
  newSuggestion?: AISuggestion;
}

<<<<<<< HEAD
export async function processDecision(input: DecisionRequest): Promise<DecisionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('제안 처리 요청 실패');
  return response.json();
=======
export async function processDecision(input: ProcessDecisionInput): Promise<ProcessDecisionResponse> {
  try {
    return await apiPost<ProcessDecisionResponse>('/api/decision', input);
  } catch (error) {
    const message = error instanceof Error ? error.message : '의사결정 처리 중 오류가 발생했습니다';
    throw new Error(message);
  }
>>>>>>> origin/main
}
