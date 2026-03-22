import { invokeAndParse } from '../shared/bedrockClient';

interface SettleRequest {
  teamState: {
    projectName: string;
    deadline: string;
    members: { id: string; name: string; department: string; strength: string }[];
    tasks: { id: string; title: string; assigneeId: string; progress: number; status: string; review: { scores: { total: number } } | null; deadline: string; lastUpdated: string }[];
    chatMessages: { sender: string; content: string; timestamp: string }[];
    aiSuggestions: { id: string; status: string; relatedTaskId: string }[];
  };
  pointAccounts: {
    memberId: string;
    balance: number;
    deposit: number;
    history: { type: string; amount: number; reason: string }[];
  }[];
}

export const handler = async (event: { body: string }) => {
  try {
    const input: SettleRequest = JSON.parse(event.body);
    const { teamState, pointAccounts } = input;

    const today = new Date().toISOString().split('T')[0];
    const memberSummary = teamState.members.map((m) => {
      const tasks = teamState.tasks.filter((t) => t.assigneeId === m.id);
      const avgScore = tasks.reduce((sum, t) => sum + (t.review?.scores.total ?? 0), 0) / (tasks.length || 1);
      const completedOnTime = tasks.filter((t) => t.status === 'done' && t.lastUpdated <= t.deadline).length;
      const chatCount = teamState.chatMessages.filter((msg) => msg.sender === m.id).length;
      const suggestions = teamState.aiSuggestions.filter((s) => {
        const task = teamState.tasks.find((t) => t.id === s.relatedTaskId);
        return task?.assigneeId === m.id;
      });
      const acceptRate = suggestions.length > 0
        ? suggestions.filter((s) => s.status === 'accepted').length / suggestions.length
        : 0;
      const account = pointAccounts.find((a) => a.memberId === m.id);

      return `- ${m.name} (${m.department}, 강점: ${m.strength})
  담당 태스크: ${tasks.length}개, 평균 품질: ${avgScore.toFixed(0)}점
  마감 준수: ${completedOnTime}/${tasks.length}건
  채팅 참여: ${chatCount}회, AI 제안 수락률: ${(acceptRate * 100).toFixed(0)}%
  현재 포인트: ${account?.balance ?? 0}pt (보증금: ${account?.deposit ?? 0}pt)`;
    }).join('\n');

    const prompt = `당신은 대학교 조별과제 PM AI입니다.
항상 JSON 형식으로만 응답하세요. 한국어로 응답하세요.

[프로젝트 종료 정산]
- 프로젝트명: ${teamState.projectName}
- 마감일: ${teamState.deadline}
- 현재 날짜: ${today}

[팀원별 활동 데이터]
${memberSummary}

[정산 규칙]
- 각 팀원의 기여도를 종합 분석하세요 (결과물 품질, 마감 준수율, 채팅 참여도, AI 제안 수락률)
- 상위 기여자: 보증금 전액 반환 + 보너스 포인트
- 평균 기여자: 보증금 전액 반환
- 하위 기여자: 보증금 일부 차감
- 기여도 1위에게 Best Collaborator 인증서 발급
- 하드코딩 없이 매번 동적으로 판단하세요

[응답 JSON 형식]
{
  "members": [
    {
      "memberId": "string",
      "pointChange": 0,
      "reason": "정산 사유",
      "totalPoints": 0,
      "badge": "뱃지명",
      "certificate": "인증서 내용 또는 null"
    }
  ],
  "bestCollaborator": "memberId",
  "aiComment": "전체 정산 요약 코멘트"
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
      body: JSON.stringify({ error: '포인트 정산 처리 중 오류가 발생했습니다' }),
    };
  }
};
