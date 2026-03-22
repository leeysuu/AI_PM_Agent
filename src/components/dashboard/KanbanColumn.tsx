import type { Task, Member } from '../../types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  members: Member[];
  columnColor: string;
  onSubmitWork?: (taskId: string) => void;
}

export function KanbanColumn({ title, tasks, members, columnColor, onSubmitWork }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className={`flex items-center gap-2 mb-3 px-2 py-1.5 rounded-t-lg ${columnColor}`}>
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <span className="text-xs font-medium text-gray-500 bg-white/70 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto px-1">
        {tasks.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">태스크 없음</p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} members={members} onSubmitWork={onSubmitWork} />
          ))
        )}
      </div>
    </div>
  );
}
