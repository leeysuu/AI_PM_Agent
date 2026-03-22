import { describe, it, expect } from 'vitest';
import { teamReducer } from './teamReducer';
import type { Team, Task, ChatMessage, AISuggestion, Review, Alert, Report, PPTSlide, AppliedChange } from '../types/index';

function createMockTeam(overrides?: Partial<Team>): Team {
  return {
    id: 'team-1',
    projectName: 'Test Project',
    topic: 'AI Research',
    deadline: '2025-12-31',
    members: [
      { id: 'm1', name: 'Alice', department: 'CS', strength: 'coding', assignedTasks: ['t1'] },
      { id: 'm2', name: 'Bob', department: 'Design', strength: 'design', assignedTasks: ['t2'] },
    ],
    tasks: [
      {
        id: 't1', title: 'Task 1', description: 'Desc 1', assigneeId: 'm1',
        startDate: '2025-01-01', deadline: '2025-06-30', progress: 0,
        status: 'todo', difficulty: '중', submittedContent: null, review: null, lastUpdated: '2025-01-01',
      },
      {
        id: 't2', title: 'Task 2', description: 'Desc 2', assigneeId: 'm2',
        startDate: '2025-01-01', deadline: '2025-06-30', progress: 50,
        status: 'inProgress', difficulty: '하', submittedContent: 'some content', review: null, lastUpdated: '2025-01-01',
      },
    ],
    milestones: [],
    chatMessages: [],
    aiSuggestions: [],
    alerts: [],
    report: null,
    pointAccounts: [],
    pointPredictions: [],
    settlementResult: null,
    createdAt: '2025-01-01',
    ...overrides,
  };
}

describe('teamReducer', () => {
  it('returns null for all actions when state is null (except SET_TEAM/LOAD_FROM_STORAGE)', () => {
    const result = teamReducer(null, { type: 'UPDATE_TASK', payload: { taskId: 't1', updates: { progress: 50 } } });
    expect(result).toBeNull();
  });

  describe('SET_TEAM', () => {
    it('sets the entire team state', () => {
      const team = createMockTeam();
      const result = teamReducer(null, { type: 'SET_TEAM', payload: team });
      expect(result).toEqual(team);
    });
  });

  describe('LOAD_FROM_STORAGE', () => {
    it('loads team state from storage payload', () => {
      const team = createMockTeam({ projectName: 'Restored' });
      const result = teamReducer(null, { type: 'LOAD_FROM_STORAGE', payload: team });
      expect(result).toEqual(team);
      expect(result?.projectName).toBe('Restored');
    });
  });

  describe('UPDATE_TASK', () => {
    it('updates a specific task by taskId with partial updates', () => {
      const state = createMockTeam();
      const result = teamReducer(state, {
        type: 'UPDATE_TASK',
        payload: { taskId: 't1', updates: { progress: 75, status: 'inProgress' } },
      });
      expect(result?.tasks[0].progress).toBe(75);
      expect(result?.tasks[0].status).toBe('inProgress');
      expect(result?.tasks[1].progress).toBe(50); // unchanged
    });
  });

  describe('UPDATE_REVIEW', () => {
    it('updates task review and progress', () => {
      const state = createMockTeam();
      const review: Review = {
        taskId: 't1',
        scores: { completeness: 20, logic: 18, volume: 15, relevance: 22, total: 75 },
        feedback: ['Good work'],
        suggestedProgress: 70,
        delayDetection: { expectedProgress: 50, actualProgress: 70, gap: -20, severity: 'normal' },
      };
      const result = teamReducer(state, { type: 'UPDATE_REVIEW', payload: { taskId: 't1', review } });
      expect(result?.tasks[0].review).toEqual(review);
      expect(result?.tasks[0].progress).toBe(70);
    });

    it('adds suggestion when provided with review', () => {
      const state = createMockTeam();
      const review: Review = {
        taskId: 't1',
        scores: { completeness: 10, logic: 5, volume: 5, relevance: 5, total: 25 },
        feedback: ['Needs improvement'],
        suggestedProgress: 20,
        delayDetection: { expectedProgress: 50, actualProgress: 20, gap: 30, severity: 'critical' },
      };
      const suggestion: AISuggestion = {
        id: 's1', type: 'reassign', content: 'Reassign to Bob',
        status: 'pending', previousSuggestions: [], relatedTaskId: 't1', round: 1, createdAt: '2025-01-01',
      };
      const result = teamReducer(state, { type: 'UPDATE_REVIEW', payload: { taskId: 't1', review, suggestion } });
      expect(result?.aiSuggestions).toHaveLength(1);
      expect(result?.aiSuggestions[0].id).toBe('s1');
    });
  });

  describe('ADD_MESSAGE', () => {
    it('adds a chat message', () => {
      const state = createMockTeam();
      const msg: ChatMessage = {
        id: 'msg1', sender: 'm1', content: 'Hello', timestamp: '2025-01-01T10:00:00Z', aiDetection: null,
      };
      const result = teamReducer(state, { type: 'ADD_MESSAGE', payload: msg });
      expect(result?.chatMessages).toHaveLength(1);
      expect(result?.chatMessages[0].content).toBe('Hello');
    });
  });

  describe('ADD_DETECTION', () => {
    it('adds AI detection to a specific message', () => {
      const msg: ChatMessage = {
        id: 'msg1', sender: 'm1', content: 'Let us go with plan A', timestamp: '2025-01-01T10:00:00Z', aiDetection: null,
      };
      const state = createMockTeam({ chatMessages: [msg] });
      const detection = { type: 'decision' as const, confidence: 0.85, detail: 'Decision detected' };
      const result = teamReducer(state, { type: 'ADD_DETECTION', payload: { messageId: 'msg1', detection } });
      expect(result?.chatMessages[0].aiDetection).toEqual(detection);
    });
  });

  describe('ADD_SUGGESTION', () => {
    it('adds an AI suggestion', () => {
      const state = createMockTeam();
      const suggestion: AISuggestion = {
        id: 's1', type: 'extend', content: 'Extend deadline by 1 week',
        status: 'pending', previousSuggestions: [], relatedTaskId: 't1', round: 1, createdAt: '2025-01-01',
      };
      const result = teamReducer(state, { type: 'ADD_SUGGESTION', payload: suggestion });
      expect(result?.aiSuggestions).toHaveLength(1);
    });
  });

  describe('UPDATE_SUGGESTION', () => {
    it('updates suggestion status and rejection reason', () => {
      const suggestion: AISuggestion = {
        id: 's1', type: 'reassign', content: 'Reassign',
        status: 'pending', previousSuggestions: [], relatedTaskId: 't1', round: 1, createdAt: '2025-01-01',
      };
      const state = createMockTeam({ aiSuggestions: [suggestion] });
      const result = teamReducer(state, {
        type: 'UPDATE_SUGGESTION',
        payload: { id: 's1', status: 'rejected', rejectionReason: 'Not feasible' },
      });
      expect(result?.aiSuggestions[0].status).toBe('rejected');
      expect(result?.aiSuggestions[0].rejectionReason).toBe('Not feasible');
    });
  });

  describe('APPLY_CHANGES', () => {
    it('handles reassign_task', () => {
      const state = createMockTeam();
      const changes: AppliedChange[] = [
        { type: 'reassign_task', taskId: 't1', details: { newAssigneeId: 'm2' } },
      ];
      const result = teamReducer(state, { type: 'APPLY_CHANGES', payload: changes });
      expect(result?.tasks[0].assigneeId).toBe('m2');
    });

    it('handles extend_deadline', () => {
      const state = createMockTeam();
      const changes: AppliedChange[] = [
        { type: 'extend_deadline', taskId: 't1', details: { newDeadline: '2025-09-30' } },
      ];
      const result = teamReducer(state, { type: 'APPLY_CHANGES', payload: changes });
      expect(result?.tasks[0].deadline).toBe('2025-09-30');
    });

    it('handles reduce_scope', () => {
      const state = createMockTeam();
      const changes: AppliedChange[] = [
        { type: 'reduce_scope', taskId: 't1', details: { newDescription: 'Simplified', newTitle: 'Simple Task' } },
      ];
      const result = teamReducer(state, { type: 'APPLY_CHANGES', payload: changes });
      expect(result?.tasks[0].description).toBe('Simplified');
      expect(result?.tasks[0].title).toBe('Simple Task');
    });

    it('handles add_task', () => {
      const state = createMockTeam();
      const newTask: Task = {
        id: 't3', title: 'Task 3', description: 'New task', assigneeId: 'm1',
        startDate: '2025-02-01', deadline: '2025-07-01', progress: 0,
        status: 'todo', difficulty: '하', submittedContent: null, review: null, lastUpdated: '2025-02-01',
      };
      const changes: AppliedChange[] = [
        { type: 'add_task', taskId: '', details: { task: newTask } },
      ];
      const result = teamReducer(state, { type: 'APPLY_CHANGES', payload: changes });
      expect(result?.tasks).toHaveLength(3);
      expect(result?.tasks[2].id).toBe('t3');
    });

    it('handles split_task', () => {
      const state = createMockTeam();
      const subTask1: Task = {
        id: 't1a', title: 'Task 1A', description: 'Part A', assigneeId: 'm1',
        startDate: '2025-01-01', deadline: '2025-03-31', progress: 0,
        status: 'todo', difficulty: '하', submittedContent: null, review: null, lastUpdated: '2025-01-01',
      };
      const subTask2: Task = {
        id: 't1b', title: 'Task 1B', description: 'Part B', assigneeId: 'm2',
        startDate: '2025-01-01', deadline: '2025-06-30', progress: 0,
        status: 'todo', difficulty: '하', submittedContent: null, review: null, lastUpdated: '2025-01-01',
      };
      const changes: AppliedChange[] = [
        { type: 'split_task', taskId: 't1', details: { subTasks: [subTask1, subTask2] } },
      ];
      const result = teamReducer(state, { type: 'APPLY_CHANGES', payload: changes });
      expect(result?.tasks).toHaveLength(3); // t2 + t1a + t1b
      expect(result?.tasks.find((t) => t.id === 't1')).toBeUndefined();
      expect(result?.tasks.find((t) => t.id === 't1a')).toBeDefined();
      expect(result?.tasks.find((t) => t.id === 't1b')).toBeDefined();
    });
  });

  describe('ADD_ALERT', () => {
    it('adds an alert', () => {
      const state = createMockTeam();
      const alert: Alert = {
        id: 'a1', message: 'Deadline approaching', type: 'deadline',
        target: 'Alice', priority: 'high', createdAt: '2025-01-01',
      };
      const result = teamReducer(state, { type: 'ADD_ALERT', payload: alert });
      expect(result?.alerts).toHaveLength(1);
      expect(result?.alerts[0].type).toBe('deadline');
    });
  });

  describe('SET_REPORT', () => {
    it('sets the report', () => {
      const state = createMockTeam();
      const report: Report = {
        title: 'Final Report', sections: [], status: 'draft', pptSlides: null,
      };
      const result = teamReducer(state, { type: 'SET_REPORT', payload: report });
      expect(result?.report).toEqual(report);
    });
  });

  describe('APPROVE_REPORT', () => {
    it('changes report status to approved', () => {
      const report: Report = { title: 'Report', sections: [], status: 'draft', pptSlides: null };
      const state = createMockTeam({ report });
      const result = teamReducer(state, { type: 'APPROVE_REPORT' });
      expect(result?.report?.status).toBe('approved');
    });

    it('returns state unchanged when no report exists', () => {
      const state = createMockTeam({ report: null });
      const result = teamReducer(state, { type: 'APPROVE_REPORT' });
      expect(result?.report).toBeNull();
    });
  });

  describe('SET_PPT_SLIDES', () => {
    it('sets PPT slides on the report', () => {
      const report: Report = { title: 'Report', sections: [], status: 'approved', pptSlides: null };
      const state = createMockTeam({ report });
      const slides: PPTSlide[] = [
        { slideNumber: 1, title: 'Intro', content: 'Welcome', keywords: ['AI'], speakerNotes: 'Start here' },
      ];
      const result = teamReducer(state, { type: 'SET_PPT_SLIDES', payload: slides });
      expect(result?.report?.pptSlides).toHaveLength(1);
      expect(result?.report?.pptSlides?.[0].title).toBe('Intro');
    });

    it('returns state unchanged when no report exists', () => {
      const state = createMockTeam({ report: null });
      const slides: PPTSlide[] = [
        { slideNumber: 1, title: 'Intro', content: 'Welcome', keywords: ['AI'], speakerNotes: 'Start here' },
      ];
      const result = teamReducer(state, { type: 'SET_PPT_SLIDES', payload: slides });
      expect(result?.report).toBeNull();
    });
  });

  describe('ADD_MARKET_LISTING', () => {
    it('does not modify team state (market listings managed separately)', () => {
      const state = createMockTeam();
      const result = teamReducer(state, {
        type: 'ADD_MARKET_LISTING',
        payload: {
          id: 'ml1', teamId: 'team-1', title: 'Listing', subject: 'CS',
          department: 'CS', qualityScore: 85, price: 5000, aiSummary: 'Summary',
          fullContent: 'Full', reviewReport: { title: 'R', sections: [], status: 'approved', pptSlides: null },
          contributionData: [], salesCount: 0, createdAt: '2025-01-01',
        },
      });
      expect(result).toEqual(state);
    });
  });
});
