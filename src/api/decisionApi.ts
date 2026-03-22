import type { Team, AISuggestion, AppliedChange } from '../types/index';
import { apiPost } from './apiClient';

interface ProcessDecisionInput {
  teamState: Team;
  suggestionId: string;
  accepted: boolean;
  rejectionReason?: string;
}

interface ProcessDecisionResponse {
  action: 'apply' | 'newSuggestion';
  appliedChanges?: AppliedChange[];
  newSuggestion?: AISuggestion;
}

export async function processDecision(input: ProcessDecisionInput): Promise<ProcessDecisionResponse> {
  try {
    return await apiPost<ProcessDecisionResponse>('/api/decision', input);
  } catch (error) {
    const message = error instanceof Error ? error.message : '의사결정 처리 중 오류가 발생했습니다';
    throw new Error(message);
  }
}
