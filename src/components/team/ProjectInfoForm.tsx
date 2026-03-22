import React from 'react';

interface ProjectInfoFormProps {
  projectName: string;
  topic: string;
  deadline: string;
  onProjectNameChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
  errors: { projectName?: string; deadline?: string };
}

const ProjectInfoForm: React.FC<ProjectInfoFormProps> = ({
  projectName,
  topic,
  deadline,
  onProjectNameChange,
  onTopicChange,
  onDeadlineChange,
  errors,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">프로젝트 정보</h2>

      <div>
        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
          프로젝트명 <span className="text-red-500">*</span>
        </label>
        <input
          id="projectName"
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="예: 인공지능 윤리 보고서"
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.projectName ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.projectName}
          aria-describedby={errors.projectName ? 'projectName-error' : undefined}
        />
        {errors.projectName && (
          <p id="projectName-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.projectName}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
          주제 (선택)
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="예: AI 기술의 사회적 영향"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
          마감일 <span className="text-red-500">*</span>
        </label>
        <input
          id="deadline"
          type="date"
          value={deadline}
          min={todayStr}
          onChange={(e) => onDeadlineChange(e.target.value)}
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.deadline ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.deadline}
          aria-describedby={errors.deadline ? 'deadline-error' : undefined}
        />
        {errors.deadline && (
          <p id="deadline-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.deadline}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectInfoForm;
