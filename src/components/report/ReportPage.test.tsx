import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportPage from './ReportPage';
import { TeamContext } from '../../context/TeamContext';
import type { Team, Report, TeamAction } from '../../types/index';
import React from 'react';

const mockMergeReport = vi.fn();
vi.mock('../../api/mergeApi', () => ({
  mergeReport: (...args: unknown[]) => mockMergeReport(...args),
}));

function createMockTeam(overrides?: Partial<Team>): Team {
  return {
    id: 'team-1',
    projectName: '테스트 프로젝트',
    topic: 'AI 연구',
    deadline: '2026-06-01',
    members: [
      { id: 'm1', name: '김철수', department: '컴공', strength: '프로그래밍', assignedTasks: ['t1'] },
      { id: 'm2', name: '이영희', department: '디자인', strength: '디자인', assignedTasks: ['t2'] },
    ],
    tasks: [
      {
        id: 't1', title: '서론 작성', description: '서론', assigneeId: 'm1',
        startDate: '2026-04-01', deadline: '2026-05-01', progress: 100,
        status: 'done', difficulty: '중', submittedContent: '서론 내용', review: null, lastUpdated: '2026-04-20',
      },
      {
        id: 't2', title: '본론 작성', description: '본론', assigneeId: 'm2',
        startDate: '2026-04-01', deadline: '2026-05-01', progress: 100,
        status: 'done', difficulty: '중', submittedContent: '본론 내용', review: null, lastUpdated: '2026-04-20',
      },
    ],
    milestones: [],
    chatMessages: [],
    aiSuggestions: [],
    alerts: [],
    report: null,
    createdAt: '2026-04-01',
    ...overrides,
  };
}

const mockReport: Report = {
  title: 'AI 연구 통합 보고서',
  sections: [
    { title: '서론', content: '서론 병합 내용', author: '김철수', aiComments: ['좋은 도입부입니다'] },
    { title: '본론', content: '본론 병합 내용', author: '이영희', aiComments: ['분석이 탄탄합니다'] },
    { title: '결론', content: '결론 내용', author: 'AI', aiComments: [] },
  ],
  status: 'draft',
  pptSlides: null,
};

function renderWithContext(team: Team | null, dispatch?: React.Dispatch<TeamAction>) {
  const mockDispatch = dispatch ?? vi.fn();
  return {
    dispatch: mockDispatch,
    ...render(
      <TeamContext.Provider value={{ team, dispatch: mockDispatch }}>
        <ReportPage />
      </TeamContext.Provider>,
    ),
  };
}

describe('ReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows message when no team exists', () => {
    renderWithContext(null);
    expect(screen.getByText('팀을 먼저 생성해주세요.')).toBeInTheDocument();
  });

  it('shows incomplete tasks message when not all tasks are done', () => {
    const team = createMockTeam({
      tasks: [
        {
          id: 't1', title: '서론', description: '', assigneeId: 'm1',
          startDate: '2026-04-01', deadline: '2026-05-01', progress: 50,
          status: 'inProgress', difficulty: '중', submittedContent: null, review: null, lastUpdated: '2026-04-20',
        },
      ],
    });
    renderWithContext(team);
    expect(screen.getByText(/아직 완료되지 않은 태스크/)).toBeInTheDocument();
  });

  it('shows merge button when all tasks are done', () => {
    const team = createMockTeam();
    renderWithContext(team);
    expect(screen.getByText('보고서 병합 시작')).toBeInTheDocument();
  });

  it('calls mergeReport and dispatches SET_REPORT on merge click', async () => {
    mockMergeReport.mockResolvedValueOnce({
      report: mockReport,
      pptSlides: [
        { slideNumber: 1, title: '표지', content: '내용', keywords: ['AI'], speakerNotes: '노트' },
      ],
    });

    const dispatch = vi.fn();
    const team = createMockTeam();
    renderWithContext(team, dispatch);

    fireEvent.click(screen.getByText('보고서 병합 시작'));

    await waitFor(() => {
      expect(mockMergeReport).toHaveBeenCalledWith({ teamState: team });
    });

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: 'SET_REPORT',
        payload: expect.objectContaining({
          title: 'AI 연구 통합 보고서',
          status: 'draft',
          sections: expect.arrayContaining([
            expect.objectContaining({ title: '서론', author: '김철수' }),
            expect.objectContaining({ title: '본론', author: '이영희' }),
          ]),
        }),
      });
    });
  });

  it('validates report section structure has required fields', async () => {
    mockMergeReport.mockResolvedValueOnce({
      report: mockReport,
      pptSlides: [],
    });

    const dispatch = vi.fn();
    const team = createMockTeam();
    renderWithContext(team, dispatch);

    fireEvent.click(screen.getByText('보고서 병합 시작'));

    await waitFor(() => {
      const setReportCall = dispatch.mock.calls.find(
        (call) => call[0].type === 'SET_REPORT',
      );
      expect(setReportCall).toBeDefined();

      const report = setReportCall![0].payload as Report;
      expect(report.title).toBeTruthy();
      expect(report.sections.length).toBeGreaterThan(0);

      for (const section of report.sections) {
        expect(section).toHaveProperty('title');
        expect(section).toHaveProperty('content');
        expect(section).toHaveProperty('author');
        expect(section).toHaveProperty('aiComments');
        expect(typeof section.title).toBe('string');
        expect(typeof section.content).toBe('string');
        expect(typeof section.author).toBe('string');
        expect(Array.isArray(section.aiComments)).toBe(true);
      }
    });
  });

  it('renders report viewer after merge completes', async () => {
    const team = createMockTeam({ report: mockReport });
    renderWithContext(team);

    expect(screen.getByText('AI 연구 통합 보고서')).toBeInTheDocument();
    expect(screen.getByText(/1\.\s*서론/)).toBeInTheDocument();
    expect(screen.getByText(/2\.\s*본론/)).toBeInTheDocument();
    expect(screen.getByText(/3\.\s*결론/)).toBeInTheDocument();
    expect(screen.getByText('보고서 승인')).toBeInTheDocument();
    expect(screen.getByText('수정 요청')).toBeInTheDocument();
  });

  it('dispatches APPROVE_REPORT on approve click', () => {
    const dispatch = vi.fn();
    const team = createMockTeam({ report: mockReport });
    renderWithContext(team, dispatch);

    fireEvent.click(screen.getByText('보고서 승인'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'APPROVE_REPORT' });
  });

  it('shows revision feedback input on revision button click', () => {
    const team = createMockTeam({ report: mockReport });
    renderWithContext(team);

    fireEvent.click(screen.getByText('수정 요청'));
    expect(screen.getByPlaceholderText(/수정이 필요한 부분/)).toBeInTheDocument();
  });

  it('calls mergeReport with feedback on revision submit', async () => {
    mockMergeReport.mockResolvedValueOnce({
      report: { ...mockReport, title: '수정된 보고서' },
      pptSlides: [],
    });

    const dispatch = vi.fn();
    const team = createMockTeam({ report: mockReport });
    renderWithContext(team, dispatch);

    fireEvent.click(screen.getByText('수정 요청'));
    const textarea = screen.getByPlaceholderText(/수정이 필요한 부분/);
    fireEvent.change(textarea, { target: { value: '서론 보강 필요' } });
    fireEvent.click(screen.getByText('수정 요청 전송'));

    await waitFor(() => {
      expect(mockMergeReport).toHaveBeenCalledWith(
        expect.objectContaining({ feedback: '서론 보강 필요' }),
      );
    });
  });

  it('shows error message on merge failure', async () => {
    mockMergeReport.mockRejectedValueOnce(new Error('네트워크 오류'));

    const team = createMockTeam();
    renderWithContext(team);

    fireEvent.click(screen.getByText('보고서 병합 시작'));

    await waitFor(() => {
      expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
    });
  });

  it('hides approve/revision buttons when report is approved', () => {
    const approvedReport: Report = { ...mockReport, status: 'approved' };
    const team = createMockTeam({ report: approvedReport });
    renderWithContext(team);

    expect(screen.getByText('승인됨')).toBeInTheDocument();
    expect(screen.queryByText('보고서 승인')).not.toBeInTheDocument();
    expect(screen.queryByText('수정 요청')).not.toBeInTheDocument();
  });

  it('displays section authors and AI comments', () => {
    const team = createMockTeam({ report: mockReport });
    renderWithContext(team);

    expect(screen.getByText(/김철수/)).toBeInTheDocument();
    expect(screen.getByText(/이영희/)).toBeInTheDocument();
    expect(screen.getByText('좋은 도입부입니다')).toBeInTheDocument();
    expect(screen.getByText('분석이 탄탄합니다')).toBeInTheDocument();
  });
});
