import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingOverlay from './LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders nothing when visible is false', () => {
    const { container } = render(<LoadingOverlay visible={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders overlay when visible is true', () => {
    render(<LoadingOverlay visible={true} />);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('shows message text when provided', () => {
    render(<LoadingOverlay visible={true} message="데이터 로딩 중..." />);
    expect(screen.getByText('데이터 로딩 중...')).toBeTruthy();
  });

  it('does not show message paragraph when message is not provided', () => {
    const { container } = render(<LoadingOverlay visible={true} />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('has accessible aria-label with message', () => {
    render(<LoadingOverlay visible={true} message="처리 중" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', '처리 중');
  });

  it('has default aria-label when no message', () => {
    render(<LoadingOverlay visible={true} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', '로딩 중');
  });
});
