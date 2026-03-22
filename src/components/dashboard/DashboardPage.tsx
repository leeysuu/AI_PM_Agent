import { useMemo } from 'react';
import { useTeamContext } from '../../context/TeamContext';
import { useAISuggestion } from '../../hooks/useAISuggestion';
import { AISuggestionPanel } from '../suggestion/AISuggestionPanel';
import { AlertTimeline } from './AlertTimeline';
import { KanbanBoard } from './KanbanBoard';
import { MilestoneTimeline } from './MilestoneTimeline';

export function DashboardPage() {
  const { team } = useTeamContext();
  const { suggestions, processing, maxRoundReached, acceptSuggestion, rejectSuggestion } =
    useAISuggestion();

  const daysRemaining = useMemo(() => {
    if (!team) return 0;
    const deadline = new Date(team.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [team]);

  const overallProgress = useMemo(() => {
    if (!team || team.tasks.length === 0) return 0;
    const total = team.tasks.reduce((sum, t) => sum + t.progress, 0);
    return Math.round(total / team.tasks.length);
  }, [team]);

  if (!team) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-gray-500 text-lg">팀을 먼저 생성해주세요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      {/* 상단: 프로젝트 정보 바 */}
      <header className="bg-white rounded-lg shadow p-4 flex items-center gap-6">
        <h2 className="text-xl font-bold text-gray-900 shrink-0">{team.projectName}</h2>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-gray-500">D-day</span>
          <span
            className={`text-lg font-semibold ${daysRemaining <= 3 ? 'text-red-600' : daysRemaining <= 7 ? 'text-yellow-600' : 'text-blue-600'}`}
          >
            {daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? 'D-Day' : `D+${Math.abs(daysRemaining)}`}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-gray-500 shrink-0">진행률</span>
          <div className="flex-1 bg-gray-200 rounded-full h-3 min-w-[100px]">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 shrink-0">{overallProgress}%</span>
        </div>
      </header>

      {/* 메인 콘텐츠: 좌측 칸반보드 + 우측 제안패널/알림 */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* 좌측: 마일스톤 + 칸반보드 영역 */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <section className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">마일스톤 타임라인</h3>
            <MilestoneTimeline milestones={team.milestones} />
          </section>

          <section className="bg-white rounded-lg shadow p-4 flex flex-col flex-1 min-h-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">칸반 보드</h3>
            <KanbanBoard tasks={team.tasks} members={team.members} />
          </section>
        </div>

        {/* 우측: 제안 패널 + 알림 타임라인 */}
        <aside className="w-80 shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-lg shadow p-4 flex-1 overflow-y-auto">
            <AISuggestionPanel
              suggestions={suggestions}
              processing={processing}
              onAccept={acceptSuggestion}
              onReject={rejectSuggestion}
              maxRoundReached={maxRoundReached}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-4 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">알림 타임라인</h3>
            <AlertTimeline alerts={team.alerts} />
          </div>
        </aside>
      </div>
    </div>
  );
}
