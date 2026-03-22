import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReviewResult from './ReviewResult';
import type { Review } from '../../types/index';

function createMockReview(overrides?: Partial<Review>): Review {
  return {
    taskId: 't1',
    scores: {
      completeness: 20,
      logic: 18,
      volume: 15,
      relevance: 22,
      total: 75,
    },
    feedback: ['논리 흐름을 개선하세요', '분량을 늘려주세요'],
    suggestedProgress: 70,
    delayDetection: {
      expectedProgress: 50,
      actualProgress: 70,
      gap: 0,
      severity: 'normal',
    },
    ...overrides,
  };
}

describe('ReviewResult', () => {
  it('renders all 4 score labels and values', () => {
    const review = createMockReview();
    render(<ReviewResult review={review} />);

    expect(screen.getByText('완성도')).toBeInTheDocument();
    expect(screen.getByText('논리성')).toBeInTheDocument();
    expect(screen.getByText('분량')).toBeInTheDocument();
    expect(screen.getByText('주제적합성')).toBeInTheDocument();

    expect(screen.getByText('20/25')).toBeInTheDocument();
    expect(screen.getByText('18/25')).toBeInTheDocument();
    expect(screen.getByText('15/25')).toBeInTheDocument();
    expect(screen.getByText('22/25')).toBeInTheDocument();
  });

  it('renders total score', () => {
    const review = createMockReview();
    render(<ReviewResult review={review} />);
    expect(screen.getByText('75/100')).toBeInTheDocument();
  });

  it('renders suggested progress', () => {
    const review = createMockReview({ suggestedProgress: 85 });
    render(<ReviewResult review={review} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders normal severity badge', () => {
    const review = createMockReview();
    render(<ReviewResult review={review} />);
    expect(screen.getByText('정상')).toBeInTheDocument();
  });

  it('renders warning severity badge', () => {
    const review = createMockReview({
      delayDetection: { expectedProgress: 60, actualProgress: 45, gap: 15, severity: 'warning' },
    });
    render(<ReviewResult review={review} />);
    expect(screen.getByText('주의')).toBeInTheDocument();
  });

  it('renders critical severity badge', () => {
    const review = createMockReview({
      delayDetection: { expectedProgress: 70, actualProgress: 20, gap: 50, severity: 'critical' },
    });
    render(<ReviewResult review={review} />);
    expect(screen.getByText('심각 지연')).toBeInTheDocument();
  });

  it('renders delay detection stats', () => {
    const review = createMockReview({
      delayDetection: { expectedProgress: 60, actualProgress: 40, gap: 20, severity: 'critical' },
    });
    render(<ReviewResult review={review} />);
    expect(screen.getByText(/기대 60%/)).toBeInTheDocument();
    expect(screen.getByText(/실제 40%/)).toBeInTheDocument();
    expect(screen.getByText(/갭 20%/)).toBeInTheDocument();
  });

  it('renders feedback items', () => {
    const review = createMockReview();
    render(<ReviewResult review={review} />);
    expect(screen.getByText('논리 흐름을 개선하세요')).toBeInTheDocument();
    expect(screen.getByText('분량을 늘려주세요')).toBeInTheDocument();
  });

  it('does not render feedback section when empty', () => {
    const review = createMockReview({ feedback: [] });
    render(<ReviewResult review={review} />);
    expect(screen.queryByText('개선 포인트')).not.toBeInTheDocument();
  });
});
