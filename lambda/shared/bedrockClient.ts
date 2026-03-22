import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
const REGION = process.env.AWS_REGION || 'us-east-1';

const client = new BedrockRuntimeClient({ region: REGION });

/**
 * Bedrock Claude 모델 호출. 프롬프트를 전송하고 텍스트 응답을 반환한다.
 */
export async function invokeBedrock(prompt: string): Promise<string> {
  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
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
 * Bedrock 응답 JSON 파싱.
 * 1) Bedrock 응답 구조에서 content[0].text 추출
 * 2) ```json 코드블록 래핑 제거
 * 3) JSON.parse 수행
 */
export function parseAIResponse<T = unknown>(raw: string): T {
  // Bedrock 응답 구조에서 텍스트 추출
  const outer = JSON.parse(raw);
  const text: string = outer.content?.[0]?.text ?? raw;

  // ```json ... ``` 래핑 제거
  const cleaned = text
    .replace(/^```json\s*\n?/i, '')
    .replace(/\n?\s*```\s*$/i, '')
    .trim();

  return JSON.parse(cleaned) as T;
}

/**
 * Bedrock 호출 + JSON 파싱을 한번에 수행. 실패 시 1회 재시도.
 */
export async function invokeAndParse<T = unknown>(prompt: string): Promise<T> {
  try {
    const raw = await invokeBedrock(prompt);
    return parseAIResponse<T>(raw);
  } catch {
    // 1회 재시도
    const raw = await invokeBedrock(prompt);
    return parseAIResponse<T>(raw);
  }
}
