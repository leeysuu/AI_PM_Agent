import { describe, it, expect } from 'vitest';
import { parseJsonResponse } from './jsonParser';

describe('parseJsonResponse', () => {
  it('parses plain JSON object', () => {
    const result = parseJsonResponse('{"key": "value"}');
    expect(result).toEqual({ key: 'value' });
  });

  it('parses plain JSON array', () => {
    const result = parseJsonResponse('[1, 2, 3]');
    expect(result).toEqual([1, 2, 3]);
  });

  it('strips leading/trailing whitespace before parsing', () => {
    const result = parseJsonResponse('  \n  {"a": 1}  \n  ');
    expect(result).toEqual({ a: 1 });
  });

  it('removes ```json code block wrapping', () => {
    const raw = '```json\n{"tasks": [1, 2]}\n```';
    expect(parseJsonResponse(raw)).toEqual({ tasks: [1, 2] });
  });

  it('removes ```json wrapping case-insensitively', () => {
    const raw = '```JSON\n{"ok": true}\n```';
    expect(parseJsonResponse(raw)).toEqual({ ok: true });
  });

  it('removes generic ``` code block wrapping', () => {
    const raw = '```\n{"plain": true}\n```';
    expect(parseJsonResponse(raw)).toEqual({ plain: true });
  });

  it('handles ```json wrapping with extra whitespace', () => {
    const raw = '  ```json\n  {"nested": {"a": 1}}  \n```  ';
    expect(parseJsonResponse(raw)).toEqual({ nested: { a: 1 } });
  });

  it('throws on invalid JSON after cleanup', () => {
    expect(() => parseJsonResponse('not json')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => parseJsonResponse('')).toThrow();
  });

  it('parses JSON with multiline content inside code block', () => {
    const raw = '```json\n{\n  "a": 1,\n  "b": 2\n}\n```';
    expect(parseJsonResponse(raw)).toEqual({ a: 1, b: 2 });
  });
});
