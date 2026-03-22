import { useState, useCallback, useMemo } from 'react';
import { useTeamContext } from '../context/TeamContext';
import type { ChatMessage } from '../types';
import { analyzeChat } from '../api/chatApi';

export type AiDetection = NonNullable<ChatMessage['aiDetection']>;

export interface UseChatReturn {
  messages: ChatMessage[];
  detections: AiDetection[];
  sending: boolean;
  sendMessage: (content: string, senderId: string) => Promise<void>;
}

export function useChat(): UseChatReturn {
  const { team, dispatch } = useTeamContext();
  const [sending, setSending] = useState(false);

  const messages = team?.chatMessages ?? [];

  const detections = useMemo(
    () =>
      messages
        .filter(
          (m) =>
            m.aiDetection !== null &&
            m.aiDetection.confidence < 0.7 &&
            m.aiDetection.type !== 'none',
        )
        .map((m) => m.aiDetection as AiDetection),
    [messages],
  );

  const sendMessage = useCallback(
    async (content: string, senderId: string) => {
      if (!team) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: senderId,
        content,
        timestamp: new Date().toISOString(),
        aiDetection: null,
      };

      // Immediately show the user message
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

      setSending(true);
      try {
        const result = await analyzeChat({
          teamState: team,
          newMessage: content,
          sender: senderId,
        });

        // Attach detection to the user message if detection exists and type is not 'none'
        if (result.detection && result.detection.type !== 'none') {
          dispatch({
            type: 'ADD_DETECTION',
            payload: {
              messageId: userMessage.id,
              detection: {
                type: result.detection.type as 'decision' | 'newTask' | 'risk' | 'none',
                confidence: result.detection.confidence,
                detail: result.detection.detail,
              },
            },
          });
        }

        // If AI should intervene (confidence >= 0.7) and aiResponse exists, add AI message
        if (result.shouldIntervene && result.aiResponse) {
          const aiMessage: ChatMessage = {
            id: crypto.randomUUID(),
            sender: 'ai',
            content: result.aiResponse,
            timestamp: new Date().toISOString(),
            aiDetection: null,
          };
          dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
        }
        // confidence < 0.7: detection already attached via ADD_DETECTION, sidebar shows it
        // type === 'none': do nothing (no AI response)
      } catch {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          sender: 'ai',
          content: '⚠️ AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          timestamp: new Date().toISOString(),
          aiDetection: null,
        };
        dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
      } finally {
        setSending(false);
      }
    },
    [team, dispatch],
  );

  return { messages, detections, sending, sendMessage };
}
