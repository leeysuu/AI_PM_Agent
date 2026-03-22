import type { Team, Report, PPTSlide } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface MergeResponse {
  report: Report;
  pptSlides: PPTSlide[];
}

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
}
