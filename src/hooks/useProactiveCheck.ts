import { useState, useCallback } from 'react';
import { useTeamContext } from '../context/TeamContext';
import { runCheck } from '../api/checkApi';
import { mergeReport } from '../api/mergeApi';
import { usePoints } from './usePoints';
import type { Report } from '../types/index';

export function useProactiveCheck() {
  const { team, dispatch } = useTeamContext();
  const { addPointEvent } = usePoints();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performCheck = useCallback(async () => {
    if (!team) {
      setError('팀 정보가 없습니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await runCheck({ teamState: team });

      // ADD_ALERT dispatch for each alert
      for (const alert of response.alerts) {
        dispatch({ type: 'ADD_ALERT', payload: alert });
      }

      // 포인트 감점: 3일 이상 미응답(-5pt), 마감 초과(-10pt)
      const now = new Date();
      for (const task of team.tasks) {
        if (task.status === 'done') continue;
        const lastUpdated = new Date(task.lastUpdated);
        const daysSinceUpdate = Math.floor(
          (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysSinceUpdate >= 3) {
          addPointEvent(task.assigneeId, 'no_response', -5, `3일 이상 미업데이트: ${task.title}`);
        }
        const taskDeadline = new Date(task.deadline);
        if (now > taskDeadline && task.progress < 100) {
          addPointEvent(task.assigneeId, 'overdue', -10, `마감 초과: ${task.title}`);
        }
      }

      // AI 채팅 메시지가 있으면 Team_Chat에 추가
      if (response.aiChatMessage) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: `ai-check-${Date.now()}`,
            sender: 'ai',
            content: response.aiChatMessage,
            timestamp: new Date().toISOString(),
            aiDetection: null,
          },
        });
      }

      // triggerMerge=true 시 보고서 병합 플로우 트리거
      if (response.triggerMerge && !team.report) {
        const mergeResponse = await mergeReport({ teamState: team });
        const report: Report = {
          title: mergeResponse.report.title,
          sections: mergeResponse.report.sections,
          status: 'draft',
          pptSlides: mergeResponse.pptSlides ?? null,
        };
        dispatch({ type: 'SET_REPORT', payload: report });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '자동 점검 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [team, dispatch, addPointEvent]);

  return { loading, error, performCheck };
}
