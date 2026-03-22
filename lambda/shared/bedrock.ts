import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

const MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

/**
 * Bedrock Claude 모델을 호출하여 프롬프트에 대한 응답을 반환한다.
 */
export async function invokeBedrock(prompt: string): Promise<string> {
  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const response = await client.send(command);
  const raw = new TextDecoder().decode(response.body);
  return raw;
}

/**
 * Bedrock 응답을 파싱하여 JSON 객체로 변환한다.
 * - Bedrock 응답 구조에서 텍스트를 추출
 * - ```json 코드블록 래핑을 제거
 */
export function parseAIResponse(raw: string): unknown {
  const parsed = JSON.parse(raw);
  const text: string = parsed.content?.[0]?.text || raw;
  const cleaned = text
    .replace(/^```json\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}
