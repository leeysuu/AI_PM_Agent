import { useCallback } from 'react';
import { useTeamContext } from '../context/TeamContext';
import { apiPost } from '../api/apiClient';
import type {
  Member,
  PointAccount,
  PointEvent,
  PointEventType,
  PointPrediction,
  SettlementResult,
} from '../types';

export function usePoints() {
  const { team, dispatch } = useTeamContext();

  const initializePoints = useCallback(
    (members: Member[]) => {
      const accounts: PointAccount[] = members.map((m) => ({
        memberId: m.id,
        balance: 80, // 100 초기 - 20 보증금
        deposit: 20,
        history: [
          {
            id: crypto.randomUUID(),
            memberId: m.id,
            type: 'deposit' as PointEventType,
            amount: -20,
            reason: '프로젝트 참여 보증금',
            createdAt: new Date().toISOString(),
          },
        ],
        badges: [],
        certificates: [],
      }));
      dispatch({ type: 'INIT_POINT_ACCOUNTS', payload: accounts });
    },
    [dispatch],
  );

  const depositPoints = useCallback(
    (memberId: string, amount: number = 20) => {
      const event: PointEvent = {
        id: crypto.randomUUID(),
        memberId,
        type: 'deposit',
        amount: -amount,
        reason: `보증금 ${amount}포인트 차감`,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_POINT_EVENT', payload: event });
    },
    [dispatch],
  );

  const addPointEvent = useCallback(
    (memberId: string, type: PointEventType, amount: number, reason: string) => {
      const event: PointEvent = {
        id: crypto.randomUUID(),
        memberId,
        type,
        amount,
        reason,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_POINT_EVENT', payload: event });

      // 채팅 알림 메시지 자동 생성
      const member = team?.members.find((m) => m.id === memberId);
      const memberName = member?.name ?? '팀원';
      const emoji = amount > 0 ? '🎉' : '⚠️';
      const sign = amount > 0 ? '+' : '';
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          sender: 'ai',
          content: `${emoji} ${memberName}님 ${sign}${amount}pt ${amount > 0 ? '획득' : '차감'} (${reason})`,
          timestamp: new Date().toISOString(),
          aiDetection: null,
        },
      });
    },
    [dispatch, team?.members],
  );

  const settlePoints = useCallback(async () => {
    if (!team) return;
    try {
      const result = await apiPost<SettlementResult>('/api/points/settle', {
        teamState: team,
        pointAccounts: team.pointAccounts,
      });
      dispatch({ type: 'SET_SETTLEMENT_RESULT', payload: result });

      // 정산 결과를 채팅에 공유
      const bestName = team.members.find((m) => m.id === result.bestCollaborator)?.name ?? '알 수 없음';
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          sender: 'ai',
          content: `📊 [정산 완료] ${result.aiComment}\n🏆 Best Collaborator: ${bestName}`,
          timestamp: new Date().toISOString(),
          aiDetection: null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '포인트 정산 중 오류가 발생했습니다';
      throw new Error(message);
    }
  }, [team, dispatch]);

  const predictPoints = useCallback(async () => {
    if (!team) return;
    try {
      const result = await apiPost<{ predictions: PointPrediction[] }>('/api/points/predict', {
        teamState: team,
        pointAccounts: team.pointAccounts,
      });
      dispatch({ type: 'SET_POINT_PREDICTIONS', payload: result.predictions });
    } catch (error) {
      const message = error instanceof Error ? error.message : '포인트 예측 중 오류가 발생했습니다';
      throw new Error(message);
    }
  }, [team, dispatch]);

  const exchangePoints = useCallback(
    (memberId: string, itemName: string, cost: number): boolean => {
      const account = team?.pointAccounts.find((a) => a.memberId === memberId);
      if (!account || account.balance < cost) return false;

      addPointEvent(memberId, 'exchange', -cost, `포인트 교환: ${itemName}`);
      return true;
    },
    [team?.pointAccounts, addPointEvent],
  );

  const getAccount = useCallback(
    (memberId: string): PointAccount | undefined => {
      return team?.pointAccounts.find((a) => a.memberId === memberId);
    },
    [team?.pointAccounts],
  );

  return {
    pointAccounts: team?.pointAccounts ?? [],
    pointPredictions: team?.pointPredictions ?? [],
    settlementResult: team?.settlementResult ?? null,
    initializePoints,
    depositPoints,
    addPointEvent,
    settlePoints,
    predictPoints,
    exchangePoints,
    getAccount,
  };
}
