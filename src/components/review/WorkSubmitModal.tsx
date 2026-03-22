import React, { useState } from 'react';
import type { Task } from '../../types/index';

interface WorkSubmitModalProps {
  task: Task;
  onSubmit: (taskId: string, content: string) => void;
  onClose: () => void;
  loading?: boolean;
}

const WorkSubmitModal: React.FC<WorkSubmitModalProps> = ({
  task,
  onSubmit,
  onClose,
  loading = false,
}) => {
  const [content, setContent] = useState(task.submittedContent ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!content.trim()) {
      setError('빈 결과물은 제출할 수 없습니다.');
      return;
    }
    setError(null);
    onSubmit(task.id, content.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="결과물 제출"
    >
      <div className="mx-4 w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">결과물 제출</h2>
          <p className="mt-1 text-sm text-gray-500">{task.title}</p>
        </div>

        <div className="px-6 py-4">
          <label htmlFor="work-content" className="mb-2 block text-sm font-medium text-gray-700">
            결과물 내용
          </label>
          <textarea
            id="work-content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
            placeholder="결과물 텍스트를 입력하세요..."
            rows={8}
            disabled={loading}
            className={`w-full resize-y rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '제출 중...' : '제출하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkSubmitModal;
