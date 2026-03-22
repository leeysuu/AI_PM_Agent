import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initialValue when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads existing value from localStorage with ai-pm-agent- prefix', () => {
    localStorage.setItem('ai-pm-agent-test-key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('writes value to localStorage with ai-pm-agent- prefix', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    act(() => {
      result.current[1]('updated');
    });
    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('ai-pm-agent-test-key')!)).toBe('updated');
  });

  it('handles complex objects', () => {
    const initial = { name: 'test', items: [1, 2, 3] };
    const { result } = renderHook(() => useLocalStorage('obj-key', initial));
    expect(result.current[0]).toEqual(initial);

    const updated = { name: 'updated', items: [4, 5] };
    act(() => {
      result.current[1](updated);
    });
    expect(result.current[0]).toEqual(updated);
    expect(JSON.parse(localStorage.getItem('ai-pm-agent-obj-key')!)).toEqual(updated);
  });

  it('falls back to initialValue when stored JSON is corrupted', () => {
    localStorage.setItem('ai-pm-agent-bad-key', '{invalid json');
    const { result } = renderHook(() => useLocalStorage('bad-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('handles localStorage.setItem failure gracefully', () => {
    const { result } = renderHook(() => useLocalStorage('fail-key', 'init'));
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    act(() => {
      result.current[1]('new-value');
    });

    // State should still update in memory even if localStorage fails
    expect(result.current[0]).toBe('new-value');
    spy.mockRestore();
  });
});
