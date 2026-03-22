import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamCreatePage from './TeamCreatePage';
import { TeamProvider } from '../../context/TeamContext';

// Mock the API so we never make real network calls
vi.mock('../../api/teamApi', () => ({
  createTeam: vi.fn(),
}));

function renderPage() {
  return render(
    <TeamProvider>
      <TeamCreatePage />
    </TeamProvider>,
  );
}

function addMember(name: string, dept: string, strength: string) {
  const nameInput = screen.getByLabelText('팀원 이름');
  const deptInput = screen.getByLabelText('팀원 학과');
  const strengthInput = screen.getByLabelText('팀원 강점');
  const addBtn = screen.getByRole('button', { name: '추가' });

  fireEvent.change(nameInput, { target: { value: name } });
  fireEvent.change(deptInput, { target: { value: dept } });
  fireEvent.change(strengthInput, { target: { value: strength } });
  fireEvent.click(addBtn);
}

describe('TeamCreatePage 유효성 검증', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('필수 필드 누락 시 제출을 차단하고 에러 메시지를 표시한다', () => {
    renderPage();

    const submitBtn = screen.getByRole('button', { name: '팀 생성하기' });
    fireEvent.click(submitBtn);

    expect(screen.getByText('프로젝트명을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('마감일을 선택해주세요.')).toBeInTheDocument();
    expect(screen.getByText('최소 2명의 팀원을 추가해주세요.')).toBeInTheDocument();
  });

  it('과거 마감일 설정 시 제출을 차단한다', () => {
    renderPage();

    const projectNameInput = screen.getByLabelText(/프로젝트명/);
    fireEvent.change(projectNameInput, { target: { value: '테스트 프로젝트' } });

    const deadlineInput = screen.getByLabelText(/마감일/);
    fireEvent.change(deadlineInput, { target: { value: '2020-01-01' } });

    addMember('김철수', '컴퓨터공학과', '프로그래밍');
    addMember('이영희', '디자인학과', '디자인');

    const submitBtn = screen.getByRole('button', { name: '팀 생성하기' });
    fireEvent.click(submitBtn);

    expect(screen.getByText('마감일은 오늘 이후 날짜여야 합니다.')).toBeInTheDocument();
  });

  it('팀원 2명 미만일 때 제출을 차단한다', () => {
    renderPage();

    const projectNameInput = screen.getByLabelText(/프로젝트명/);
    fireEvent.change(projectNameInput, { target: { value: '테스트 프로젝트' } });

    const deadlineInput = screen.getByLabelText(/마감일/);
    fireEvent.change(deadlineInput, { target: { value: '2099-12-31' } });

    addMember('김철수', '컴퓨터공학과', '프로그래밍');

    const submitBtn = screen.getByRole('button', { name: '팀 생성하기' });
    fireEvent.click(submitBtn);

    expect(screen.getByText('최소 2명의 팀원을 추가해주세요.')).toBeInTheDocument();
  });

  it('팀원을 추가하고 삭제할 수 있다', () => {
    renderPage();

    addMember('김철수', '컴퓨터공학과', '프로그래밍');
    addMember('이영희', '디자인학과', '디자인');

    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText('이영희')).toBeInTheDocument();

    const deleteBtn = screen.getByLabelText('김철수 삭제');
    fireEvent.click(deleteBtn);

    expect(screen.queryByText('김철수')).not.toBeInTheDocument();
    expect(screen.getByText('이영희')).toBeInTheDocument();
  });

  it('오늘 날짜와 같은 마감일도 차단한다', () => {
    renderPage();

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    const projectNameInput = screen.getByLabelText(/프로젝트명/);
    fireEvent.change(projectNameInput, { target: { value: '테스트' } });

    const deadlineInput = screen.getByLabelText(/마감일/);
    fireEvent.change(deadlineInput, { target: { value: todayStr } });

    addMember('A', '학과1', '강점1');
    addMember('B', '학과2', '강점2');

    const submitBtn = screen.getByRole('button', { name: '팀 생성하기' });
    fireEvent.click(submitBtn);

    expect(screen.getByText('마감일은 오늘 이후 날짜여야 합니다.')).toBeInTheDocument();
  });
});
