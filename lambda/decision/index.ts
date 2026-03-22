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

interface SuggestionInfo {
  id: string;
  type: string;
  content: string;
  round: number;
  relatedTaskId: string;
  previousSuggestions: string[];
}

interface DecisionRequest {
  teamState: {
    projectName: string;
    topic: string;
    deadline: string;
    members: { id: string; name: string; department: string; strength: string; assignedTasks: string[] }[];
    tasks: { id: string; title: string; assigneeId: string; status: string; progress: number; deadline: string; difficulty: string }[];
    aiSuggestions: SuggestionInfo[];
  };
  suggestionId: string;
  accepted: boolean;
  rejectionReason?: string;
}

interface AppliedChange {
  type: 'reassign_task' | 'extend_deadline' | 'reduce_scope' | 'add_task' | 'split_task';
  taskId: string;
  details: Record<string, unknown>;
}

interface NewSuggestion {
  id: string;
  type: 'reassign' | 'extend' | 'reduce_scope' | 'pair_work' | 'split_task';
  content: string;
  status: 'pending';
  relatedTaskId: string;
  round: number;
  previousSuggestions: string[];
  createdAt: string;
}

interface DecisionResponse {
  action: 'apply' | 'newSuggestion';
  appliedChanges?: AppliedChange[];
  newSuggestion?: NewSuggestion;
}

const corsHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function buildAcceptPrompt(input: DecisionRequest): string {
  const { teamState, suggestionId } = input;
  const suggestion = teamState.aiSuggestions.find((s) => s.id === suggestionId);

  const membersInfo = teamState.members
    .map((m) => `- ${m.name} (id: ${m.id}, ${m.department}, 강점: ${m.strength})`)
    .join('\n');

  const tasksInfo = teamState.tasks
    .map((t) => `- [${t.status}] ${t.title} (id: ${t.id}, 담당: ${teamState.members.find((m) => m.id === t.assigneeId)?.name || '미배정'}, 진행률: ${t.progress}%, 마감: ${t.deadline}, 난이도: ${t.difficulty})`)
    .join('\n');

  return `당신은 AI 조별과제 PM 에이전트입니다. 팀원이 AI 제안을 수락했습니다. 변경사항을 구체적으로 생성하세요.

## 프로젝트 정보
- 프로젝트명: ${teamState.projectName}
- 주제: ${teamState.topic}
- 마감일: ${teamState.deadline}

## 팀원 정보
${membersInfo}

## 현재 태스크 현황
${tasksInfo}

## 수락된 제안
- 유형: ${suggestion?.type}
- 내용: ${suggestion?.content}
- 관련 태스크 ID: ${suggestion?.relatedTaskId}

## 지침
수락된 제안을 기반으로 구체적인 변경사항(appliedChanges)을 생성하세요.
가능한 변경 유형: reassign_task, extend_deadline, reduce_scope, add_task, split_task

## 응답 형식 (반드시 아래 JSON 형식으로만 응답하세요)
{
  "appliedChanges": [
    {
      "type": "reassign_task" | "extend_deadline" | "reduce_scope" | "add_task" | "split_task",
      "taskId": "관련 태스크 ID",
      "details": { ... 변경 세부사항 ... }
    }
  ]
}`;
}

function buildRejectPrompt(input: DecisionRequest): string {
  const { teamState, suggestionId, rejectionReason } = input;
  const suggestion = teamState.aiSuggestions.find((s) => s.id === suggestionId);

  const membersInfo = teamState.members
    .map((m) => `- ${m.name} (id: ${m.id}, ${m.department}, 강점: ${m.strength})`)
    .join('\n');

  const tasksInfo = teamState.tasks
    .map((t) => `- [${t.status}] ${t.title} (id: ${t.id}, 담당: ${teamState.members.find((m) => m.id === t.assigneeId)?.name || '미배정'}, 진행률: ${t.progress}%, 마감: ${t.deadline}, 난이도: ${t.difficulty})`)
    .join('\n');

  // Build history of all previous suggestions for this task
  const relatedSuggestions = teamState.aiSuggestions
    .filter((s) => s.relatedTaskId === suggestion?.relatedTaskId)
    .map((s) => `- [라운드 ${s.round}, ${s.type}] ${s.content}`)
    .join('\n');

  return `당신은 AI 조별과제 PM 에이전트입니다. 팀원이 AI 제안을 거절했습니다. 거절 사유를 분석하고 새로운 대안을 생성하세요.

## 프로젝트 정보
- 프로젝트명: ${teamState.projectName}
- 주제: ${teamState.topic}
- 마감일: ${teamState.deadline}

## 팀원 정보
${membersInfo}

## 현재 태스크 현황
${tasksInfo}

## 거절된 제안
- 유형: ${suggestion?.type}
- 내용: ${suggestion?.content}
- 관련 태스크 ID: ${suggestion?.relatedTaskId}
- 현재 라운드: ${suggestion?.round}

## 거절 사유
${rejectionReason}

## 이전 제안 이력 (이 태스크에 대한 모든 제안)
${relatedSuggestions || '없음'}

## 지침
1. 거절 사유를 분석하여 팀 상황에 맞는 새로운 대안을 생성하세요.
2. 이전에 거절된 제안과 동일한 내용을 반복하지 마세요.
3. 대안 유형: reassign (다른 팀원 이관), extend (마감 연장), reduce_scope (범위 축소), pair_work (페어워크), split_task (태스크 분할)
4. 팀원의 강점, 현재 부하, 마감일 근접도를 고려하세요.

## 응답 형식 (반드시 아래 JSON 형식으로만 응답하세요)
{
  "newSuggestion": {
    "type": "reassign" | "extend" | "reduce_scope" | "pair_work" | "split_task",
    "content": "구체적인 대안 설명"
  }
}`;
}

async function processAccept(body: DecisionRequest): Promise<DecisionResponse> {
  const prompt = buildAcceptPrompt(body);
  const raw = await invokeBedrock(prompt);
  const result = parseAIResponse(raw) as { appliedChanges: AppliedChange[] };

  return {
    action: 'apply',
    appliedChanges: result.appliedChanges,
  };
}

async function processReject(body: DecisionRequest): Promise<DecisionResponse> {
  const suggestion = body.teamState.aiSuggestions.find((s) => s.id === body.suggestionId);
  const currentRound = suggestion?.round ?? 1;

  // Round limit check
  if (currentRound >= 3) {
    return {
      action: 'newSuggestion',
      newSuggestion: undefined,
    };
  }

  const prompt = buildRejectPrompt(body);
  const raw = await invokeBedrock(prompt);
  const result = parseAIResponse(raw) as {
    newSuggestion: { type: NewSuggestion['type']; content: string };
  };

  const newRound = currentRound + 1;
  const previousIds = suggestion?.previousSuggestions
    ? [...suggestion.previousSuggestions, body.suggestionId]
    : [body.suggestionId];

  return {
    action: 'newSuggestion',
    newSuggestion: {
      id: `suggestion-${Date.now()}`,
      type: result.newSuggestion.type,
      content: result.newSuggestion.content,
      status: 'pending',
      relatedTaskId: suggestion?.relatedTaskId ?? '',
      round: newRound,
      previousSuggestions: previousIds,
      createdAt: new Date().toISOString(),
    },
  };
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const body: DecisionRequest = JSON.parse(event.body || '{}');

    const result = body.accepted
      ? await processAccept(body)
      : await processReject(body);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };
  } catch (error) {
    // Retry once on failure
    try {
      const body: DecisionRequest = JSON.parse(event.body || '{}');
      const result = body.accepted
        ? await processAccept(body)
        : await processReject(body);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result),
      };
    } catch (retryError) {
      console.error('Decision processing failed after retry:', retryError);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'AI 제안 처리 실패' }),
      };
    }
  }
};
