<<<<<<< HEAD
import type { Team, Report, PPTSlide } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface MergeResponse {
=======
import type { Team, Report, PPTSlide } from '../types/index';
import { apiPost } from './apiClient';

interface MergeReportInput {
  teamState: Team;
  feedback?: string;
}

interface MergeReportResponse {
>>>>>>> origin/main
  report: Report;
  pptSlides: PPTSlide[];
}

<<<<<<< HEAD
export async function mergeReport(input: {
  teamState: Team;
  feedback?: string;
}): Promise<MergeResponse> {
  const res = await fetch(`${API_BASE_URL}/api/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('보고서 병합에 실패했습니다.');
  return res.json();
=======
export async function mergeReport(input: MergeReportInput): Promise<MergeReportResponse> {
  try {
    return await apiPost<MergeReportResponse>('/api/merge', input);
  } catch (error) {
    const message = error instanceof Error ? error.message : '보고서 병합 중 오류가 발생했습니다';
    throw new Error(message);
  }
>>>>>>> origin/main
}
