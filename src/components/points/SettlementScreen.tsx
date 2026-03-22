import React from 'react';
import { useTeamContext } from '../../context/TeamContext';

const SettlementScreen: React.FC = () => {
  const { team } = useTeamContext();

  if (!team?.settlementResult) return null;

  const { members, bestCollaborator, aiComment } = team.settlementResult;
  const bestMember = team.members.find((m) => m.id === bestCollaborator);

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">📊 프로젝트 정산 결과</h2>
        <p className="mt-1 text-sm text-gray-500">{aiComment}</p>
      </div>

      {/* Best Collaborator */}
      {bestMember && (
        <div className="rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 p-4 text-center">
          <p className="text-2xl">🏆</p>
          <p className="mt-1 text-sm font-bold text-yellow-800">Best Collaborator</p>
          <p className="text-lg font-semibold text-yellow-900">{bestMember.name}</p>
          {members.find((m) => m.memberId === bestCollaborator)?.certificate && (
            <p className="mt-1 text-xs text-yellow-700">
              {members.find((m) => m.memberId === bestCollaborator)?.certificate?.projectName}
            </p>
          )}
        </div>
      )}

      {/* 기여도 바 차트 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">팀원별 정산</h3>
        {members.map((result) => {
          const member = team.members.find((m) => m.id === result.memberId);
          const maxPoints = Math.max(...members.map((m) => m.totalPoints), 1);
          const barWidth = (result.totalPoints / maxPoints) * 100;

          return (
            <div key={result.memberId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {member?.name ?? '알 수 없음'}
                  {result.badge && (
                    <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      {result.badge}
                    </span>
                  )}
                </span>
                <span className={`font-bold ${result.pointChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.pointChange >= 0 ? '+' : ''}{result.pointChange}pt → {result.totalPoints}pt
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{result.reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SettlementScreen;
