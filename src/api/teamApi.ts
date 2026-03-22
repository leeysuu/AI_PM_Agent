import type { Task, Milestone } from '../types/index';
import { apiPost } from './apiClient';

interface CreateTeamInput {
  projectName: string;
  topic: string;
  deadline: string;
  members: { name: string; department: string; strength: string }[];
}

interface CreateTeamResponse {
  tasks: Task[];
  milestones: Milestone[];
  aiMessage: string;
}

export async function createTeam(input: CreateTeamInput): Promise<CreateTeamResponse> {
  try {
    return await apiPost<CreateTeamResponse>('/api/team', input);
  } catch (error) {
    const message = error instanceof Error ? error.message : '팀 생성 중 오류가 발생했습니다';
    throw new Error(message);
  }
}
