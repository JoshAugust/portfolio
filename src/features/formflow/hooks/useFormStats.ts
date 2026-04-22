import { useReducer, useCallback } from 'react';
import type { ComparisonStats, FormRunStats, StatsAction } from '../types';

const initialRunStats: FormRunStats = {
  fieldsCompleted: 0,
  fieldsTotal: 0,
  errorsShown: 0,
  retriesTotal: 0,
  startedAt: null,
  completedAt: null,
};

const initialStats: ComparisonStats = {
  traditional: { ...initialRunStats, fieldsTotal: 15 },
  ai: { ...initialRunStats, fieldsTotal: 7 },
};

function statsReducer(state: ComparisonStats, action: StatsAction): ComparisonStats {
  const side = state[action.form];

  switch (action.type) {
    case 'START':
      if (side.startedAt !== null) return state;
      return {
        ...state,
        [action.form]: { ...side, startedAt: Date.now() },
      };

    case 'FIELD_COMPLETED':
      return {
        ...state,
        [action.form]: {
          ...side,
          fieldsCompleted: side.fieldsCompleted + 1,
        },
      };

    case 'ERROR_SHOWN':
      return {
        ...state,
        [action.form]: {
          ...side,
          errorsShown: side.errorsShown + 1,
        },
      };

    case 'RETRY':
      return {
        ...state,
        [action.form]: {
          ...side,
          retriesTotal: side.retriesTotal + 1,
        },
      };

    case 'SUBMITTED':
      return {
        ...state,
        [action.form]: {
          ...side,
          completedAt: Date.now(),
        },
      };

    default:
      return state;
  }
}

export function useFormStats() {
  const [stats, rawDispatch] = useReducer(statsReducer, initialStats);

  const dispatch = useCallback((action: StatsAction) => {
    rawDispatch(action);
  }, []);

  return { stats, dispatch };
}
