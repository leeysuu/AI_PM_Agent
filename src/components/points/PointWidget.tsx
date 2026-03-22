import React from 'react';
import { useTeamContext } from '../../context/TeamContext';
import type { PointAccount } from '../../types';

const PointWidget: React.FC = () => {
  const { team } = useTeamContext();

  if (!team || team.pointAccounts.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">🏅 활동 포인트</h3>
      <div className="space-y-2">
        {team.members.map((member) => {
          const account: PointAccount | undefined = team.pointAccounts.find(
            (a) => a.memberId === member.id
          );
          if (!account) return null;

          const prediction = team.pointPredictions.find((p) => p.memberId === member.id);
          const lastEvent = account.history[account.history.length - 1];

          return (
            <div key={member.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{member.name}</p>
                {lastEvent && (
                  <p className="truncate text-xs text-gray-400">
                    최근: {lastEvent.reason} ({lastEvent.amount > 0 ? '+' : ''}{lastEvent.amount}pt)
                  </p>
                )}
              </div>
              <div className="ml-3 text-right">
                <p className="text-sm font-bold text-blue-600">{account.balance}pt</p>
                {prediction && prediction.predictedChange !== 0 && (
                  <p className={`text-xs ${prediction.predictedChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    예측: {prediction.predictedChange > 0 ? '+' : ''}{prediction.predictedChange}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PointWidget;
