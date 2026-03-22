<<<<<<< HEAD
import { useState } from 'react';
import { useReport } from '../../hooks/useReport';
import PPTPreview from './PPTPreview';

export default function ReportPage() {
  const { report, loading, error, requestMerge, approveReport } = useReport();
  const [feedback, setFeedback] = useState('');

  const handleRequestRevision = () => {
    if (!feedback.trim()) return;
    requestMerge(feedback.trim());
    setFeedback('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
        <p>아직 보고서가 생성되지 않았습니다.</p>
        <button
          type="button"
          onClick={() => requestMerge()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          보고서 병합 요청
        </button>
=======
import React, { useState, useCallback } from 'react';
import { useTeamContext } from '../../context/TeamContext';
import { mergeReport } from '../../api/mergeApi';
import ReportViewer from './ReportViewer';
import LoadingOverlay from '../common/LoadingOverlay';
import ErrorMessage from '../common/ErrorMessage';
import type { Report } from '../../types/index';

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
>>>>>>> origin/main
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="space-y-6 p-4">
      {/* Report Viewer */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{report.title}</h2>
        <div className="space-y-4">
          {report.sections.map((section, idx) => (
            <div key={idx} className="border-l-4 border-blue-200 pl-4">
              <h3 className="font-semibold text-gray-700">{section.title}</h3>
              <p className="text-xs text-gray-400 mb-1">작성자: {section.author}</p>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {section.content}
              </div>
              {section.aiComments.length > 0 && (
                <div className="mt-2 text-xs text-indigo-500">
                  {section.aiComments.map((c, i) => (
                    <p key={i}>💡 {c}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {report.status === 'draft' && (
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={approveReport}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                승인
              </button>
              <button
                type="button"
                onClick={handleRequestRevision}
                disabled={!feedback.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 disabled:opacity-50"
              >
                수정 요청
              </button>
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="수정 피드백을 입력하세요..."
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              rows={3}
            />
          </div>
        )}
      </div>

      {/* PPT Preview — shown after report is approved */}
      {report.status === 'approved' && report.pptSlides && (
        <div className="bg-white rounded-lg shadow p-6">
          <PPTPreview slides={report.pptSlides} title={report.title} />
        </div>
      )}
    </div>
  );
}
=======
    <div className="relative p-6">
      {loading && <LoadingOverlay />}

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
>>>>>>> origin/main
