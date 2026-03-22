import { useMemo } from 'react';
import type { Task, Member } from '../../types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  members: Member[];
  onSubmitWork?: (taskId: string) => void;
}

export function KanbanBoard({ tasks, members, onSubmitWork }: KanbanBoardProps) {
  const { todo, inProgress, done } = useMemo(() => {
    const todo: Task[] = [];
    const inProgress: Task[] = [];
    const done: Task[] = [];
    for (const task of tasks) {
      if (task.status === 'todo') todo.push(task);
      else if (task.status === 'inProgress') inProgress.push(task);
      else done.push(task);
    }
    return { todo, inProgress, done };
  }, [tasks]);

  return (
    <div className="flex gap-3 flex-1 min-h-0">
      <KanbanColumn
        title="To Do"
        tasks={todo}
        members={members}
        columnColor="bg-gray-100"
        onSubmitWork={onSubmitWork}
      />
      <KanbanColumn
        title="In Progress"
        tasks={inProgress}
        members={members}
        columnColor="bg-blue-50"
        onSubmitWork={onSubmitWork}
      />
      <KanbanColumn
        title="Done"
        tasks={done}
        members={members}
        columnColor="bg-green-50"
        onSubmitWork={onSubmitWork}
      />
    </div>
  );
}
