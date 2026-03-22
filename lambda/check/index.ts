import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { invokeAndParse } from '../shared/bedrockClient';

interface MemberInfo {
  id: string;
  name: string;
  department: string;
  strength: string;
  assignedTasks: string[];
}

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

interface AlertInfo {
  id: string;
  message: string;
  type: string;
  target: string;
  priority: string;
  createdAt: string;
}

interface TeamState {
  projectName: string;
  topic: string;
  deadline: string;
  members: MemberInfo[];
  tasks: TaskInfo[];
  alerts: AlertInfo[];
  createdAt: string;
}

interface RequestBody {
  teamState: TeamState;
}

interface AIAlert {
  message: string;
  type: 'deadline' | 'delay' | 'nudge' | 'completion';
  target: string;
  priority: 'high' | 'medium' | 'low';
}

interface AIResponse {
  alerts: AIAlert[];
  triggerMerge: boolean;
  aiChatMessage: string;
}

function buildPrompt(body: RequestBody): string {
  const today = new Date().toISOString().split('T')[0];
  const { teamState } = body;

  const deadlineDate = new Date(teamState.deadline);
  const todayDate = new Date(today);
  const daysLeft = Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / 86400000);

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
      const assignee = teamState.members.find((m) => m.id === t.assigneeId);
      const lastUpdatedDate = new Date(t.lastUpdated);
      const daysSinceUpdate = Math.floor((todayDate.getTime() - lastUpdatedDate.getTime()) / 86400000);
      return `- [${t.id}] ${t.title} | 담당: ${assignee?.name ?? '미배정'} | 진행률: ${t.progress}% | 마감: ${t.deadline} | 상태: ${t.status} | 마지막 업데이트: ${t.lastUpdated} (${daysSinceUpdate}일 전)`;
    })
    .join('\n');

  const allDone = teamState.tasks.length > 0 && teamState.tasks.every((t) => t.status === 'done');
  const completedCount = teamState.tasks.filter((t) => t.status === 'done').length;
  const totalCount = teamState.tasks.length;

  return `당신은 대학교 조별과제 PM AI입니다.
항상 JSON 형식으로만 응답하세요. 한국어로 응답하세요.

[현재 팀 상태]
- 프로젝트명: ${teamState.projectName}
- 주제: ${teamState.topic}
- 마감일: ${teamState.deadline} (D-${daysLeft})
- 현재 날짜: ${today}
- 완료 태스크: ${completedCount}/${totalCount}
- 전원 완료 여부: ${allDone ? '예' : '아니오'}

[팀원 현황]
${membersInfo}

[태스크 현황]
${tasksInfo}

[요청 사항]
아래 점검 항목을 분석하고 필요한 알림을 생성하세요. 모든 판단은 현재 팀 상태를 동적으로 분석하여 수행하세요.

점검 항목:
1. 마감 임박 알림: 전체 마감일이 D-3 또는 D-1이면 팀 전체 진행 상황을 분석하여 중간 점검 또는 긴급 알림을 생성하세요.
2. 장기 미업데이트 독촉: 마지막 업데이트로부터 3일 이상 경과한 태스크가 있으면 해당 팀원의 상황을 분석하여 독촉 메시지를 생성하세요.
3. 태스크 완료 축하: 최근 완료된 태스크가 있으면 축하 메시지와 함께 팀 전체 진행률 업데이트를 생성하세요.
4. 전원 완료 감지: 모든 태스크가 완료 상태이면 triggerMerge를 true로 설정하세요.
5. 지연 감지: 기대 진행률 대비 실제 진행률이 크게 뒤처진 태스크가 있으면 지연 알림을 생성하세요.

알림 생성 규칙:
- 해당 사항이 없으면 빈 배열을 반환하세요.
- 하드코딩된 메시지 템플릿이 아닌, 현재 상황에 맞게 매번 다른 메시지를 생성하세요.
- aiChatMessage는 팀 채팅방에 AI PM 봇이 보낼 메시지입니다. 알림이 없으면 빈 문자열로 설정하세요.

[응답 JSON 형식]
{
  "alerts": [
    {
      "message": "알림 메시지 내용",
      "type": "deadline|delay|nudge|completion",
      "target": "팀원 이름 또는 전체",
      "priority": "high|medium|low"
    }
  ],
  "triggerMerge": false,
  "aiChatMessage": "채팅방에 보낼 AI 메시지 (없으면 빈 문자열)"
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

    if (!body.teamState) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: '팀 상태 정보가 누락되었습니다.' }),
      };
    }

    const prompt = buildPrompt(body);
    const aiResponse = await invokeAndParse<AIResponse>(prompt);

    const now = new Date().toISOString();
    const alerts = (aiResponse.alerts ?? []).map((a, i) => ({
      id: `alert-${Date.now()}-${i}`,
      message: a.message,
      type: a.type,
      target: a.target,
      priority: a.priority,
      createdAt: now,
    }));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        alerts,
        triggerMerge: aiResponse.triggerMerge ?? false,
        aiChatMessage: aiResponse.aiChatMessage ?? '',
      }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '자동 점검 처리 실패';
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: message }),
    };
  }
};
