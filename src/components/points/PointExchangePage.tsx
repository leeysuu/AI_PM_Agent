import React, { useState } from 'react';
import { useTeamContext } from '../../context/TeamContext';
import { usePoints } from '../../hooks/usePoints';
import type { ExchangeItem } from '../../types';

const EXCHANGE_ITEMS: ExchangeItem[] = [
  { id: 'match', name: 'AI 매칭 추천', description: '다음 프로젝트 팀원 AI 매칭 추천 1회', cost: 20 },
  { id: 'resume', name: '공모전 자소서 생성', description: 'AI 공모전 자기소개서 자동 생성 1회', cost: 15 },
  { id: 'badge', name: '우수 협업자 인증 뱃지', description: '프로필에 표시되는 우수 협업자 뱃지', cost: 50 },
];

const PointExchangePage: React.FC = () => {
  const { team } = useTeamContext();
  const { exchangePoints, getAccount } = usePoints();
  const [message, setMessage] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  if (!team || team.members.length === 0) {
    return <p className="p-4 text-sm text-gray-500">팀을 먼저 생성해주세요.</p>;
  }

  const memberId = selectedMemberId ?? team.members[0]?.id ?? '';
  const account = getAccount(memberId);
  const member = team.members.find((m) => m.id === memberId);

  if (!account || !member) {
    return <p className="p-4 text-sm text-gray-500">포인트 계정을 찾을 수 없습니다.</p>;
  }

  const handleExchange = (item: ExchangeItem) => {
    if (account.balance < item.cost) {
      setMessage(`잔액이 부족합니다. (현재: ${account.balance}pt, 필요: ${item.cost}pt)`);
      return;
    }
    const success = exchangePoints(memberId, item.name, item.cost);
    if (success) {
      setMessage(`✅ "${item.name}" 교환 완료! (-${item.cost}pt)`);
    } else {
      setMessage('교환에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">포인트 교환</h2>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
          {account.balance}pt
        </span>
      </div>

      {/* 멤버 선택 */}
      <div className="flex items-center gap-2">
        <label htmlFor="member-select" className="text-sm text-gray-600">팀원 선택:</label>
        <select
          id="member-select"
          value={memberId}
          onChange={(e) => { setSelectedMemberId(e.target.value); setMessage(null); }}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        >
          {team.members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {message && (
        <div className={`rounded-md p-3 text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="space-y-3">
        {EXCHANGE_ITEMS.map((item) => {
          const canAfford = account.balance >= item.cost;
          return (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleExchange(item)}
                disabled={!canAfford}
                className="ml-4 shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {item.cost}pt
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PointExchangePage;
