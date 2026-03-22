<<<<<<< HEAD
import type { Team, TeamAction } from '../types';
=======
import type { Team, TeamAction, Task } from '../types/index';
>>>>>>> origin/main

export function teamReducer(state: Team | null, action: TeamAction): Team | null {
  switch (action.type) {
    case 'SET_TEAM':
      return action.payload;

    case 'LOAD_FROM_STORAGE':
      return action.payload;

    case 'UPDATE_TASK': {
      if (!state) return state;
      return {
        ...state,
<<<<<<< HEAD
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId
            ? { ...t, ...action.payload.updates, lastUpdated: new Date().toISOString() }
            : t
=======
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? { ...task, ...action.payload.updates }
            : task
>>>>>>> origin/main
        ),
      };
    }

    case 'UPDATE_REVIEW': {
      if (!state) return state;
<<<<<<< HEAD
      const newState: Team = {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId
            ? {
                ...t,
                review: action.payload.review,
                progress: action.payload.review.suggestedProgress,
                lastUpdated: new Date().toISOString(),
              }
            : t
        ),
      };
      if (action.payload.suggestion) {
        newState.aiSuggestions = [...newState.aiSuggestions, action.payload.suggestion];
      }
      return newState;
=======
      const { taskId, review, suggestion } = action.payload;
      const updatedState: Team = {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, review, progress: review.suggestedProgress }
            : task
        ),
      };
      if (suggestion) {
        updatedState.aiSuggestions = [...state.aiSuggestions, suggestion];
      }
      return updatedState;
>>>>>>> origin/main
    }

    case 'ADD_MESSAGE': {
      if (!state) return state;
<<<<<<< HEAD
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
=======
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
      };
>>>>>>> origin/main
    }

    case 'ADD_DETECTION': {
      if (!state) return state;
      return {
        ...state,
<<<<<<< HEAD
        chatMessages: state.chatMessages.map((m) =>
          m.id === action.payload.messageId
            ? { ...m, aiDetection: action.payload.detection }
            : m
=======
        chatMessages: state.chatMessages.map((msg) =>
          msg.id === action.payload.messageId
            ? { ...msg, aiDetection: action.payload.detection }
            : msg
>>>>>>> origin/main
        ),
      };
    }

    case 'ADD_SUGGESTION': {
      if (!state) return state;
<<<<<<< HEAD
      return { ...state, aiSuggestions: [...state.aiSuggestions, action.payload] };
=======
      return {
        ...state,
        aiSuggestions: [...state.aiSuggestions, action.payload],
      };
>>>>>>> origin/main
    }

    case 'UPDATE_SUGGESTION': {
      if (!state) return state;
      return {
        ...state,
        aiSuggestions: state.aiSuggestions.map((s) =>
          s.id === action.payload.id
<<<<<<< HEAD
            ? { ...s, status: action.payload.status, rejectionReason: action.payload.rejectionReason }
=======
            ? {
                ...s,
                status: action.payload.status,
                ...(action.payload.rejectionReason !== undefined && {
                  rejectionReason: action.payload.rejectionReason,
                }),
              }
>>>>>>> origin/main
            : s
        ),
      };
    }

    case 'APPLY_CHANGES': {
      if (!state) return state;
<<<<<<< HEAD
      let updated = { ...state };
      for (const change of action.payload) {
        if (change.type === 'reassign_task') {
          updated = {
            ...updated,
            tasks: updated.tasks.map((t) =>
              t.id === change.taskId
                ? { ...t, assigneeId: change.details['newAssigneeId'] as string, lastUpdated: new Date().toISOString() }
                : t
            ),
          };
        } else if (change.type === 'extend_deadline') {
          updated = {
            ...updated,
            tasks: updated.tasks.map((t) =>
              t.id === change.taskId
                ? { ...t, deadline: change.details['newDeadline'] as string, lastUpdated: new Date().toISOString() }
                : t
            ),
          };
        }
      }
      return updated;
=======
      let tasks = [...state.tasks];

      for (const change of action.payload) {
        switch (change.type) {
          case 'reassign_task': {
            const newAssigneeId = change.details['newAssigneeId'] as string;
            tasks = tasks.map((task) =>
              task.id === change.taskId
                ? { ...task, assigneeId: newAssigneeId }
                : task
            );
            break;
          }
          case 'extend_deadline': {
            const newDeadline = change.details['newDeadline'] as string;
            tasks = tasks.map((task) =>
              task.id === change.taskId
                ? { ...task, deadline: newDeadline }
                : task
            );
            break;
          }
          case 'reduce_scope': {
            const newDescription = change.details['newDescription'] as string | undefined;
            const newTitle = change.details['newTitle'] as string | undefined;
            tasks = tasks.map((task) =>
              task.id === change.taskId
                ? {
                    ...task,
                    ...(newDescription !== undefined && { description: newDescription }),
                    ...(newTitle !== undefined && { title: newTitle }),
                  }
                : task
            );
            break;
          }
          case 'add_task': {
            const newTask = change.details['task'] as Task;
            tasks = [...tasks, newTask];
            break;
          }
          case 'split_task': {
            const subTasks = change.details['subTasks'] as Task[];
            tasks = tasks.filter((task) => task.id !== change.taskId);
            tasks = [...tasks, ...subTasks];
            break;
          }
        }
      }

      return { ...state, tasks };
>>>>>>> origin/main
    }

    case 'ADD_ALERT': {
      if (!state) return state;
<<<<<<< HEAD
      return { ...state, alerts: [...state.alerts, action.payload] };
=======
      return {
        ...state,
        alerts: [...state.alerts, action.payload],
      };
>>>>>>> origin/main
    }

    case 'SET_REPORT': {
      if (!state) return state;
<<<<<<< HEAD
      return { ...state, report: action.payload };
=======
      return {
        ...state,
        report: action.payload,
      };
>>>>>>> origin/main
    }

    case 'APPROVE_REPORT': {
      if (!state || !state.report) return state;
<<<<<<< HEAD
      return { ...state, report: { ...state.report, status: 'approved' } };
=======
      return {
        ...state,
        report: { ...state.report, status: 'approved' },
      };
>>>>>>> origin/main
    }

    case 'SET_PPT_SLIDES': {
      if (!state || !state.report) return state;
<<<<<<< HEAD
      return { ...state, report: { ...state.report, pptSlides: action.payload } };
    }

    case 'ADD_MARKET_LISTING': {
      // MarketListing is stored separately; this is a no-op on Team state
      return state;
    }

    default:
      return state;
=======
      return {
        ...state,
        report: { ...state.report, pptSlides: action.payload },
      };
    }

    case 'ADD_MARKET_LISTING': {
      // MarketListing is managed separately from team state.
      // This action is dispatched but does not modify team state.
      return state;
    }
>>>>>>> origin/main
  }
}
