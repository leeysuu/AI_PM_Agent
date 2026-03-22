import React, { useState } from 'react';
import type { Report } from '../../types/index';

interface ReportViewerProps {
  report: Report;
  onApprove: () => void;
  onRequestRevision: (feedback: string) => void;
  loading?: boolean;
}

const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  onApprove,
  onRequestRevision,
  loading = false,
}) => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const handleRevisionSubmit = () => {
    if (!feedback.trim()) {
      setFeedbackError('수정 요청 내용을 입력해주세요.');
      return;
    }
    setFeedbackError(null);
    onRequestRevision(feedback.trim());
    setFeedback('');
    setFeedbackOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 보고서 제목 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{report.title}</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            report.status === 'approved'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {report.status === 'approved' ? '승인됨' : '초안'}
        </span>
      </div>

      {/* 섹션 목록 */}
      <div className="space-y-4">
        {report.sections.map((section, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-gray-200 bg-white p-5"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                {idx + 1}. {section.title}
              </h3>
              <span className="text-xs text-gray-400">작성자: {section.author}</span>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {section.content}
            </div>
            {section.aiComments.length > 0 && (
              <div className="mt-3 rounded-md bg-blue-50 p-3">
                <p className="mb-1 text-xs font-medium text-blue-700">AI 코멘트</p>
                <ul className="list-inside list-disc space-y-1 text-xs text-blue-600">
                  {section.aiComments.map((comment, ci) => (
                    <li key={ci}>{comment}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 승인/수정 요청 버튼 */}
      {report.status !== 'approved' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onApprove}
              disabled={loading}
              className="rounded-md bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '처리 중...' : '보고서 승인'}
            </button>
            <button
              type="button"
              onClick={() => setFeedbackOpen(!feedbackOpen)}
              disabled={loading}
              className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              수정 요청
            </button>
          </div>

          {feedbackOpen && (
            <div className="space-y-2">
              <label htmlFor="revision-feedback" className="block text-sm font-medium text-gray-700">
                수정 요청 내용
              </label>
              <textarea
                id="revision-feedback"
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value);
                  if (feedbackError) setFeedbackError(null);
                }}
                placeholder="수정이 필요한 부분을 설명해주세요..."
                rows={4}
                disabled={loading}
                className={`w-full resize-y rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                  feedbackError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {feedbackError && (
                <p className="text-sm text-red-600" role="alert">
                  {feedbackError}
                </p>
              )}
              <button
                type="button"
                onClick={handleRevisionSubmit}
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '전송 중...' : '수정 요청 전송'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportViewer;
