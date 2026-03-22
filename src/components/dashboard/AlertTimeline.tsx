import type { Alert } from '../../types';

interface AlertTimelineProps {
  alerts: Alert[];
}

const typeIcons: Record<Alert['type'], string> = {
  deadline: '⏰',
  delay: '⚠️',
  nudge: '💬',
  completion: '✅',
};

const priorityColors: Record<Alert['priority'], string> = {
  high: 'border-l-red-500 bg-red-50',
  medium: 'border-l-yellow-500 bg-yellow-50',
  low: 'border-l-gray-400 bg-gray-50',
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

export function AlertTimeline({ alerts }: AlertTimelineProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        알림이 없습니다
      </div>
    );
  }

  const sorted = [...alerts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      {sorted.map((alert) => (
        <div
          key={alert.id}
          className={`border-l-4 rounded-r-lg p-2 ${priorityColors[alert.priority]}`}
        >
          <div className="flex items-start gap-1.5">
            <span className="text-sm shrink-0">{typeIcons[alert.type]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-700 leading-relaxed">{alert.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{alert.target}</span>
                <span className="text-xs text-gray-400">{formatTimestamp(alert.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
