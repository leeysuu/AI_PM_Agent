import { useState, useEffect, useRef } from 'react';
import { TeamProvider, useTeamContext } from './context/TeamContext';
import Header from './components/common/Header';
import TeamCreatePage from './components/team/TeamCreatePage';
import ReportPage from './components/report/ReportPage';
import { useProactiveCheck } from './hooks/useProactiveCheck';

type Tab = '팀 생성' | '대시보드' | '채팅' | '보고서' | '마켓플레이스';

const DEFAULT_PROJECT_NAME = 'AI PM 에이전트';
const DEFAULT_DEADLINE = '2099-12-31';

function AppContent() {
  const { team } = useTeamContext();
  const [activeTab, setActiveTab] = useState<Tab>('팀 생성');
  const prevTeamRef = useRef(team);
  const { performCheck } = useProactiveCheck();
  const checkRanRef = useRef(false);

  useEffect(() => {
    if (prevTeamRef.current === null && team !== null) {
      setActiveTab('대시보드');
    }
    prevTeamRef.current = team;
  }, [team]);

  // 팀이 존재하고 대시보드 탭 진입 시 자동 점검 1회 실행
  useEffect(() => {
    if (team && activeTab === '대시보드' && !checkRanRef.current) {
      checkRanRef.current = true;
      performCheck();
    }
    if (activeTab !== '대시보드') {
      checkRanRef.current = false;
    }
  }, [team, activeTab, performCheck]);

  const projectName = team?.projectName ?? DEFAULT_PROJECT_NAME;
  const deadline = team?.deadline ?? DEFAULT_DEADLINE;

  const renderPage = () => {
    switch (activeTab) {
      case '팀 생성':
        return <TeamCreatePage />;
      case '대시보드':
        return <div className="p-6 text-gray-700">대시보드 페이지</div>;
      case '채팅':
        return <div className="p-6 text-gray-700">채팅 페이지</div>;
      case '보고서':
        return <ReportPage />;
      case '마켓플레이스':
        return <div className="p-6 text-gray-700">마켓플레이스 페이지</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        projectName={projectName}
        deadline={deadline}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Tab)}
      />
      <main className="mx-auto max-w-7xl">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <TeamProvider>
      <AppContent />
    </TeamProvider>
  );
}

export default App;
