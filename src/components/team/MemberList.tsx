import React from 'react';

interface MemberItem {
  name: string;
  department: string;
  strength: string;
}

interface MemberListProps {
  members: MemberItem[];
  onRemove: (index: number) => void;
  error?: string;
}

const MemberList: React.FC<MemberListProps> = ({ members, onRemove, error }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">팀원 목록</h2>
        <span className="text-sm text-gray-500">({members.length}명)</span>
      </div>

      {error && (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      )}

      {members.length === 0 ? (
        <p className="text-sm text-gray-400">아직 추가된 팀원이 없습니다.</p>
      ) : (
        <ul className="space-y-2" aria-label="팀원 목록">
          {members.map((member, index) => (
            <li
              key={index}
              className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-gray-900">{member.name}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {member.department}
                </span>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                  {member.strength}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="ml-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`${member.name} 삭제`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MemberList;
