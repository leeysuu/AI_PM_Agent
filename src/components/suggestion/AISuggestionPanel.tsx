import type { AISuggestion } from '../../types';
import { SuggestionCard } from './SuggestionCard';
import { SuggestionHistory } from './SuggestionHistory';

interface AISuggestionPanelProps {
  suggestions: AISuggestion[];
  processing: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  maxRoundReached: boolean;
}

export function AISuggestionPanel({
  suggestions,
  processing,
  onAccept,
  onReject,
  maxRoundReached,
}: AISuggestionPanelProps) {
  const pending = suggestions.filter((s) => s.status === 'pending');
  const resolved = suggestions.filter((s) => s.status !== 'pending');

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-700">AI 제안</h3>

      {maxRoundReached && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            💬 팀원 간 직접 논의를 권장합니다. AI 자동 제안이 중단되었습니다.
          </p>
        </div>
      )}

      {pending.length === 0 && !maxRoundReached && (
        <p className="text-sm text-gray-400 text-center py-4">현재 대기 중인 제안이 없습니다.</p>
      )}

      <div className="space-y-3">
        {pending.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            onAccept={onAccept}
            onReject={onReject}
            processing={processing}
          />
        ))}
      </div>

      {resolved.length > 0 && (
        <div className="border-t pt-3">
          <SuggestionHistory suggestions={resolved} />
        </div>
      )}
    </div>
  );
}
