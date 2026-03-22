import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MilestoneTimeline } from '../MilestoneTimeline';
import type { Milestone } from '../../../types';

function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    week: 1,
    startDate: '2025-01-06',
    endDate: '2025-01-12',
    goals: ['서론 초안 작성'],
    keyDeadlines: ['서론 마감'],
    ...overrides,
  };
}

describe('MilestoneTimeline', () => {
  it('마일스톤이 없으면 안내 메시지를 표시한다', () => {
    render(<MilestoneTimeline milestones={[]} />);
    expect(screen.getByText('마일스톤이 없습니다')).toBeInTheDocument();
  });

  it('주차 번호와 날짜 범위를 표시한다', () => {
    render(<MilestoneTimeline milestones={[makeMilestone()]} />);
    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('2025-01-06 ~ 2025-01-12')).toBeInTheDocument();
  });

  it('목표 목록을 표시한다', () => {
    render(
      <MilestoneTimeline
        milestones={[makeMilestone({ goals: ['목표 A', '목표 B'] })]}
      />,
    );
    expect(screen.getByText('목표 A')).toBeInTheDocument();
    expect(screen.getByText('목표 B')).toBeInTheDocument();
  });

  it('핵심 마감일을 표시한다', () => {
    render(
      <MilestoneTimeline
        milestones={[makeMilestone({ keyDeadlines: ['중간 발표'] })]}
      />,
    );
    expect(screen.getByText(/중간 발표/)).toBeInTheDocument();
  });

  it('주차 순서대로 정렬하여 표시한다', () => {
    const milestones = [
      makeMilestone({ week: 3, startDate: '2025-01-20', endDate: '2025-01-26' }),
      makeMilestone({ week: 1, startDate: '2025-01-06', endDate: '2025-01-12' }),
      makeMilestone({ week: 2, startDate: '2025-01-13', endDate: '2025-01-19' }),
    ];
    render(<MilestoneTimeline milestones={milestones} />);
    const weeks = screen.getAllByText(/^Week \d$/);
    expect(weeks[0]).toHaveTextContent('Week 1');
    expect(weeks[1]).toHaveTextContent('Week 2');
    expect(weeks[2]).toHaveTextContent('Week 3');
  });
});
