/**
 * JSON 파싱 유틸리티 — Bedrock 응답에서 ```json 코드블록 래핑 제거 후 파싱
 */

/**
 * Parse JSON from a raw string, removing ```json or ``` code block wrapping if present.
 * Strips leading/trailing whitespace. Throws on invalid JSON after cleanup.
 */
export function parseJsonResponse(raw: string): unknown {
  const trimmed = raw.trim();

  // Remove ```json ... ``` wrapping (case-insensitive)
  const jsonBlockMatch = trimmed.match(/^```json\s*\n?([\s\S]*?)\n?\s*```$/i);
  if (jsonBlockMatch) {
    return JSON.parse(jsonBlockMatch[1].trim());
  }

  // Remove ``` ... ``` wrapping (generic code block)
  const genericBlockMatch = trimmed.match(/^```\s*\n?([\s\S]*?)\n?\s*```$/i);
  if (genericBlockMatch) {
    return JSON.parse(genericBlockMatch[1].trim());
  }

  // Plain JSON
  return JSON.parse(trimmed);
}
