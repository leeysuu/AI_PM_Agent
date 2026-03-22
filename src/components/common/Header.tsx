import React from 'react';
import { calculateDDay } from '../../utils/dateUtils';

const TABS = ['팀 생성', '대시보드', '채팅', '보고서', '포인트'] as const;

interface HeaderProps {
  projectName: string;
  deadline: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function formatDDay(dday: number): string {
  if (dday > 0) return `D-${dday}`;
  if (dday === 0) return 'D-Day';
  return `D+${Math.abs(dday)}`;
}

const Header: React.FC<HeaderProps> = ({ projectName, deadline, activeTab, onTabChange }) => {
  const dday = calculateDDay(deadline);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">{projectName}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                dday <= 1
                  ? 'bg-red-100 text-red-700'
                  : dday <= 3
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
              }`}
            >
              {formatDDay(dday)}
            </span>
          </div>
        </div>
      </div>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6" aria-label="메인 네비게이션">
        <div className="-mb-px flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;
