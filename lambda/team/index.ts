import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { invokeAndParse } from '../shared/bedrockClient';

interface MemberInput {
  name: string;
  department: string;
  strength: string;
}

interface RequestBody {
  projectName: string;
  topic: string;
  deadline: string;
  members: MemberInput[];
}

interface AITask {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assignReason: string;
  startDate: string;
  deadline: string;
  difficulty: '상' | '중' | '하';
}

interface AIMilestone {
  week: number;
  startDate: string;
  endDate: string;
  goals: string[];
  keyDeadlines: string[];
}

interface AIResponse {
  tasks: AITask[];
  milestones: AIMilestone[];
  aiMessage: string;
}

function buildPrompt(body: RequestBody): string {
  const today = new Date().toISOString().split('T')[0];
  const deadlineDate = new Date(body.deadline);
  const todayDate = new Date(today);
  const daysLeft = Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / 86400000);

  const membersInfo = body.members
    .map((m, i) => `${i + 1}. ${m.name} (${m.department}) — 강점: ${m.strength}`)
    .join('\n');

  return `당신은 대학교 조별과제 PM AI입니다.
항상 JSON 형식으로만 응답하세요. 한국어로 응답하세요.

[현재 팀 상태]
- 프로젝트명: ${body.projectName}
- 주제: ${body.topic || '미정'}
- 마감일: ${body.deadline} (D-${daysLeft})
- 현재 날짜: ${today}

[팀원 현황]
${membersInfo}

[요청 사항]
1. 팀원들의 강점과 프로젝트 주제를 분석하여 5~8개의 태스크를 생성하세요.
2. 각 태스크에 가장 적합한 팀원을 배정하고, 배정 이유를 설명하세요.
3. 각 태스크에 난이도(상/중/하)를 산정하고, 팀원 간 부하를 균형 있게 배분하세요.
4. 마감일(${body.deadline})에서 역산하여 주간 마일스톤을 생성하세요.
5. 각 태스크에 시작일과 중간 마감일을 설정하세요.
6. 태스크 간 의존성을 고려하여 실행 순서를 배치하세요.

[응답 JSON 형식]
{
  "tasks": [
    {
      "id": "task-1",
      "title": "태스크 제목",
      "description": "태스크 상세 설명",
      "assigneeId": "팀원 이름 (위 팀원 현황의 이름과 정확히 일치)",
      "assignReason": "배정 이유",
      "startDate": "YYYY-MM-DD",
      "deadline": "YYYY-MM-DD",
      "difficulty": "상|중|하"
    }
  ],
  "milestones": [
    {
      "week": 1,
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "goals": ["이번 주 목표 1", "이번 주 목표 2"],
      "keyDeadlines": ["주요 마감 항목"]
    }
  ],
  "aiMessage": "팀에게 전달할 AI PM의 인사 메시지"
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

    if (!body.projectName || !body.deadline || !body.members?.length) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: '필수 입력값이 누락되었습니다.' }),
      };
    }

    const prompt = buildPrompt(body);
    const aiResponse = await invokeAndParse<AIResponse>(prompt);

    // Normalize tasks: add default fields expected by frontend
    const tasks = aiResponse.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      assigneeId: t.assigneeId,
      startDate: t.startDate,
      deadline: t.deadline,
      progress: 0,
      status: 'todo' as const,
      difficulty: t.difficulty,
      submittedContent: null,
      review: null,
      lastUpdated: new Date().toISOString(),
    }));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        tasks,
        milestones: aiResponse.milestones,
        aiMessage: aiResponse.aiMessage,
      }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 응답 처리 실패';
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: message }),
    };
  }
};
