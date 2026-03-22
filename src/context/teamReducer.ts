import type { Team, TeamAction } from '../types';

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
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId
            ? { ...t, ...action.payload.updates, lastUpdated: new Date().toISOString() }
            : t
        ),
      };
    }

    case 'UPDATE_REVIEW': {
      if (!state) return state;
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
    }

    case 'ADD_MESSAGE': {
      if (!state) return state;
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    }

    case 'ADD_DETECTION': {
      if (!state) return state;
      return {
        ...state,
        chatMessages: state.chatMessages.map((m) =>
          m.id === action.payload.messageId
            ? { ...m, aiDetection: action.payload.detection }
            : m
        ),
      };
    }

    case 'ADD_SUGGESTION': {
      if (!state) return state;
      return { ...state, aiSuggestions: [...state.aiSuggestions, action.payload] };
    }

    case 'UPDATE_SUGGESTION': {
      if (!state) return state;
      return {
        ...state,
        aiSuggestions: state.aiSuggestions.map((s) =>
          s.id === action.payload.id
            ? { ...s, status: action.payload.status, rejectionReason: action.payload.rejectionReason }
            : s
        ),
      };
    }

    case 'APPLY_CHANGES': {
      if (!state) return state;
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
    }

    case 'ADD_ALERT': {
      if (!state) return state;
      return { ...state, alerts: [...state.alerts, action.payload] };
    }

    case 'SET_REPORT': {
      if (!state) return state;
      return { ...state, report: action.payload };
    }

    case 'APPROVE_REPORT': {
      if (!state || !state.report) return state;
      return { ...state, report: { ...state.report, status: 'approved' } };
    }

    case 'SET_PPT_SLIDES': {
      if (!state || !state.report) return state;
      return { ...state, report: { ...state.report, pptSlides: action.payload } };
    }

    case 'ADD_MARKET_LISTING': {
      // MarketListing is stored separately; this is a no-op on Team state
      return state;
    }

    default:
      return state;
  }
}
