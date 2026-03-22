import { useState, useCallback, useMemo } from 'react';
import { useTeamContext } from '../context/TeamContext';
import type { AISuggestion } from '../types';
import { processDecision } from '../api/decisionApi';

const MAX_ROUNDS = 3;

export interface UseAISuggestionReturn {
  suggestions: AISuggestion[];
  processing: boolean;
  maxRoundReached: boolean;
  acceptSuggestion: (suggestionId: string) => Promise<void>;
  rejectSuggestion: (suggestionId: string, reason: string) => Promise<void>;
}

export function useAISuggestion(): UseAISuggestionReturn {
  const { team, dispatch } = useTeamContext();
  const [processing, setProcessing] = useState(false);

  const suggestions = team?.aiSuggestions ?? [];

  const maxRoundReached = useMemo(() => {
    return suggestions.some((s) => s.round > MAX_ROUNDS);
  }, [suggestions]);

  const acceptSuggestion = useCallback(
    async (suggestionId: string) => {
      if (!team) return;

      setProcessing(true);
      try {
        const result = await processDecision({
          teamState: team,
          suggestionId,
          accepted: true,
        });

        dispatch({
          type: 'UPDATE_SUGGESTION',
          payload: { id: suggestionId, status: 'accepted' },
        });

        if (result.appliedChanges && result.appliedChanges.length > 0) {
          dispatch({ type: 'APPLY_CHANGES', payload: result.appliedChanges });
        }
      } catch {
        // Error is silently handled; UI remains in current state
      } finally {
        setProcessing(false);
      }
    },
    [team, dispatch],
  );

  const rejectSuggestion = useCallback(
    async (suggestionId: string, reason: string) => {
      if (!team) return;

      const suggestion = suggestions.find((s) => s.id === suggestionId);
      if (!suggestion) return;

      // Check round limit before calling API
      if (suggestion.round >= MAX_ROUNDS) {
        dispatch({
          type: 'UPDATE_SUGGESTION',
          payload: { id: suggestionId, status: 'rejected', rejectionReason: reason },
        });
        return;
      }

      setProcessing(true);
      try {
        const result = await processDecision({
          teamState: team,
          suggestionId,
          accepted: false,
          rejectionReason: reason,
        });

        dispatch({
          type: 'UPDATE_SUGGESTION',
          payload: { id: suggestionId, status: 'rejected', rejectionReason: reason },
        });

        if (result.action === 'newSuggestion' && result.newSuggestion) {
          dispatch({ type: 'ADD_SUGGESTION', payload: result.newSuggestion });
        }
      } catch {
        // Error is silently handled; UI remains in current state
      } finally {
        setProcessing(false);
      }
    },
    [team, dispatch, suggestions],
  );

  return { suggestions, processing, maxRoundReached, acceptSuggestion, rejectSuggestion };
}
