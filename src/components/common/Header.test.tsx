import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';

function mockToday(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(y, m - 1, d, 12, 0, 0));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Header', () => {
  const defaultProps = {
    projectName: 'AI 연구 프로젝트',
    deadline: '2025-08-15',
    activeTab: '대시보드',
    onTabChange: vi.fn(),
  };

  it('displays the project name', () => {
    mockToday('2025-07-01');
    render(<Header {...defaultProps} />);
    expect(screen.getByText('AI 연구 프로젝트')).toBeTruthy();
  });

  it('displays D-day countdown for future deadline', () => {
    mockToday('2025-08-10');
    render(<Header {...defaultProps} />);
    expect(screen.getByText('D-5')).toBeTruthy();
  });

  it('displays D-Day when deadline is today', () => {
    mockToday('2025-08-15');
    render(<Header {...defaultProps} />);
    expect(screen.getByText('D-Day')).toBeTruthy();
  });

  it('displays D+ for past deadline', () => {
    mockToday('2025-08-18');
    render(<Header {...defaultProps} />);
    expect(screen.getByText('D+3')).toBeTruthy();
  });

  it('renders all 5 navigation tabs', () => {
    mockToday('2025-07-01');
    render(<Header {...defaultProps} />);
    expect(screen.getByText('팀 생성')).toBeTruthy();
    expect(screen.getByText('대시보드')).toBeTruthy();
    expect(screen.getByText('채팅')).toBeTruthy();
    expect(screen.getByText('보고서')).toBeTruthy();
    expect(screen.getByText('마켓플레이스')).toBeTruthy();
  });

  it('marks active tab with aria-current="page"', () => {
    mockToday('2025-07-01');
    render(<Header {...defaultProps} />);
    const activeButton = screen.getByText('대시보드');
    expect(activeButton).toHaveAttribute('aria-current', 'page');
  });

  it('does not set aria-current on inactive tabs', () => {
    mockToday('2025-07-01');
    render(<Header {...defaultProps} />);
    const inactiveButton = screen.getByText('채팅');
    expect(inactiveButton).not.toHaveAttribute('aria-current');
  });

  it('calls onTabChange with tab name when clicked', () => {
    mockToday('2025-07-01');
    const onTabChange = vi.fn();
    render(<Header {...defaultProps} onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText('채팅'));
    expect(onTabChange).toHaveBeenCalledWith('채팅');
  });

  it('has navigation landmark with label', () => {
    mockToday('2025-07-01');
    render(<Header {...defaultProps} />);
    expect(screen.getByRole('navigation', { name: '메인 네비게이션' })).toBeTruthy();
  });
});
