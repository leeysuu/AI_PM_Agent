import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { KanbanBoard } from '../KanbanBoard';
import type { Task, Member } from '../../../types';

const members: Member[] = [
  { id: 'm1', name: '김철수', department: '컴공', strength: '코딩', assignedTasks: ['t1'] },
  { id: 'm2', name: '이영희', department: '디자인', strength: '디자인', assignedTasks: ['t2', 't3'] },
];

const now = new Date().toISOString();
const futureDeadline = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
const pastDeadline = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 't0',
    title: '기본 태스크',
    description: '',
    assigneeId: 'm1',
    startDate: now,
    deadline: futureDeadline,
    progress: 0,
    status: 'todo',
    difficulty: '중',
    submittedContent: null,
    review: null,
    lastUpdated: now,
    ...overrides,
  };
}

describe('KanbanBoard', () => {
  it('태스크를 To Do, In Progress, Done 3개 컬럼으로 분류하여 표시한다', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', title: '할일 태스크', status: 'todo' }),
      makeTask({ id: 't2', title: '진행중 태스크', status: 'inProgress' }),
      makeTask({ id: 't3', title: '완료 태스크', status: 'done' }),
    ];
    render(<KanbanBoard tasks={tasks} members={members} />);

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('할일 태스크')).toBeInTheDocument();
    expect(screen.getByText('진행중 태스크')).toBeInTheDocument();
    expect(screen.getByText('완료 태스크')).toBeInTheDocument();
  });

  it('태스크가 없으면 각 컬럼에 빈 상태를 표시한다', () => {
    render(<KanbanBoard tasks={[]} members={members} />);
    const emptyMessages = screen.getAllByText('태스크 없음');
    expect(emptyMessages).toHaveLength(3);
  });

  it('각 컬럼의 태스크 개수를 표시한다', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', status: 'todo' }),
      makeTask({ id: 't2', status: 'todo' }),
      makeTask({ id: 't3', status: 'inProgress' }),
    ];
    render(<KanbanBoard tasks={tasks} members={members} />);
    // To Do: 2, In Progress: 1, Done: 0
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

describe('TaskCard', () => {
  it('제목, 담당자, 마감일, 진행률, 난이도를 표시한다', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', title: '서론 작성', assigneeId: 'm1', progress: 60, difficulty: '상' }),
    ];
    render(<KanbanBoard tasks={tasks} members={members} />);

    expect(screen.getByText('서론 작성')).toBeInTheDocument();
    expect(screen.getByText(/김철수/)).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('난이도: 상')).toBeInTheDocument();
  });

  it('상태 뱃지 - done이면 완료를 표시한다', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', status: 'done' }),
    ];
    render(<KanbanBoard tasks={tasks} members={members} />);
    expect(screen.getByText('완료')).toBeInTheDocument();
  });

  it('상태 뱃지 - 마감일이 지났고 done이 아니면 지연을 표시한다', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', status: 'inProgress', deadline: pastDeadline }),
    ];
    render(<KanbanBoard tasks={tasks} members={members} />);
    expect(screen.getByText('지연')).toBeInTheDocument();
  });

  it('상태 뱃지 - 마감일 전이고 done이 아니면 정상을 표시한다', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', status: 'todo', deadline: futureDeadline }),
    ];
    render(<KanbanBoard tasks={tasks} members={members} />);
    expect(screen.getByText('정상')).toBeInTheDocument();
  });

  it('난이도 뱃지 - 상(빨강), 중(노랑), 하(초록) 색상 클래스를 적용한다', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', title: '상 태스크', difficulty: '상' }),
      makeTask({ id: 't2', title: '중 태스크', difficulty: '중', status: 'inProgress' }),
      makeTask({ id: 't3', title: '하 태스크', difficulty: '하', status: 'done' }),
    ];
    render(<KanbanBoard tasks={tasks} members={members} />);
    expect(screen.getByText('난이도: 상')).toBeInTheDocument();
    expect(screen.getByText('난이도: 중')).toBeInTheDocument();
    expect(screen.getByText('난이도: 하')).toBeInTheDocument();
  });

  it('todo/inProgress 상태에서 결과물 제출 버튼을 표시한다', () => {
    const onSubmit = vi.fn();
    const tasks: Task[] = [
      makeTask({ id: 't1', status: 'todo' }),
      makeTask({ id: 't2', status: 'inProgress' }),
    ];
    render(<KanbanBoard tasks={tasks} members={members} onSubmitWork={onSubmit} />);
    const buttons = screen.getAllByText('결과물 제출');
    expect(buttons).toHaveLength(2);
  });

  it('done 상태에서는 결과물 제출 버튼을 표시하지 않는다', () => {
    const onSubmit = vi.fn();
    const tasks: Task[] = [
      makeTask({ id: 't1', status: 'done', title: '완료된 태스크' }),
    ];
    render(<KanbanBoard tasks={tasks} members={members} onSubmitWork={onSubmit} />);
    expect(screen.queryByText('결과물 제출')).not.toBeInTheDocument();
  });

  it('결과물 제출 버튼 클릭 시 onSubmitWork 콜백을 호출한다', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const tasks: Task[] = [
      makeTask({ id: 't1', status: 'todo' }),
    ];
    render(<KanbanBoard tasks={tasks} members={members} onSubmitWork={onSubmit} />);
    await user.click(screen.getByText('결과물 제출'));
    expect(onSubmit).toHaveBeenCalledWith('t1');
  });

  it('assigneeId에 해당하는 멤버가 없으면 미배정을 표시한다', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', assigneeId: 'unknown-id' }),
    ];
    render(<KanbanBoard tasks={tasks} members={members} />);
    expect(screen.getByText(/미배정/)).toBeInTheDocument();
  });
});
