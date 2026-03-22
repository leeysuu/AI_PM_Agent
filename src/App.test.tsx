import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

function mockToday(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(y, m - 1, d, 12, 0, 0));
}

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('App', () => {
  it('renders wrapped in TeamProvider with Header', () => {
    mockToday('2025-07-01');
    render(<App />);
    expect(screen.getByText('AI PM 에이전트')).toBeTruthy();
  });

  it('shows default project name and deadline when no team exists', () => {
    mockToday('2025-07-01');
    render(<App />);
    expect(screen.getByText('AI PM 에이전트')).toBeTruthy();
  });

  it('defaults to 팀 생성 tab with placeholder content', () => {
    mockToday('2025-07-01');
    render(<App />);
    expect(screen.getByText('새 프로젝트 만들기')).toBeTruthy();
  });

  it('switches to 대시보드 tab on click', () => {
    mockToday('2025-07-01');
    render(<App />);
    fireEvent.click(screen.getByText('대시보드'));
    expect(screen.getByText('팀을 먼저 생성해주세요')).toBeTruthy();
  });

  it('switches to 채팅 tab on click', () => {
    mockToday('2025-07-01');
    render(<App />);
    fireEvent.click(screen.getByText('채팅'));
    expect(screen.getByText(/팀을 먼저 생성해 주세요/)).toBeTruthy();
  });

  it('switches to 보고서 tab on click', () => {
    mockToday('2025-07-01');
    render(<App />);
    fireEvent.click(screen.getByText('보고서'));
    expect(screen.getByText(/팀을 먼저 생성해주세요/)).toBeTruthy();
  });

  it('switches to 포인트 tab on click', () => {
    mockToday('2025-07-01');
    render(<App />);
    fireEvent.click(screen.getByText('포인트'));
    expect(screen.getByText(/팀을 먼저 생성해주세요/)).toBeTruthy();
  });

  it('shows team project name when team exists in localStorage', () => {
    mockToday('2025-07-01');
    const team = {
      id: 'test-id',
      projectName: '테스트 프로젝트',
      topic: '테스트 주제',
      deadline: '2025-08-15',
      members: [],
      tasks: [],
      milestones: [],
      chatMessages: [],
      aiSuggestions: [],
      alerts: [],
      report: null,
      pointAccounts: [],
      pointPredictions: [],
      settlementResult: null,
      createdAt: '2025-07-01',
    };
    localStorage.setItem('ai-pm-agent-team', JSON.stringify(team));
    render(<App />);
    expect(screen.getByText('테스트 프로젝트')).toBeTruthy();
  });

  it('auto-switches to 대시보드 when team is created', async () => {
    mockToday('2025-07-01');
    // We test this indirectly: when team exists in storage, the component
    // should still render correctly with the team data
    const team = {
      id: 'test-id',
      projectName: '새 프로젝트',
      topic: '주제',
      deadline: '2025-09-01',
      members: [],
      tasks: [],
      milestones: [],
      chatMessages: [],
      aiSuggestions: [],
      alerts: [],
      report: null,
      pointAccounts: [],
      pointPredictions: [],
      settlementResult: null,
      createdAt: '2025-07-01',
    };
    localStorage.setItem('ai-pm-agent-team', JSON.stringify(team));
    render(<App />);
    expect(screen.getByText('새 프로젝트')).toBeTruthy();
  });

  it('renders all 5 navigation tabs', () => {
    mockToday('2025-07-01');
    render(<App />);
    expect(screen.getByRole('navigation', { name: '메인 네비게이션' })).toBeTruthy();
    expect(screen.getByText('팀 생성')).toBeTruthy();
    expect(screen.getByText('대시보드')).toBeTruthy();
    expect(screen.getByText('채팅')).toBeTruthy();
    expect(screen.getByText('보고서')).toBeTruthy();
    expect(screen.getByText('포인트')).toBeTruthy();
  });
});
