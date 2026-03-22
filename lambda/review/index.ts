import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { invokeAndParse } from '../shared/bedrockClient';

interface TaskInfo {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  startDate: string;
  deadline: string;
  progress: number;
  status: string;
  difficulty: string;
  submittedContent: string | null;
  lastUpdated: string;
}

interface MemberInfo {
  id: string;
  name: string;
  department: string;
  strength: string;
  assignedTasks: string[];
}

interface SuggestionInfo {
  id: string;
  type: string;
  content: string;
  status: string;
  rejectionReason?: string;
  relatedTaskId: string;
  round: number;
}

interface TeamState {
  projectName: string;
  topic: string;
  deadline: string;
  members: MemberInfo[];
  tasks: TaskInfo[];
  aiSuggestions: SuggestionInfo[];
  createdAt: string;
}

interface RequestBody {
  teamState: TeamState;
  taskId: string;
  submittedContent: string;
}

interface AIReviewScores {
  completeness: number;
  logic: number;
  volume: number;
  relevance: number;
  total: number;
}

interface AIDelayDetection {
  expectedProgress: number;
  actualProgress: number;
  gap: number;
  severity: 'critical' | 'warning' | 'normal';
}

interface AIReassignSuggestion {
  type: 'reassign' | 'extend' | 'reduce_scope' | 'pair_work' | 'split_task';
  content: string;
  relatedTaskId: string;
}

interface AIResponse {
  review: {
    scores: AIReviewScores;
    feedback: string[];
    suggestedProgress: number;
  };
  delayDetection: AIDelayDetection;
  reassignSuggestion: AIReassignSuggestion | null;
}

function buildPrompt(body: RequestBody): string {
  const today = new Date().toISOString().split('T')[0];
  const { teamState, taskId, submittedContent } = body;

  const deadlineDate = new Date(teamState.deadline);
  const todayDate = new Date(today);
  const daysLeft = Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / 86400000);

  const task = teamState.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`태스크를 찾을 수 없습니다: ${taskId}`);

  const assignee = teamState.members.find((m) => m.id === task.assigneeId);

  // 기대 진행률 계산
  const taskStart = new Date(task.startDate);
  const taskDeadline = new Date(task.deadline);
  const totalDays = Math.max(1, Math.ceil((taskDeadline.getTime() - taskStart.getTime()) / 86400000));
  const elapsed = Math.ceil((todayDate.getTime() - taskStart.getTime()) / 86400000);
  const expectedProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));

  const membersInfo = teamState.members
    .map((m) => {
      const memberTasks = teamState.tasks.filter((t) => t.assigneeId === m.id);
      const avgProgress = memberTasks.length > 0
        ? Math.round(memberTasks.reduce((sum, t) => sum + t.progress, 0) / memberTasks.length)
        : 0;
      return `- ${m.name} (${m.department}, 강점: ${m.strength}) — 담당 태스크 ${memberTasks.length}개, 평균 진행률 ${avgProgress}%`;
    })
    .join('\n');

  const tasksInfo = teamState.tasks
    .map((t) => {
      const a = teamState.members.find((m) => m.id === t.assigneeId);
      return `- [${t.id}] ${t.title} | 담당: ${a?.name ?? '미배정'} | 진행률: ${t.progress}% | 마감: ${t.deadline} | 상태: ${t.status} | 난이도: ${t.difficulty}`;
    })
    .join('\n');

  const prevSuggestions = teamState.aiSuggestions
    .filter((s) => s.relatedTaskId === taskId)
    .map((s) => `- [${s.status}] ${s.content}${s.rejectionReason ? ` (거절 사유: ${s.rejectionReason})` : ''}`)
    .join('\n') || '없음';

  return `당신은 대학교 조별과제 PM AI입니다.
항상 JSON 형식으로만 응답하세요. 한국어로 응답하세요.

[현재 팀 상태]
- 프로젝트명: ${teamState.projectName}
- 주제: ${teamState.topic}
- 마감일: ${teamState.deadline} (D-${daysLeft})
- 현재 날짜: ${today}

[팀원 현황]
${membersInfo}

[태스크 현황]
${tasksInfo}

[이전 AI 제안 이력 — 같은 제안 반복 금지]
${prevSuggestions}

[리뷰 대상]
- 태스크: ${task.title} (${task.id})
- 설명: ${task.description}
- 담당자: ${assignee?.name ?? '미배정'} (${assignee?.department ?? ''}, 강점: ${assignee?.strength ?? ''})
- 태스크 시작일: ${task.startDate}
- 태스크 마감일: ${task.deadline}
- 난이도: ${task.difficulty}
- 기대 진행률 (경과일/전체일 × 100): ${expectedProgress}%

[제출된 결과물]
${submittedContent}

[요청 사항 — 4단계 연쇄 처리]
아래 4단계를 순서대로 수행하세요. 각 단계의 결과가 다음 단계의 입력이 됩니다.

STEP 1: 품질 리뷰
- 완성도(0~25): 태스크 설명 대비 결과물의 완성 정도
- 논리성(0~25): 내용의 논리적 흐름과 일관성
- 분량(0~25): 기대 분량 대비 적절성
- 주제적합성(0~25): 프로젝트 주제와의 관련성
- total = 4개 항목 합산 (0~100)
- 구체적 개선 포인트 피드백 2~4개

STEP 2: 진행률 자동 산정
- STEP 1의 total 점수를 기반으로 진행률을 산정하세요:
  - 80점 이상 → 90~100% 범위에서 자율 결정
  - 60~79점 → 60~89% 범위에서 자율 결정
  - 40~59점 → 30~59% 범위에서 자율 결정
  - 40점 미만 → 0~29% 범위에서 자율 결정

STEP 3: 지연 감지
- 기대 진행률: ${expectedProgress}%
- 실제 진행률: STEP 2에서 산정한 값
- gap = 기대 진행률 - 실제 진행률 (음수면 0으로)
- severity 판정:
  - gap ≥ 20 → "critical"
  - gap ≥ 10 → "warning"
  - gap < 10 → "normal"

STEP 4: 재배분 제안 (severity가 "critical"일 때만)
- 팀 전체 상황(팀원 부하, 강점, 마감일 근접도)을 분석하여 재배분 제안을 생성하세요.
- severity가 "critical"이 아니면 reassignSuggestion은 null로 설정하세요.
- 이전 AI 제안 이력과 동일한 내용을 반복하지 마세요.

[응답 JSON 형식]
{
  "review": {
    "scores": {
      "completeness": 0,
      "logic": 0,
      "volume": 0,
      "relevance": 0,
      "total": 0
    },
    "feedback": ["개선 포인트 1", "개선 포인트 2"],
    "suggestedProgress": 0
  },
  "delayDetection": {
    "expectedProgress": ${expectedProgress},
    "actualProgress": 0,
    "gap": 0,
    "severity": "normal"
  },
  "reassignSuggestion": null
}

reassignSuggestion이 있을 경우:
{
  "type": "reassign|extend|reduce_scope|pair_work|split_task",
  "content": "제안 내용 설명",
  "relatedTaskId": "${taskId}"
}`;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body: RequestBody = JSON.parse(event.body || '{}');

    if (!body.teamState || !body.taskId || !body.submittedContent) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: '필수 입력값이 누락되었습니다.' }),
      };
    }

    const prompt = buildPrompt(body);
    const aiResponse = await invokeAndParse<AIResponse>(prompt);

    // Normalize response: ensure delayDetection fields are present
    const review = {
      taskId: body.taskId,
      scores: aiResponse.review.scores,
      feedback: aiResponse.review.feedback,
      suggestedProgress: aiResponse.review.suggestedProgress,
      delayDetection: {
        expectedProgress: aiResponse.delayDetection.expectedProgress,
        actualProgress: aiResponse.delayDetection.actualProgress,
        gap: Math.max(0, aiResponse.delayDetection.gap),
        severity: aiResponse.delayDetection.severity,
      },
    };

    const reassignSuggestion = aiResponse.reassignSuggestion
      ? {
          id: `suggestion-${Date.now()}`,
          type: aiResponse.reassignSuggestion.type,
          content: aiResponse.reassignSuggestion.content,
          status: 'pending' as const,
          previousSuggestions: [] as string[],
          relatedTaskId: aiResponse.reassignSuggestion.relatedTaskId || body.taskId,
          round: 1,
          createdAt: new Date().toISOString(),
        }
      : null;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        review,
        delayDetection: review.delayDetection,
        reassignSuggestion,
      }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 리뷰 처리 실패';
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: message }),
    };
  }
};
