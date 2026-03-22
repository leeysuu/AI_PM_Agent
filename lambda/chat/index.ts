import { invokeBedrock, parseAIResponse } from '../shared/bedrock';

interface APIGatewayProxyEvent {
  body: string | null;
  headers: Record<string, string | undefined>;
  httpMethod: string;
  path: string;
}

interface APIGatewayProxyResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface ChatRequest {
  teamState: {
    projectName: string;
    topic: string;
    deadline: string;
    members: { id: string; name: string; department: string; strength: string; assignedTasks: string[] }[];
    tasks: { id: string; title: string; assigneeId: string; status: string; progress: number; deadline: string }[];
    milestones: { week: number; goals: string[] }[];
    chatMessages: { id: string; sender: string; content: string; timestamp: string }[];
  };
  newMessage: string;
  sender: string;
}

interface ChatDetection {
  type: 'decision' | 'newTask' | 'risk' | 'none';
  confidence: number;
  detail: string;
}

interface ChatResponse {
  detection: ChatDetection;
  shouldIntervene: boolean;
  aiResponse: string;
  suggestedActions: { type: string; detail: string }[];
}

const corsHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function buildPrompt(input: ChatRequest): string {
  const { teamState, newMessage, sender } = input;

  const recentMessages = (teamState.chatMessages || []).slice(-20);

  const chatHistory = recentMessages
    .map((m) => `[${m.timestamp}] ${m.sender}: ${m.content}`)
    .join('\n');

  const membersInfo = (teamState.members || [])
    .map((m) => `- ${m.name} (${m.department}, 강점: ${m.strength})`)
    .join('\n');

  const tasksInfo = (teamState.tasks || [])
    .map((t) => `- [${t.status}] ${t.title} (담당: ${teamState.members.find((m) => m.id === t.assigneeId)?.name || '미배정'}, 진행률: ${t.progress}%, 마감: ${t.deadline})`)
    .join('\n');

  const milestonesInfo = (teamState.milestones || [])
    .map((ms) => `- ${ms.week}주차: ${ms.goals.join(', ')}`)
    .join('\n');

  return `당신은 AI 조별과제 PM 에이전트입니다. 팀 채팅 대화를 분석하여 의사결정, 새 태스크, 일정 리스크를 감지하세요.

## 프로젝트 정보
- 프로젝트명: ${teamState.projectName}
- 주제: ${teamState.topic}
- 마감일: ${teamState.deadline}

## 팀원 정보
${membersInfo}

## 현재 태스크 현황
${tasksInfo}

## 마일스톤
${milestonesInfo}

## 최근 대화 내역 (최대 20개)
${chatHistory}

## 새 메시지
발신자: ${sender}
내용: ${newMessage}

## 분석 지침
1. 위 대화 컨텍스트와 새 메시지를 종합적으로 분석하세요.
2. 다음 중 하나를 감지하세요:
   - "decision": 팀의 의사결정이 이루어진 경우 (예: "그렇게 하자", "A안으로 결정")
   - "newTask": 새로운 태스크가 언급된 경우 (예: "이것도 해야 할 것 같아", "추가 조사 필요")
   - "risk": 일정 리스크가 감지된 경우 (예: "시간이 부족해", "마감 못 맞출 것 같아")
   - "none": 감지할 내용이 없는 일반 대화
3. confidence 점수를 0.0~1.0으로 산출하세요.
4. shouldIntervene: confidence >= 0.7이면 true, 아니면 false
5. shouldIntervene이 true일 때만 aiResponse를 생성하세요:
   - decision: "📋 의사결정 감지: [내용]. 회의록에 자동 기록했습니다."
   - newTask: "📌 새 태스크 감지: [태스크명]. 담당: [이름] / 마감: [날짜]로 추가할까요?"
   - risk: "📅 일정 리스크 감지. 대안 1: [내용] / 대안 2: [내용]"
6. shouldIntervene이 false이거나 type이 "none"이면 aiResponse는 빈 문자열로 하세요.
7. suggestedActions에 후속 조치를 배열로 제안하세요.

## 응답 형식 (반드시 아래 JSON 형식으로만 응답하세요)
{
  "detection": {
    "type": "decision" | "newTask" | "risk" | "none",
    "confidence": 0.0~1.0,
    "detail": "감지된 내용 설명"
  },
  "shouldIntervene": true/false,
  "aiResponse": "AI 봇 메시지 (shouldIntervene이 true일 때만, 아니면 빈 문자열)",
  "suggestedActions": [
    { "type": "action_type", "detail": "설명" }
  ]
}`;
}

async function processChat(body: ChatRequest): Promise<ChatResponse> {
  const prompt = buildPrompt(body);
  const raw = await invokeBedrock(prompt);
  const result = parseAIResponse(raw) as ChatResponse;

  // Ensure shouldIntervene aligns with confidence threshold
  result.shouldIntervene = result.detection.confidence >= 0.7 && result.detection.type !== 'none';

  // Clear aiResponse when not intervening
  if (!result.shouldIntervene) {
    result.aiResponse = '';
  }

  return result;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const body: ChatRequest = JSON.parse(event.body || '{}');
    const result = await processChat(body);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };
  } catch (error) {
    // Retry once on failure
    try {
      const body: ChatRequest = JSON.parse(event.body || '{}');
      const result = await processChat(body);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result),
      };
    } catch (retryError) {
      console.error('Chat analysis failed after retry:', retryError);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'AI 채팅 분석 처리 실패' }),
      };
    }
  }
};
