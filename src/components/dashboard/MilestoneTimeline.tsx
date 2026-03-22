import type { Milestone } from '../../types';

interface MilestoneTimelineProps {
  milestones: Milestone[];
}

export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  if (milestones.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-400 text-sm">
        마일스톤이 없습니다
      </div>
    );
  }

  const sorted = [...milestones].sort((a, b) => a.week - b.week);

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-blue-200" />

      {sorted.map((ms, idx) => (
        <div key={ms.week} className={`relative ${idx < sorted.length - 1 ? 'pb-4' : ''}`}>
          {/* Dot */}
          <div className="absolute -left-3.5 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />

          <div className="ml-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Week {ms.week}
              </span>
              <span className="text-xs text-gray-400">
                {ms.startDate} ~ {ms.endDate}
              </span>
            </div>

            {ms.goals.length > 0 && (
              <ul className="text-xs text-gray-600 mb-1 space-y-0.5">
                {ms.goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            )}

            {ms.keyDeadlines.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ms.keyDeadlines.map((dl, i) => (
                  <span
                    key={i}
                    className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded"
                  >
                    ⏰ {dl}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
