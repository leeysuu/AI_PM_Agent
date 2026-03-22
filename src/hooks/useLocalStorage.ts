import { useState, useCallback } from 'react';

const KEY_PREFIX = 'ai-pm-agent-';

function getStoredValue<T>(prefixedKey: string, initialValue: T): T {
  try {
    const item = localStorage.getItem(prefixedKey);
    if (item === null) {
      return initialValue;
    }
    return JSON.parse(item) as T;
  } catch {
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const prefixedKey = KEY_PREFIX + key;

  const [storedValue, setStoredValue] = useState<T>(() =>
    getStoredValue(prefixedKey, initialValue),
  );

  const setValue = useCallback(
    (value: T) => {
      setStoredValue(value);
      try {
        localStorage.setItem(prefixedKey, JSON.stringify(value));
      } catch {
        // localStorage unavailable or quota exceeded — state still updated in memory
      }
    },
    [prefixedKey],
  );

  return [storedValue, setValue];
}
