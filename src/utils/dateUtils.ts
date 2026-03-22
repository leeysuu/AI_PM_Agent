/**
 * 날짜 유틸리티 — D-day 계산, 경과일 계산, 날짜 포맷팅, 기대 진행률 계산
 * 모든 날짜는 ISO 8601 (YYYY-MM-DD) 문자열. 네이티브 Date만 사용.
 */

/**
 * 자정 기준 Date 객체 생성 (시간 영향 제거)
 */
function toMidnight(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 오늘 날짜를 YYYY-MM-DD 문자열로 반환 (로컬 시간 기준)
 */
function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 두 날짜 사이의 일수 차이 계산 (소수점 없이 정수)
 */
function diffDays(a: Date, b: Date): number {
  const msPerDay = 86400000;
  return Math.round((a.getTime() - b.getTime()) / msPerDay);
}

/**
 * D-day 계산: 마감일까지 남은 일수.
 * 양수 = 남은 일수, 음수 = 초과(지연) 일수
 */
export function calculateDDay(deadline: string): number {
  const deadlineDate = toMidnight(deadline);
  const today = toMidnight(todayStr());
  return diffDays(deadlineDate, today);
}

/**
 * 경과일 계산: startDate부터 endDate(기본값: 오늘)까지의 일수
 */
export function calculateElapsedDays(startDate: string, endDate?: string): number {
  const start = toMidnight(startDate);
  const end = toMidnight(endDate ?? todayStr());
  return diffDays(end, start);
}

/**
 * ISO 날짜 문자열을 한국어 형식으로 포맷 (YYYY년 MM월 DD일)
 */
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 기대 진행률 계산: (경과일 / 전체일) × 100, 0~100 범위로 클램핑
 */
export function calculateExpectedProgress(startDate: string, deadline: string): number {
  const start = toMidnight(startDate);
  const end = toMidnight(deadline);
  const today = toMidnight(todayStr());

  const totalDays = diffDays(end, start);
  if (totalDays <= 0) return 100;

  const elapsed = diffDays(today, start);
  const progress = (elapsed / totalDays) * 100;

  return Math.min(100, Math.max(0, Math.round(progress)));
}
