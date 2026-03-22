import React, { useState, useCallback } from 'react';
import { useTeamContext } from '../../context/TeamContext';
import { mergeReport } from '../../api/mergeApi';
import ReportViewer from './ReportViewer';
import LoadingOverlay from '../common/LoadingOverlay';
import ErrorMessage from '../common/ErrorMessage';
import type { Report } from '../../types';

const ReportPage: React.FC = () => {
  const { team, dispatch } = useTeamContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allTasksDone = team
    ? team.tasks.length > 0 && team.tasks.every((t) => t.status === 'done')
    : false;

  const handleMerge = useCallback(async () => {
    if (!team) return;
    setLoading(true);
    setError(null);
    try {
      const response = await mergeReport({ teamState: team });
      const report: Report = {
        title: response.report.title,
        sections: response.report.sections,
        status: 'draft',
        pptSlides: response.pptSlides ?? null,
      };
      dispatch({ type: 'SET_REPORT', payload: report });
    } catch (err) {
      setError(err instanceof Error ? err.message : '보고서 병합 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [team, dispatch]);

  const handleApprove = useCallback(() => {
    dispatch({ type: 'APPROVE_REPORT' });
  }, [dispatch]);

  const handleRequestRevision = useCallback(
    async (feedback: string) => {
      if (!team) return;
      setLoading(true);
      setError(null);
      try {
        const response = await mergeReport({
          teamState: team,
          feedback,
        });
        const report: Report = {
          title: response.report.title,
          sections: response.report.sections,
          status: 'draft',
          pptSlides: response.pptSlides ?? null,
        };
        dispatch({ type: 'SET_REPORT', payload: report });
      } catch (err) {
        setError(err instanceof Error ? err.message : '보고서 수정 요청 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [team, dispatch],
  );

  if (!team) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-500">팀을 먼저 생성해주세요.</p>
      </div>
    );
  }

  return (
    <div className="relative p-6">
      {loading && <LoadingOverlay visible={loading} />}

      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">보고서</h1>
        <p className="mt-1 text-sm text-gray-500">
          전원 태스크 완료 시 AI가 자동으로 보고서를 병합합니다.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      {!team.report && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          {allTasksDone ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                모든 태스크가 완료되었습니다. 보고서를 병합할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={handleMerge}
                disabled={loading}
                className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                보고서 병합 시작
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              아직 완료되지 않은 태스크가 있습니다. 전원 태스크 완료 후 보고서를 병합할 수 있습니다.
            </p>
          )}
        </div>
      )}

      {team.report && (
        <ReportViewer
          report={team.report}
          onApprove={handleApprove}
          onRequestRevision={handleRequestRevision}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ReportPage;
