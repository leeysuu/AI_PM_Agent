import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  calculateDDay,
  calculateElapsedDays,
  formatDate,
  calculateExpectedProgress,
} from './dateUtils';

// Mock Date to control "today"
function mockToday(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(y, m - 1, d, 12, 0, 0));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('calculateDDay', () => {
  it('returns positive days when deadline is in the future', () => {
    mockToday('2025-01-01');
    expect(calculateDDay('2025-01-11')).toBe(10);
  });

  it('returns 0 when deadline is today', () => {
    mockToday('2025-06-15');
    expect(calculateDDay('2025-06-15')).toBe(0);
  });

  it('returns negative days when deadline has passed', () => {
    mockToday('2025-01-15');
    expect(calculateDDay('2025-01-10')).toBe(-5);
  });
});

describe('calculateElapsedDays', () => {
  it('calculates days between two dates', () => {
    expect(calculateElapsedDays('2025-01-01', '2025-01-11')).toBe(10);
  });

  it('returns 0 for same start and end date', () => {
    expect(calculateElapsedDays('2025-03-01', '2025-03-01')).toBe(0);
  });

  it('defaults endDate to today when not provided', () => {
    mockToday('2025-06-20');
    expect(calculateElapsedDays('2025-06-15')).toBe(5);
  });
});

describe('formatDate', () => {
  it('formats ISO date to Korean format', () => {
    expect(formatDate('2025-01-05')).toBe('2025년 1월 5일');
  });

  it('formats date with double-digit month and day', () => {
    expect(formatDate('2025-12-25')).toBe('2025년 12월 25일');
  });
});

describe('calculateExpectedProgress', () => {
  it('returns 50 when halfway through the period', () => {
    mockToday('2025-01-06');
    // 10 total days, 5 elapsed
    expect(calculateExpectedProgress('2025-01-01', '2025-01-11')).toBe(50);
  });

  it('returns 0 when today is the start date', () => {
    mockToday('2025-01-01');
    expect(calculateExpectedProgress('2025-01-01', '2025-01-11')).toBe(0);
  });

  it('returns 100 when today is the deadline', () => {
    mockToday('2025-01-11');
    expect(calculateExpectedProgress('2025-01-01', '2025-01-11')).toBe(100);
  });

  it('clamps to 100 when today is past the deadline', () => {
    mockToday('2025-01-20');
    expect(calculateExpectedProgress('2025-01-01', '2025-01-11')).toBe(100);
  });

  it('clamps to 0 when today is before the start date', () => {
    mockToday('2024-12-25');
    expect(calculateExpectedProgress('2025-01-01', '2025-01-11')).toBe(0);
  });

  it('returns 100 when start equals deadline (zero-length period)', () => {
    mockToday('2025-01-01');
    expect(calculateExpectedProgress('2025-01-01', '2025-01-01')).toBe(100);
  });
});
