import React, { useState } from 'react';

interface MemberInput {
  name: string;
  department: string;
  strength: string;
}

interface MemberAddFormProps {
  onAdd: (member: MemberInput) => void;
}

const MemberAddForm: React.FC<MemberAddFormProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [strength, setStrength] = useState('');

  const handleAdd = () => {
    const trimmedName = name.trim();
    const trimmedDept = department.trim();
    const trimmedStrength = strength.trim();
    if (!trimmedName || !trimmedDept || !trimmedStrength) return;

    onAdd({ name: trimmedName, department: trimmedDept, strength: trimmedStrength });
    setName('');
    setDepartment('');
    setStrength('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">팀원 추가</h2>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="이름"
          aria-label="팀원 이름"
          className="flex-1 min-w-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="학과"
          aria-label="팀원 학과"
          className="flex-1 min-w-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={strength}
          onChange={(e) => setStrength(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="강점"
          aria-label="팀원 강점"
          className="flex-1 min-w-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          추가
        </button>
      </div>
    </div>
  );
};

export default MemberAddForm;
