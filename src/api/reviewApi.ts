import type { Team, Review, AISuggestion } from '../types/index';
import { apiPost } from './apiClient';

interface SubmitReviewInput {
  teamState: Team;
  taskId: string;
  submittedContent: string;
}

interface SubmitReviewResponse {
  review: Review;
  delayDetection: {
    expectedProgress: number;
    actualProgress: number;
    gap: number;
    severity: string;
  };
  reassignSuggestion: AISuggestion | null;
}

export async function submitReview(input: SubmitReviewInput): Promise<SubmitReviewResponse> {
  try {
    return await apiPost<SubmitReviewResponse>('/api/review', input);
  } catch (error) {
    const message = error instanceof Error ? error.message : '리뷰 제출 중 오류가 발생했습니다';
    throw new Error(message);
  }
}
