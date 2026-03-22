import type { Team, TeamAction, Task } from '../types';

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
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? { ...task, ...action.payload.updates, lastUpdated: new Date().toISOString() }
            : task
        ),
      };
    }

    case 'UPDATE_REVIEW': {
      if (!state) return state;
      const { taskId, review, suggestion } = action.payload;
      const updatedState: Team = {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, review, progress: review.suggestedProgress, lastUpdated: new Date().toISOString() }
            : task
        ),
      };
      if (suggestion) {
        updatedState.aiSuggestions = [...state.aiSuggestions, suggestion];
      }
      return updatedState;
    }

    case 'ADD_MESSAGE': {
      if (!state) return state;
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
      };
    }

    case 'ADD_DETECTION': {
      if (!state) return state;
      return {
        ...state,
        chatMessages: state.chatMessages.map((msg) =>
          msg.id === action.payload.messageId
            ? { ...msg, aiDetection: action.payload.detection }
            : msg
        ),
      };
    }

    case 'ADD_SUGGESTION': {
      if (!state) return state;
      return {
        ...state,
        aiSuggestions: [...state.aiSuggestions, action.payload],
      };
    }

    case 'UPDATE_SUGGESTION': {
      if (!state) return state;
      return {
        ...state,
        aiSuggestions: state.aiSuggestions.map((s) =>
          s.id === action.payload.id
            ? {
                ...s,
                status: action.payload.status,
                ...(action.payload.rejectionReason !== undefined && {
                  rejectionReason: action.payload.rejectionReason,
                }),
              }
            : s
        ),
      };
    }

    case 'APPLY_CHANGES': {
      if (!state) return state;
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
    }

    case 'ADD_ALERT': {
      if (!state) return state;
      return {
        ...state,
        alerts: [...state.alerts, action.payload],
      };
    }

    case 'SET_REPORT': {
      if (!state) return state;
      return {
        ...state,
        report: action.payload,
      };
    }

    case 'APPROVE_REPORT': {
      if (!state || !state.report) return state;
      return {
        ...state,
        report: { ...state.report, status: 'approved' },
      };
    }

    case 'SET_PPT_SLIDES': {
      if (!state || !state.report) return state;
      return {
        ...state,
        report: { ...state.report, pptSlides: action.payload },
      };
    }

    case 'ADD_MARKET_LISTING': {
      // MarketListing is managed separately from team state.
      return state;
    }

    case 'INIT_POINT_ACCOUNTS': {
      if (!state) return state;
      return {
        ...state,
        pointAccounts: action.payload,
      };
    }

    case 'UPDATE_POINT_ACCOUNT': {
      if (!state) return state;
      const { memberId, updates } = action.payload;
      return {
        ...state,
        pointAccounts: state.pointAccounts.map((a) =>
          a.memberId === memberId ? { ...a, ...updates } : a
        ),
      };
    }

    case 'ADD_POINT_EVENT': {
      if (!state) return state;
      const event = action.payload;
      return {
        ...state,
        pointAccounts: state.pointAccounts.map((a) =>
          a.memberId === event.memberId
            ? {
                ...a,
                balance: a.balance + event.amount,
                history: [...a.history, event],
              }
            : a
        ),
      };
    }

    case 'SET_POINT_PREDICTIONS': {
      if (!state) return state;
      return {
        ...state,
        pointPredictions: action.payload,
      };
    }

    case 'SET_SETTLEMENT_RESULT': {
      if (!state) return state;
      return {
        ...state,
        settlementResult: action.payload,
      };
    }
  }
}
