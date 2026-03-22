import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from './ErrorMessage';

describe('ErrorMessage', () => {
  it('displays the error message text', () => {
    render(<ErrorMessage message="서버 오류가 발생했습니다." />);
    expect(screen.getByText('서버 오류가 발생했습니다.')).toBeTruthy();
  });

  it('has alert role for accessibility', () => {
    render(<ErrorMessage message="에러" />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="에러" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorMessage message="에러" onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeTruthy();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="에러" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
