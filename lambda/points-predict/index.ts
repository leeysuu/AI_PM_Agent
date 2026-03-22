import { invokeAndParse } from '../shared/bedrockClient';

interface PredictRequest {
  teamState: {
    projectName: string;
    deadline: string;
    members: { id: string; name: string; department: string; strength: string }[];
    tasks: { id: string; title: string; assigneeId: string; progress: number; status: string; deadline: string; lastUpdated: string }[];
    chatMessages: { sender: string; timestamp: string }[];
  };
  pointAccounts: {
    memberId: string;
    balance: number;
    deposit: number;
    history: { type: string; amount: number; reason: string; createdAt: string }[];
  }[];
}

export const handler = async (event: { body: string }) => {
  try {
    const input: PredictRequest = JSON.parse(event.body);
    const { teamState, pointAccounts } = input;

    const today = new Date().toISOString().split('T')[0];
    const daysLeft = Math.ceil(
      (new Date(teamState.deadline).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    );

    const memberSummary = teamState.members.map((m) => {
      const tasks = teamState.tasks.filter((t) => t.assigneeId === m.id);
      const account = pointAccounts.find((a) => a.memberId === m.id);
      const recentEvents = account?.history.slice(-5).map((e) => `${e.type}: ${e.amount}pt`).join(', ') ?? '없음';

      return `- ${m.name}: 현재 ${account?.balance ?? 0}pt, 태스크 ${tasks.length}개 (완료: ${tasks.filter((t) => t.status === 'done').length}), 최근 이벤트: [${recentEvents}]`;
    }).join('\n');

    const prompt = `당신은 대학교 조별과제 PM AI입니다.
항상 JSON 형식으로만 응답하세요. 한국어로 응답하세요.

[포인트 예측 요청]
- 프로젝트명: ${teamState.projectName}
- 마감일: ${teamState.deadline} (D-${daysLeft})
- 현재 날짜: ${today}

[팀원별 현황]
${memberSummary}

[AI 3단계 자율 사고]
1단계 - 예측: 현재 상태로 프로젝트가 종료되면 각 팀원의 포인트가 어떻게 변동될지 예측하세요
2단계 - 행동: 차감이 예상되는 팀원에게 경고 메시지와 동기부여 메시지를 생성하세요

[응답 JSON 형식]
{
  "predictions": [
    {
      "memberId": "string",
      "predictedChange": 0,
      "warning": "경고 메시지 (없으면 빈 문자열)",
      "motivationMessage": "동기부여 메시지"
    }
  ]
}`;

    const result = await invokeAndParse(prompt);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: '포인트 예측 처리 중 오류가 발생했습니다' }),
    };
  }
};
