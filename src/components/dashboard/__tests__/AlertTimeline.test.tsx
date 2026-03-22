import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AlertTimeline } from '../AlertTimeline';
import type { Alert } from '../../../types';

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'a1',
    message: '마감이 임박했습니다',
    type: 'deadline',
    target: '김철수',
    priority: 'high',
    createdAt: '2025-01-10T14:30:00Z',
    ...overrides,
  };
}

describe('AlertTimeline', () => {
  it('알림이 없으면 안내 메시지를 표시한다', () => {
    render(<AlertTimeline alerts={[]} />);
    expect(screen.getByText('알림이 없습니다')).toBeInTheDocument();
  });

  it('알림 메시지와 대상을 표시한다', () => {
    render(<AlertTimeline alerts={[makeAlert()]} />);
    expect(screen.getByText('마감이 임박했습니다')).toBeInTheDocument();
    expect(screen.getByText('김철수')).toBeInTheDocument();
  });

  it('타입별 아이콘을 표시한다', () => {
    const alerts: Alert[] = [
      makeAlert({ id: 'a1', type: 'deadline' }),
      makeAlert({ id: 'a2', type: 'delay', message: '지연 발생' }),
      makeAlert({ id: 'a3', type: 'nudge', message: '독촉 알림' }),
      makeAlert({ id: 'a4', type: 'completion', message: '완료 축하' }),
    ];
    render(<AlertTimeline alerts={alerts} />);
    expect(screen.getByText('⏰')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('💬')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('최신 알림이 먼저 표시된다 (createdAt 내림차순)', () => {
    const alerts: Alert[] = [
      makeAlert({ id: 'a1', message: '오래된 알림', createdAt: '2025-01-08T10:00:00Z' }),
      makeAlert({ id: 'a2', message: '최신 알림', createdAt: '2025-01-10T10:00:00Z' }),
    ];
    render(<AlertTimeline alerts={alerts} />);
    const messages = screen.getAllByText(/알림$/);
    expect(messages[0]).toHaveTextContent('최신 알림');
    expect(messages[1]).toHaveTextContent('오래된 알림');
  });

  it('타임스탬프를 포맷하여 표시한다', () => {
    render(
      <AlertTimeline
        alerts={[makeAlert({ createdAt: '2025-01-10T14:30:00Z' })]}
      />,
    );
    // The exact format depends on timezone, but it should contain the time portion
    expect(screen.getByText(/\d+\/\d+ \d{2}:\d{2}/)).toBeInTheDocument();
  });
});
