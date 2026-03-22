import type { Team, Report, PPTSlide } from '../types/index';
import { apiPost } from './apiClient';

interface MergeReportInput {
  teamState: Team;
  feedback?: string;
}

interface MergeReportResponse {
  report: Report;
  pptSlides: PPTSlide[];
}

export async function mergeReport(input: MergeReportInput): Promise<MergeReportResponse> {
  try {
    return await apiPost<MergeReportResponse>('/api/merge', input);
  } catch (error) {
    const message = error instanceof Error ? error.message : '보고서 병합 중 오류가 발생했습니다';
    throw new Error(message);
  }
}
