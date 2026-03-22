import React from 'react';
import type { Review } from '../../types/index';

interface ReviewResultProps {
  review: Review;
}

const SCORE_LABELS: { key: keyof Review['scores']; label: string }[] = [
  { key: 'completeness', label: '완성도' },
  { key: 'logic', label: '논리성' },
  { key: 'volume', label: '분량' },
  { key: 'relevance', label: '주제적합성' },
];

function severityConfig(severity: Review['delayDetection']['severity']) {
  switch (severity) {
    case 'critical':
      return { label: '심각 지연', color: 'text-red-700 bg-red-100', bar: 'bg-red-500' };
    case 'warning':
      return { label: '주의', color: 'text-yellow-700 bg-yellow-100', bar: 'bg-yellow-500' };
    case 'normal':
      return { label: '정상', color: 'text-green-700 bg-green-100', bar: 'bg-green-500' };
  }
}

function scoreBarColor(score: number, max: number): string {
  const ratio = score / max;
  if (ratio >= 0.8) return 'bg-green-500';
  if (ratio >= 0.6) return 'bg-blue-500';
  if (ratio >= 0.4) return 'bg-yellow-500';
  return 'bg-red-500';
}

const ReviewResult: React.FC<ReviewResultProps> = ({ review }) => {
  const { scores, feedback, suggestedProgress, delayDetection } = review;
  const severity = severityConfig(delayDetection.severity);

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-base font-semibold text-gray-900">AI 리뷰 결과</h3>

      {/* 항목별 점수 */}
      <div className="space-y-2">
        {SCORE_LABELS.map(({ key, label }) => {
          const value = scores[key];
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-sm text-gray-600">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full ${scoreBarColor(value, 25)}`}
                  style={{ width: `${(value / 25) * 100}%` }}
                />
              </div>
              <span className="w-12 text-right text-sm font-medium text-gray-700">
                {value}/25
              </span>
            </div>
          );
        })}
      </div>

      {/* 총점 */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-sm font-medium text-gray-700">총점</span>
        <span className="text-xl font-bold text-gray-900">{scores.total}/100</span>
      </div>

      {/* 진행률 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">AI 산정 진행률</span>
          <span className="text-sm font-semibold text-blue-600">{suggestedProgress}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${suggestedProgress}%` }}
          />
        </div>
      </div>

      {/* 지연 감지 */}
      <div className="flex items-center gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${severity.color}`}>
          {severity.label}
        </span>
        <span className="text-xs text-gray-500">
          기대 {delayDetection.expectedProgress}% / 실제 {delayDetection.actualProgress}% (갭 {delayDetection.gap}%)
        </span>
      </div>

      {/* 개선 포인트 */}
      {feedback.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700">개선 포인트</h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
            {feedback.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReviewResult;
