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
  progress: number;
  status: string;
  submittedContent: string | null;
}

interface TeamState {
  projectName: string;
  topic: string;
  deadline: string;
  members: MemberInfo[];
  tasks: TaskInfo[];
}

interface RequestBody {
  teamState: TeamState;
  feedback?: string;
}

interface AIReportSection {
  title: string;
  content: string;
  author: string;
  aiComments: string[];
}

interface AIPPTSlide {
  slideNumber: number;
  title: string;
  content: string;
  keywords: string[];
  speakerNotes: string;
}

interface AIResponse {
  report: {
    title: string;
    sections: AIReportSection[];
  };
  pptSlides: AIPPTSlide[];
}

function buildPrompt(body: RequestBody): string {
  const today = new Date().toISOString().split('T')[0];
  const { teamState, feedback } = body;

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

  const tasksWithContent = teamState.tasks
    .map((t) => {
      const assignee = teamState.members.find((m) => m.id === t.assigneeId);
      return `### 태스크: ${t.title}
- 담당자: ${assignee?.name ?? '미배정'}
- 설명: ${t.description}
- 진행률: ${t.progress}%
- 제출된 결과물:
${t.submittedContent ?? '(미제출)'}`;
    })
    .join('\n\n');

  const feedbackSection = feedback
    ? `\n[수정 요청 피드백]\n${feedback}\n위 피드백을 반영하여 보고서를 재생성하세요.`
    : '';

  return `당신은 대학교 조별과제 PM AI입니다.
항상 JSON 형식으로만 응답하세요. 한국어로 응답하세요.

[현재 팀 상태]
- 프로젝트명: ${teamState.projectName}
- 주제: ${teamState.topic}
- 마감일: ${teamState.deadline} (D-${daysLeft})
- 현재 날짜: ${today}

[팀원 현황]
${membersInfo}

[태스크별 결과물]
${tasksWithContent}
${feedbackSection}
[요청 사항]
아래 2가지를 수행하세요:

1. 보고서 병합
- 모든 팀원의 결과물을 하나의 통합 보고서로 병합하세요.
- 논리적 목차 구조(서론/본론/결론)를 자동 생성하세요.
- 각 팀원의 결과물을 적절한 섹션에 배치하세요.
- 섹션 간 연결 문장을 추가하여 자연스럽게 이어지도록 하세요.
- 전체 문체를 통일하세요.
- 각 섹션에 AI 코멘트(보완 사항, 강점 등)를 1~2개 추가하세요.
- author 필드에는 해당 섹션의 원 작성자 이름을 넣으세요.

2. PPT 슬라이드 구성안 생성
- 보고서 내용을 기반으로 10~15장의 발표용 슬라이드 구성안을 생성하세요.
- 각 슬라이드에 제목, 핵심 내용(3~5줄), 키워드 3개, 발표자 노트를 포함하세요.

[응답 JSON 형식]
{
  "report": {
    "title": "보고서 제목",
    "sections": [
      {
        "title": "섹션 제목",
        "content": "섹션 내용 (마크다운 형식)",
        "author": "작성자 이름",
        "aiComments": ["AI 코멘트 1", "AI 코멘트 2"]
      }
    ]
  },
  "pptSlides": [
    {
      "slideNumber": 1,
      "title": "슬라이드 제목",
      "content": "핵심 내용 (3~5줄)",
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "speakerNotes": "발표자 노트"
    }
  ]
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

    const report = {
      title: aiResponse.report.title,
      sections: aiResponse.report.sections,
      status: 'draft' as const,
      pptSlides: null,
    };

    const pptSlides = aiResponse.pptSlides ?? [];

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ report, pptSlides }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '보고서 병합 처리 실패';
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: message }),
    };
  }
};
