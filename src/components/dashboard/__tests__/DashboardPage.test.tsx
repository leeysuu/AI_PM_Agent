import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from '../DashboardPage';
import type { Team } from '../../../types';

// Mock useTeamContext
const mockDispatch = vi.fn();
let mockTeam: Team | null = null;

vi.mock('../../../context/TeamContext', () => ({
  useTeamContext: () => ({ team: mockTeam, dispatch: mockDispatch }),
}));

// Mock useAISuggestion
vi.mock('../../../hooks/useAISuggestion', () => ({
  useAISuggestion: () => ({
    suggestions: [],
    processing: false,
    maxRoundReached: false,
    acceptSuggestion: vi.fn(),
    rejectSuggestion: vi.fn(),
  }),
}));

function makeTeam(overrides: Partial<Team> = {}): Team {
  const today = new Date();
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + 10);

  return {
    id: 'team-1',
    projectName: '테스트 프로젝트',
    topic: 'AI 연구',
    deadline: deadline.toISOString().split('T')[0],
    members: [
      { id: 'm1', name: '김철수', department: '컴공', strength: '코딩', assignedTasks: ['t1'] },
      { id: 'm2', name: '이영희', department: '디자인', strength: '디자인', assignedTasks: ['t2'] },
    ],
    tasks: [
      {
        id: 't1', title: '서론 작성', description: '', assigneeId: 'm1',
        startDate: today.toISOString(), deadline: deadline.toISOString(),
        progress: 60, status: 'inProgress', difficulty: '중',
        submittedContent: null, review: null, lastUpdated: today.toISOString(),
      },
      {
        id: 't2', title: '본론 작성', description: '', assigneeId: 'm2',
        startDate: today.toISOString(), deadline: deadline.toISOString(),
        progress: 40, status: 'todo', difficulty: '상',
        submittedContent: null, review: null, lastUpdated: today.toISOString(),
      },
    ],
    milestones: [],
    chatMessages: [],
    aiSuggestions: [],
    alerts: [],
    report: null,
    createdAt: today.toISOString(),
    ...overrides,
  };
}

describe('DashboardPage', () => {
  beforeEach(() => {
    mockTeam = null;
    mockDispatch.mockClear();
  });

  it('팀이 없으면 팀 생성 안내 메시지를 표시한다', () => {
    render(<DashboardPage />);
    expect(screen.getByText('팀을 먼저 생성해주세요')).toBeInTheDocument();
  });

  it('프로젝트명을 상단에 표시한다', () => {
    mockTeam = makeTeam();
    render(<DashboardPage />);
    expect(screen.getByText('테스트 프로젝트')).toBeInTheDocument();
  });

  it('D-day 카운트다운을 표시한다', () => {
    mockTeam = makeTeam();
    render(<DashboardPage />);
    expect(screen.getByText('D-10')).toBeInTheDocument();
  });

  it('마감일이 오늘이면 D-Day를 표시한다', () => {
    const today = new Date();
    mockTeam = makeTeam({ deadline: today.toISOString().split('T')[0] });
    render(<DashboardPage />);
    expect(screen.getByText('D-Day')).toBeInTheDocument();
  });

  it('마감일이 지났으면 D+ 형식을 표시한다', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    mockTeam = makeTeam({ deadline: past.toISOString().split('T')[0] });
    render(<DashboardPage />);
    expect(screen.getByText('D+3')).toBeInTheDocument();
  });

  it('전체 진행률 바를 표시한다 (태스크 평균)', () => {
    mockTeam = makeTeam(); // tasks: 60% + 40% = avg 50%
    render(<DashboardPage />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('태스크가 없으면 진행률 0%를 표시한다', () => {
    mockTeam = makeTeam({ tasks: [] });
    render(<DashboardPage />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('칸반보드를 표시한다 (To Do / In Progress / Done 컬럼)', () => {
    mockTeam = makeTeam();
    render(<DashboardPage />);
    expect(screen.getByText('칸반 보드')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('AI 제안 패널을 표시한다', () => {
    mockTeam = makeTeam();
    render(<DashboardPage />);
    expect(screen.getByText('AI 제안')).toBeInTheDocument();
  });

  it('알림 타임라인을 표시한다', () => {
    mockTeam = makeTeam();
    render(<DashboardPage />);
    expect(screen.getByText('알림 타임라인')).toBeInTheDocument();
    expect(screen.getByText('알림이 없습니다')).toBeInTheDocument();
  });

  it('마일스톤 타임라인을 표시한다', () => {
    mockTeam = makeTeam();
    render(<DashboardPage />);
    expect(screen.getByText('마일스톤 타임라인')).toBeInTheDocument();
    expect(screen.getByText('마일스톤이 없습니다')).toBeInTheDocument();
  });

  it('알림이 있으면 알림 타임라인에 표시한다', () => {
    mockTeam = makeTeam({
      alerts: [
        { id: 'a1', message: '마감 임박', type: 'deadline', target: '김철수', priority: 'high', createdAt: new Date().toISOString() },
      ],
    });
    render(<DashboardPage />);
    expect(screen.getByText('마감 임박')).toBeInTheDocument();
  });

  it('마일스톤이 있으면 마일스톤 타임라인에 표시한다', () => {
    mockTeam = makeTeam({
      milestones: [
        { week: 1, startDate: '2025-01-06', endDate: '2025-01-12', goals: ['자료 조사'], keyDeadlines: [] },
      ],
    });
    render(<DashboardPage />);
    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('자료 조사')).toBeInTheDocument();
  });
});
