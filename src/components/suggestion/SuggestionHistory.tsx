import type { AISuggestion } from '../../types';

const typeLabels: Record<AISuggestion['type'], string> = {
  reassign: '🔄 재배정',
  extend: '📅 마감 연장',
  reduce_scope: '✂️ 범위 축소',
  pair_work: '🤝 페어워크',
  split_task: '🔀 분할',
};

interface SuggestionHistoryProps {
  suggestions: AISuggestion[];
}

export function SuggestionHistory({ suggestions }: SuggestionHistoryProps) {
  const resolved = suggestions.filter((s) => s.status !== 'pending');

  if (resolved.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-2">이전 제안 이력이 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">이전 제안 이력</h4>
      {resolved.map((s) => (
        <div key={s.id} className="border-l-2 border-gray-200 pl-3 py-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{typeLabels[s.type]}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              s.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {s.status === 'accepted' ? '수락' : '거절'}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{s.content}</p>
          {s.rejectionReason && (
            <p className="text-xs text-red-500 mt-0.5">사유: {s.rejectionReason}</p>
          )}
        </div>
      ))}
    </div>
  );
}
