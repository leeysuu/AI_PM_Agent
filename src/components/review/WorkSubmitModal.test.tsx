import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkSubmitModal from './WorkSubmitModal';
import type { Task } from '../../types/index';

function createMockTask(overrides?: Partial<Task>): Task {
  return {
    id: 't1',
    title: '자료 조사',
    description: '관련 논문 조사',
    assigneeId: 'm1',
    startDate: '2025-01-01',
    deadline: '2025-06-30',
    progress: 0,
    status: 'todo',
    difficulty: '중',
    submittedContent: null,
    review: null,
    lastUpdated: '2025-01-01',
    ...overrides,
  };
}

describe('WorkSubmitModal', () => {
  it('renders task title and textarea', () => {
    const task = createMockTask();
    render(<WorkSubmitModal task={task} onSubmit={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText('결과물 제출')).toBeInTheDocument();
    expect(screen.getByText('자료 조사')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('결과물 텍스트를 입력하세요...')).toBeInTheDocument();
  });

  it('blocks submission when content is empty and shows error', () => {
    const onSubmit = vi.fn();
    const task = createMockTask();
    render(<WorkSubmitModal task={task} onSubmit={onSubmit} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('제출하기'));

    expect(screen.getByText('빈 결과물은 제출할 수 없습니다.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks submission when content is only whitespace', () => {
    const onSubmit = vi.fn();
    const task = createMockTask();
    render(<WorkSubmitModal task={task} onSubmit={onSubmit} onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('제출하기'));

    expect(screen.getByText('빈 결과물은 제출할 수 없습니다.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with trimmed content when valid', () => {
    const onSubmit = vi.fn();
    const task = createMockTask();
    render(<WorkSubmitModal task={task} onSubmit={onSubmit} onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  결과물 내용입니다  ' } });
    fireEvent.click(screen.getByText('제출하기'));

    expect(onSubmit).toHaveBeenCalledWith('t1', '결과물 내용입니다');
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    const task = createMockTask();
    render(<WorkSubmitModal task={task} onSubmit={vi.fn()} onClose={onClose} />);

    fireEvent.click(screen.getByText('취소'));
    expect(onClose).toHaveBeenCalled();
  });

  it('pre-fills textarea with existing submittedContent', () => {
    const task = createMockTask({ submittedContent: '기존 결과물' });
    render(<WorkSubmitModal task={task} onSubmit={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('기존 결과물');
  });

  it('clears error when user starts typing', () => {
    const task = createMockTask();
    render(<WorkSubmitModal task={task} onSubmit={vi.fn()} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('제출하기'));
    expect(screen.getByText('빈 결과물은 제출할 수 없습니다.')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '새 내용' } });
    expect(screen.queryByText('빈 결과물은 제출할 수 없습니다.')).not.toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    const task = createMockTask();
    render(<WorkSubmitModal task={task} onSubmit={vi.fn()} onClose={vi.fn()} loading={true} />);

    expect(screen.getByText('제출 중...')).toBeDisabled();
    expect(screen.getByText('취소')).toBeDisabled();
  });
});
