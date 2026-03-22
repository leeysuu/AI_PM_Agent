import type { Task, Member } from '../../types';

interface TaskCardProps {
  task: Task;
  members: Member[];
  onSubmitWork?: (taskId: string) => void;
}

function getAssigneeName(members: Member[], assigneeId: string): string {
  const member = members.find((m) => m.id === assigneeId);
  return member?.name ?? '미배정';
}

function getStatusBadge(task: Task): { label: string; className: string } {
  if (task.status === 'done') {
    return { label: '완료', className: 'bg-green-100 text-green-700' };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(task.deadline);
  deadline.setHours(0, 0, 0, 0);
  if (today > deadline) {
    return { label: '지연', className: 'bg-red-100 text-red-700' };
  }
  return { label: '정상', className: 'bg-blue-100 text-blue-700' };
}

function getDifficultyBadge(difficulty: Task['difficulty']): { label: string; className: string } {
  switch (difficulty) {
    case '상':
      return { label: '상', className: 'bg-red-100 text-red-700' };
    case '중':
      return { label: '중', className: 'bg-yellow-100 text-yellow-700' };
    case '하':
      return { label: '하', className: 'bg-green-100 text-green-700' };
  }
}

export function TaskCard({ task, members, onSubmitWork }: TaskCardProps) {
  const assigneeName = getAssigneeName(members, task.assigneeId);
  const statusBadge = getStatusBadge(task);
  const difficultyBadge = getDifficultyBadge(task.difficulty);
  const deadlineFormatted = new Date(task.deadline).toLocaleDateString('ko-KR');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-gray-900 leading-tight">{task.title}</h4>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <span>👤 {assigneeName}</span>
        <span>📅 {deadlineFormatted}</span>
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${difficultyBadge.className}`}>
          난이도: {difficultyBadge.label}
        </span>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>진행률</span>
          <span>{task.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      {(task.status === 'todo' || task.status === 'inProgress') && onSubmitWork && (
        <button
          type="button"
          onClick={() => onSubmitWork(task.id)}
          className="w-full text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded px-2 py-1.5 transition-colors"
        >
          결과물 제출
        </button>
      )}
    </div>
  );
}
