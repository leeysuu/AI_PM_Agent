import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from '../DashboardPage';
import type { Team, Task, Alert } from '../../../types';

/**
 * 대시보드 실시간 반영 연동 테스트
 * Validates: Requirements 4.7
 *
 * Context 상태 변경 시 칸반보드, 진행률 바, 알림 타임라인이 즉시 업데이트되는지 검증한다.
 * React Context + useReducer 아키텍처에서 상태 변경 → 리렌더링 → UI 반영 흐름을 테스트한다.
 */

const mockDispatch = vi.fn();
let mockTeam: Team | null = null;

vi.mock('../../../context/TeamContext', () => ({
  useTeamContext: () => ({ team: mockTeam, dispatch: mockDispatch }),
}));

vi.mock('../../../hooks/useAISuggestion', () => ({
  useAISuggestion: () => ({
    suggestions: [],
    processing: false,
    maxRoundReached: false,
    acceptSuggestion: vi.fn(),
    rejectSuggestion: vi.fn(),
  }),
}));

const today = new Date();
const deadline = new Date(today);
deadline.setDate(deadline.getDate() + 10);

const baseTasks: Task[] = [
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
];

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 'team-1',
    projectName: '테스트 프로젝트',
    topic: 'AI 연구',
    deadline: deadline.toISOString().split('T')[0],
    members: [
      { id: 'm1', name: '김철수', department: '컴공', strength: '코딩', assignedTasks: ['t1'] },
      { id: 'm2', name: '이영희', department: '디자인', strength: '디자인', assignedTasks: ['t2'] },
    ],
    tasks: [...baseTasks],
    milestones: [],
    chatMessages: [],
    aiSuggestions: [],
    alerts: [],
    report: null,
    pointAccounts: [],
    pointPredictions: [],
    settlementResult: null,
    createdAt: today.toISOString(),
    ...overrides,
  };
}

describe('대시보드 실시간 반영 (Requirement 4.7)', () => {
  beforeEach(() => {
    mockTeam = null;
    mockDispatch.mockClear();
  });

  describe('태스크 상태 변경 → 칸반보드 즉시 반영', () => {
    it('태스크 상태가 todo→inProgress로 변경되면 칸반보드 컬럼이 업데이트된다', () => {
      // 초기: t2는 todo
      mockTeam = makeTeam();
      const { rerender } = render(<DashboardPage />);
      // To Do 컬럼에 '본론 작성'이 있어야 함
      expect(screen.getByText('본론 작성')).toBeInTheDocument();

      // 상태 변경: t2를 inProgress로 변경
      mockTeam = makeTeam({
        tasks: [
          baseTasks[0],
          { ...baseTasks[1], status: 'inProgress' },
        ],
      });
      rerender(<DashboardPage />);

      // 여전히 '본론 작성'이 표시되지만, 이제 In Progress 컬럼에 있어야 함
      expect(screen.getByText('본론 작성')).toBeInTheDocument();
      // In Progress 컬럼에 2개 태스크 (t1 + t2)
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('태스크 상태가 inProgress→done으로 변경되면 Done 컬럼에 반영된다', () => {
      mockTeam = makeTeam();
      const { rerender } = render(<DashboardPage />);

      // t1을 done으로 변경
      mockTeam = makeTeam({
        tasks: [
          { ...baseTasks[0], status: 'done', progress: 100 },
          baseTasks[1],
        ],
      });
      rerender(<DashboardPage />);

      // '서론 작성'이 Done 컬럼에 표시되어야 함
      expect(screen.getByText('서론 작성')).toBeInTheDocument();
      // 완료 뱃지가 표시되어야 함
      expect(screen.getByText('완료')).toBeInTheDocument();
    });
  });

  describe('태스크 진행률 변경 → 전체 진행률 바 즉시 반영', () => {
    it('태스크 진행률이 변경되면 전체 진행률이 재계산되어 표시된다', () => {
      // 초기: 60% + 40% = avg 50%
      mockTeam = makeTeam();
      const { rerender } = render(<DashboardPage />);
      expect(screen.getByText('50%')).toBeInTheDocument();

      // t1 진행률 80%, t2 진행률 60% → avg 70%
      mockTeam = makeTeam({
        tasks: [
          { ...baseTasks[0], progress: 80 },
          { ...baseTasks[1], progress: 60 },
        ],
      });
      rerender(<DashboardPage />);
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('모든 태스크가 100%가 되면 전체 진행률이 100%로 표시된다', () => {
      mockTeam = makeTeam();
      const { rerender } = render(<DashboardPage />);
      expect(screen.getByText('50%')).toBeInTheDocument();

      mockTeam = makeTeam({
        tasks: [
          { ...baseTasks[0], progress: 100, status: 'done' },
          { ...baseTasks[1], progress: 100, status: 'done' },
        ],
      });
      rerender(<DashboardPage />);
      // 전체 진행률 바 영역에서 100% 확인 (개별 태스크 카드에도 100%가 표시되므로 getAllByText 사용)
      const allProgress = screen.getAllByText('100%');
      // 최소 1개는 전체 진행률 바의 100% (+ 개별 태스크 카드 2개)
      expect(allProgress.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('알림 추가 → 알림 타임라인 즉시 반영', () => {
    it('알림이 없는 상태에서 알림이 추가되면 타임라인에 즉시 표시된다', () => {
      mockTeam = makeTeam({ alerts: [] });
      const { rerender } = render(<DashboardPage />);
      expect(screen.getByText('알림이 없습니다')).toBeInTheDocument();

      const newAlert: Alert = {
        id: 'a1',
        message: '마감 3일 전입니다',
        type: 'deadline',
        target: '김철수',
        priority: 'high',
        createdAt: new Date().toISOString(),
      };
      mockTeam = makeTeam({ alerts: [newAlert] });
      rerender(<DashboardPage />);

      expect(screen.queryByText('알림이 없습니다')).not.toBeInTheDocument();
      expect(screen.getByText('마감 3일 전입니다')).toBeInTheDocument();
    });

    it('기존 알림에 새 알림이 추가되면 모두 표시된다', () => {
      const existingAlert: Alert = {
        id: 'a1', message: '기존 알림', type: 'nudge',
        target: '전체', priority: 'medium', createdAt: '2025-01-09T10:00:00Z',
      };
      mockTeam = makeTeam({ alerts: [existingAlert] });
      const { rerender } = render(<DashboardPage />);
      expect(screen.getByText('기존 알림')).toBeInTheDocument();

      const newAlert: Alert = {
        id: 'a2', message: '새 알림 추가됨', type: 'delay',
        target: '이영희', priority: 'high', createdAt: '2025-01-10T10:00:00Z',
      };
      mockTeam = makeTeam({ alerts: [existingAlert, newAlert] });
      rerender(<DashboardPage />);

      expect(screen.getByText('기존 알림')).toBeInTheDocument();
      expect(screen.getByText('새 알림 추가됨')).toBeInTheDocument();
    });
  });

  describe('복합 상태 변경 → 동시 반영', () => {
    it('태스크 상태 + 진행률 + 알림이 동시에 변경되면 모두 즉시 반영된다', () => {
      mockTeam = makeTeam();
      const { rerender } = render(<DashboardPage />);

      // 초기 상태 확인
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('알림이 없습니다')).toBeInTheDocument();

      // 복합 변경: t1 done(100%), t2 진행률 80%, 알림 추가
      mockTeam = makeTeam({
        tasks: [
          { ...baseTasks[0], status: 'done', progress: 100 },
          { ...baseTasks[1], status: 'inProgress', progress: 80 },
        ],
        alerts: [{
          id: 'a1', message: '서론 작성 완료!', type: 'completion',
          target: '김철수', priority: 'low', createdAt: new Date().toISOString(),
        }],
      });
      rerender(<DashboardPage />);

      // 진행률: (100 + 80) / 2 = 90%
      expect(screen.getByText('90%')).toBeInTheDocument();
      // 완료 뱃지
      expect(screen.getByText('완료')).toBeInTheDocument();
      // 알림 표시
      expect(screen.getByText('서론 작성 완료!')).toBeInTheDocument();
      expect(screen.queryByText('알림이 없습니다')).not.toBeInTheDocument();
    });
  });
});
