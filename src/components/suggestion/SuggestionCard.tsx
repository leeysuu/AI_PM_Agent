import { useState } from 'react';
import type { AISuggestion } from '../../types';

const typeLabels: Record<AISuggestion['type'], string> = {
  reassign: '🔄 태스크 재배정',
  extend: '📅 마감 연장',
  reduce_scope: '✂️ 범위 축소',
  pair_work: '🤝 페어워크',
  split_task: '🔀 태스크 분할',
};

interface SuggestionCardProps {
  suggestion: AISuggestion;
  onAccept: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  processing: boolean;
}

export function SuggestionCard({ suggestion, onAccept, onReject, processing }: SuggestionCardProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);

  const isPending = suggestion.status === 'pending';

  function handleRejectClick() {
    setRejecting(true);
    setReasonError(false);
  }

  function handleRejectConfirm() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError(true);
      return;
    }
    onReject(suggestion.id, trimmed);
    setRejecting(false);
    setReason('');
    setReasonError(false);
  }

  function handleRejectCancel() {
    setRejecting(false);
    setReason('');
    setReasonError(false);
  }

  const statusBadge = suggestion.status === 'accepted'
    ? <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">수락됨</span>
    : suggestion.status === 'rejected'
      ? <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">거절됨</span>
      : null;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">
          {typeLabels[suggestion.type]} · 라운드 {suggestion.round}
        </span>
        {statusBadge}
      </div>

      <p className="text-sm text-gray-800 mb-3">{suggestion.content}</p>

      {suggestion.status === 'rejected' && suggestion.rejectionReason && (
        <p className="text-xs text-red-600 mb-2">거절 사유: {suggestion.rejectionReason}</p>
      )}

      {isPending && !rejecting && (
        <div className="flex gap-2">
          <button
            onClick={() => onAccept(suggestion.id)}
            disabled={processing}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            수락
          </button>
          <button
            onClick={handleRejectClick}
            disabled={processing}
            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            거절
          </button>
        </div>
      )}

      {isPending && rejecting && (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setReasonError(false); }}
            placeholder="거절 사유를 입력하세요 (필수)"
            className={`w-full border rounded p-2 text-sm resize-none ${reasonError ? 'border-red-500' : 'border-gray-300'}`}
            rows={2}
          />
          {reasonError && (
            <p className="text-xs text-red-500">거절 사유를 입력해야 합니다.</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleRejectConfirm}
              disabled={processing}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              거절 확인
            </button>
            <button
              onClick={handleRejectCancel}
              disabled={processing}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
