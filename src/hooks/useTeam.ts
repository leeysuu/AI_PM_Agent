import { useState, useCallback } from 'react';
import { useTeamContext } from '../context/TeamContext';
import { createTeam as apiCreateTeam } from '../api/teamApi';
import type { Team, Member, AppliedChange } from '../types/index';

interface TeamCreateInput {
  projectName: string;
  topic: string;
  deadline: string;
  members: { name: string; department: string; strength: string }[];
}

export function useTeam() {
  const { team, dispatch } = useTeamContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTeam = useCallback(
    async (input: TeamCreateInput) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiCreateTeam(input);

        // Build member entities with generated IDs
        const memberEntities: Member[] = input.members.map((m) => ({
          id: crypto.randomUUID(),
          name: m.name,
          department: m.department,
          strength: m.strength,
          assignedTasks: [],
        }));

        // Map task assigneeId from name to member id
        const nameToId = new Map(memberEntities.map((m) => [m.name, m.id]));
        const mappedTasks = response.tasks.map((task) => ({
          ...task,
          assigneeId: nameToId.get(task.assigneeId) ?? task.assigneeId,
        }));

        // Update member assignedTasks
        const finalMembers = memberEntities.map((m) => ({
          ...m,
          assignedTasks: mappedTasks.filter((t) => t.assigneeId === m.id).map((t) => t.id),
        }));

        const newTeam: Team = {
          id: crypto.randomUUID(),
          projectName: input.projectName,
          topic: input.topic,
          deadline: input.deadline,
          members: finalMembers,
          tasks: mappedTasks,
          milestones: response.milestones,
          chatMessages: [],
          aiSuggestions: [],
          alerts: [],
          report: null,
          createdAt: new Date().toISOString(),
        };

        dispatch({ type: 'SET_TEAM', payload: newTeam });
      } catch (err) {
        const message = err instanceof Error ? err.message : '팀 생성 중 오류가 발생했습니다.';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [dispatch],
  );

  const updateTaskProgress = useCallback(
    (taskId: string, progress: number) => {
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          taskId,
          updates: {
            progress,
            status: progress >= 100 ? 'done' : progress > 0 ? 'inProgress' : 'todo',
            lastUpdated: new Date().toISOString(),
          },
        },
      });
    },
    [dispatch],
  );

  const applyChanges = useCallback(
    (changes: AppliedChange[]) => {
      dispatch({ type: 'APPLY_CHANGES', payload: changes });
    },
    [dispatch],
  );

  return { team, loading, error, createTeam, updateTaskProgress, applyChanges };
}
