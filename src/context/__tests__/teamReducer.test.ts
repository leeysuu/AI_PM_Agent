import { describe, it, expect } from 'vitest';
import { teamReducer } from '../teamReducer';
import type { Team, ChatMessage } from '../../types';

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 'team-1',
    projectName: 'Test Project',
    topic: 'AI',
    deadline: '2025-12-31',
    members: [
      { id: 'm1', name: '김철수', department: '컴공', strength: '코딩', assignedTasks: [] },
      { id: 'm2', name: '이영희', department: '디자인', strength: '디자인', assignedTasks: [] },
    ],
    tasks: [],
    milestones: [],
    chatMessages: [],
    aiSuggestions: [],
    alerts: [],
    report: null,
    pointAccounts: [],
    pointPredictions: [],
    settlementResult: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'msg-1',
    sender: 'm1',
    content: '안녕하세요',
    timestamp: '2025-01-01T12:00:00.000Z',
    aiDetection: null,
    ...overrides,
  };
}

describe('teamReducer', () => {
  /**
   * Validates: Requirements 6.3
   * ADD_MESSAGE 액션이 chatMessages 배열에 메시지를 추가하는지 테스트
   */
  describe('ADD_MESSAGE', () => {
    it('메시지를 chatMessages 배열에 추가한다', () => {
      const team = makeTeam();
      const message = makeMessage();

      const result = teamReducer(team, { type: 'ADD_MESSAGE', payload: message });

      expect(result).not.toBeNull();
      expect(result!.chatMessages).toHaveLength(1);
      expect(result!.chatMessages[0]).toEqual(message);
    });

    it('기존 메시지를 유지하면서 새 메시지를 추가한다', () => {
      const existingMsg = makeMessage({ id: 'msg-0', content: '기존 메시지' });
      const team = makeTeam({ chatMessages: [existingMsg] });
      const newMsg = makeMessage({ id: 'msg-1', content: '새 메시지' });

      const result = teamReducer(team, { type: 'ADD_MESSAGE', payload: newMsg });

      expect(result!.chatMessages).toHaveLength(2);
      expect(result!.chatMessages[0]).toEqual(existingMsg);
      expect(result!.chatMessages[1]).toEqual(newMsg);
    });

    it('state가 null이면 null을 반환한다', () => {
      const message = makeMessage();
      const result = teamReducer(null, { type: 'ADD_MESSAGE', payload: message });
      expect(result).toBeNull();
    });
  });

  /**
   * Validates: Requirements 7.5
   * ADD_DETECTION 액션이 해당 메시지에 감지 결과를 첨부하는지 테스트
   */
  describe('ADD_DETECTION', () => {
    it('해당 메시지에 감지 결과를 첨부한다', () => {
      const msg = makeMessage({ id: 'msg-1' });
      const team = makeTeam({ chatMessages: [msg] });
      const detection = { type: 'risk' as const, confidence: 0.5, detail: '일정 리스크 감지' };

      const result = teamReducer(team, {
        type: 'ADD_DETECTION',
        payload: { messageId: 'msg-1', detection },
      });

      expect(result!.chatMessages[0].aiDetection).toEqual(detection);
    });

    it('다른 메시지에는 영향을 주지 않는다', () => {
      const msg1 = makeMessage({ id: 'msg-1' });
      const msg2 = makeMessage({ id: 'msg-2', content: '다른 메시지' });
      const team = makeTeam({ chatMessages: [msg1, msg2] });
      const detection = { type: 'decision' as const, confidence: 0.4, detail: '의사결정 감지' };

      const result = teamReducer(team, {
        type: 'ADD_DETECTION',
        payload: { messageId: 'msg-1', detection },
      });

      expect(result!.chatMessages[0].aiDetection).toEqual(detection);
      expect(result!.chatMessages[1].aiDetection).toBeNull();
    });
  });
});
