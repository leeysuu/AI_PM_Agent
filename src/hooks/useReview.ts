import { useState, useCallback } from 'react';
import { useTeamContext } from '../context/TeamContext';
import { submitReview } from '../api/reviewApi';
import { usePoints } from './usePoints';
import type { Review, AISuggestion } from '../types/index';

interface ReviewResult {
  review: Review;
  reassignSuggestion: AISuggestion | null;
}

export function useReview() {
  const { team, dispatch } = useTeamContext();
  const { addPointEvent } = usePoints();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ReviewResult | null>(null);

  const submitWork = useCallback(
    async (taskId: string, content: string) => {
      if (!team) {
        setError('팀 정보가 없습니다.');
        return;
      }

      setLoading(true);
      setError(null);

      // 태스크 상태를 inProgress로 변경 + 결과물 저장
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          taskId,
          updates: {
            status: 'inProgress',
            submittedContent: content,
            lastUpdated: new Date().toISOString(),
          },
        },
      });

      try {
        const response = await submitReview({
          teamState: team,
          taskId,
          submittedContent: content,
        });

        // Review 객체 구성
        const review: Review = {
          taskId,
          scores: response.review.scores,
          feedback: response.review.feedback,
          suggestedProgress: response.review.suggestedProgress,
          delayDetection: {
            expectedProgress: response.delayDetection.expectedProgress,
            actualProgress: response.delayDetection.actualProgress,
            gap: response.delayDetection.gap,
            severity: response.delayDetection.severity as Review['delayDetection']['severity'],
          },
        };

        // UPDATE_REVIEW dispatch: 리뷰 결과 + 진행률 + 재배분 제안 한번에 반영
        dispatch({
          type: 'UPDATE_REVIEW',
          payload: {
            taskId,
            review,
            suggestion: response.reassignSuggestion ?? undefined,
          },
        });

        setLastResult({ review, reassignSuggestion: response.reassignSuggestion });

        // 포인트 이벤트: 결과물 제출 +5pt
        const task = team.tasks.find((t) => t.id === taskId);
        const assigneeId = task?.assigneeId;
        if (assigneeId && team.pointAccounts.length > 0) {
          addPointEvent(assigneeId, 'submit', 5, '결과물 제출');

          // 품질 80점 이상 +10pt
          if (review.scores.total >= 80) {
            addPointEvent(assigneeId, 'quality_bonus', 10, `품질 우수 (${review.scores.total}점)`);
          }

          // 마감 전 제출 +3pt
          if (task && new Date().toISOString() <= task.deadline) {
            addPointEvent(assigneeId, 'early_submit', 3, '마감 전 제출');
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '리뷰 처리 중 오류가 발생했습니다.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [team, dispatch, addPointEvent],
  );

  return { loading, error, lastResult, submitWork };
}
