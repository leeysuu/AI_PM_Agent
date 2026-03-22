import { useState, useCallback } from 'react';
import { useTeamContext } from '../context/TeamContext';
import { mergeReport } from '../api/mergeApi';
import type { PPTSlide } from '../types';

export function useReport() {
  const { team, dispatch } = useTeamContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPptSlides, setPendingPptSlides] = useState<PPTSlide[] | null>(null);

  const requestMerge = useCallback(
    async (feedback?: string) => {
      if (!team) return;
      setLoading(true);
      setError(null);
      try {
        const res = await mergeReport({ teamState: team, feedback });
        dispatch({ type: 'SET_REPORT', payload: res.report });
        setPendingPptSlides(res.pptSlides);
      } catch (err) {
        setError(err instanceof Error ? err.message : '보고서 병합 실패');
      } finally {
        setLoading(false);
      }
    },
    [team, dispatch],
  );

  const approveReport = useCallback(() => {
    dispatch({ type: 'APPROVE_REPORT' });
    if (pendingPptSlides) {
      dispatch({ type: 'SET_PPT_SLIDES', payload: pendingPptSlides });
    }
  }, [dispatch, pendingPptSlides]);

  return {
    report: team?.report ?? null,
    loading,
    error,
    requestMerge,
    approveReport,
  };
}
