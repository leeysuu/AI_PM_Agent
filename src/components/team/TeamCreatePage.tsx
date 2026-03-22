import React, { useState, useCallback } from 'react';
import ProjectInfoForm from './ProjectInfoForm';
import MemberAddForm from './MemberAddForm';
import MemberList from './MemberList';
import LoadingOverlay from '../common/LoadingOverlay';
import ErrorMessage from '../common/ErrorMessage';
import { useTeamContext } from '../../context/TeamContext';
import { createTeam } from '../../api/teamApi';
import { usePoints } from '../../hooks/usePoints';
import type { Member, Team } from '../../types/index';

interface MemberInput {
  name: string;
  department: string;
  strength: string;
}

interface FormErrors {
  projectName?: string;
  deadline?: string;
  members?: string;
}

function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function validate(projectName: string, deadline: string, members: MemberInput[]): FormErrors {
  const errors: FormErrors = {};
  if (!projectName.trim()) {
    errors.projectName = '프로젝트명을 입력해주세요.';
  }
  if (!deadline) {
    errors.deadline = '마감일을 선택해주세요.';
  } else if (deadline <= getTodayStr()) {
    errors.deadline = '마감일은 오늘 이후 날짜여야 합니다.';
  }
  if (members.length < 2) {
    errors.members = '최소 2명의 팀원을 추가해주세요.';
  }
  return errors;
}

const TeamCreatePage: React.FC = () => {
  const { dispatch } = useTeamContext();
  const { initializePoints } = usePoints();

  const [projectName, setProjectName] = useState('');
  const [topic, setTopic] = useState('');
  const [deadline, setDeadline] = useState('');
  const [members, setMembers] = useState<MemberInput[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleAddMember = useCallback((member: MemberInput) => {
    setMembers((prev) => [...prev, member]);
    setErrors((prev) => ({ ...prev, members: undefined }));
  }, []);

  const handleRemoveMember = useCallback((index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    const validationErrors = validate(projectName, deadline, members);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setApiError(null);

    try {
      const response = await createTeam({
        projectName: projectName.trim(),
        topic: topic.trim(),
        deadline,
        members,
      });

      const memberEntities: Member[] = members.map((m, i) => ({
        id: crypto.randomUUID(),
        name: m.name,
        department: m.department,
        strength: m.strength,
        assignedTasks: response.tasks
          .filter((t) => {
            const assigneeName = members[i]?.name;
            return response.tasks.some(
              (task) => task.assigneeId === assigneeName && task.id === t.id
            );
          })
          .map((t) => t.id),
      }));

      // Map task assigneeId from name to member id
      const nameToId = new Map(memberEntities.map((m) => [m.name, m.id]));
      const mappedTasks = response.tasks.map((task) => ({
        ...task,
        assigneeId: nameToId.get(task.assigneeId) ?? task.assigneeId,
      }));

      // Update member assignedTasks with mapped task ids
      const finalMembers = memberEntities.map((m) => ({
        ...m,
        assignedTasks: mappedTasks.filter((t) => t.assigneeId === m.id).map((t) => t.id),
      }));

      const team: Team = {
        id: crypto.randomUUID(),
        projectName: projectName.trim(),
        topic: topic.trim(),
        deadline,
        members: finalMembers,
        tasks: mappedTasks,
        milestones: response.milestones,
        chatMessages: [],
        aiSuggestions: [],
        alerts: [],
        report: null,
        pointAccounts: [],
        pointPredictions: [],
        settlementResult: null,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'SET_TEAM', payload: team });

      // 포인트 시스템 초기화 (100pt - 20pt 보증금 = 80pt)
      initializePoints(finalMembers);
    } catch (err) {
      const message = err instanceof Error ? err.message : '팀 생성 중 오류가 발생했습니다.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <LoadingOverlay visible={loading} message="AI가 역할을 분배하고 일정을 생성하고 있습니다..." />

      <h1 className="mb-6 text-2xl font-bold text-gray-900">새 프로젝트 만들기</h1>

      {apiError && (
        <div className="mb-4">
          <ErrorMessage message={apiError} onRetry={handleSubmit} />
        </div>
      )}

      <div className="space-y-8">
        <ProjectInfoForm
          projectName={projectName}
          topic={topic}
          deadline={deadline}
          onProjectNameChange={setProjectName}
          onTopicChange={setTopic}
          onDeadlineChange={setDeadline}
          errors={errors}
        />

        <MemberAddForm onAdd={handleAddMember} />

        <MemberList
          members={members}
          onRemove={handleRemoveMember}
          error={errors.members}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'AI가 분석 중...' : '팀 생성하기'}
        </button>
      </div>
    </div>
  );
};

export default TeamCreatePage;
