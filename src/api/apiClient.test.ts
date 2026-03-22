import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiPost } from './apiClient';

describe('apiPost', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should send POST request with correct headers and body', async () => {
    const mockData = { result: 'ok' };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    await apiPost('/api/test', { key: 'value' });

    expect(fetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    });
  });

  it('should return parsed JSON on success', async () => {
    const mockData = { tasks: [], milestones: [] };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const result = await apiPost('/api/team', {});
    expect(result).toEqual(mockData);
  });

  it('should throw error with status code on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(apiPost('/api/team', {})).rejects.toThrow('API 요청 실패: 500');
  });

  it('should throw error on network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiPost('/api/team', {})).rejects.toThrow('Failed to fetch');
  });
});
