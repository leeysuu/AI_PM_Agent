import { useState, useCallback } from 'react';
import { useTeamContext } from '../context/TeamContext';
import { runCheck } from '../api/checkApi';
import { mergeReport } from '../api/mergeApi';
import type { Report } from '../types/index';

export function useProactiveCheck() {
  const { team, dispatch } = useTeamContext();
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
  }, [team, dispatch]);

  return { loading, error, performCheck };
}
