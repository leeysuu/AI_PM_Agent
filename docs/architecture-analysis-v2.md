# AI 조별과제 PM 에이전트 - 아키텍처 분석서 v2

## 1. 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AWS Amplify (React + TypeScript)                 │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ 팀 생성  │ │ 채팅방   │ │ 칸반보드 │ │ AI 제안  │ │ 보고서   │ │
│  │ 폼      │ │ +AI봇    │ │ 대시보드 │ │ 패널     │ │ 뷰어     │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│       │            │            │             │             │       │
│  ┌────┴────────────┴────────────┴─────────────┴─────────────┴────┐ │
│  │           React Context + useReducer (전역 상태)               │ │
│  │           + localStorage (영속성 레이어)                       │ │
│  └────────────────────────────┬──────────────────────────────────┘ │
└───────────────────────────────┼─────────────────────────────────────┘
                                │ HTTPS
                    ┌───────────┴───────────┐
                    │   API Gateway (REST)   │
                    └───────────┬───────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────────┐
│                        AWS Lambda (Node.js 20)                       │
│                                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │POST /team   │ │POST /chat   │ │POST /review │ │POST /decision│  │
│  │역할분배     │ │대화분석     │ │품질리뷰     │ │대안생성      │  │
│  │+일정생성    │ │+자동개입    │ │+진행률산정  │ │(최대3회)     │  │
│  │             │ │             │ │+지연감지    │ │              │  │
│  │             │ │             │ │+재배분제안  │ │              │  │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬───────┘  │
│         │               │               │               │          │
│  ┌──────┴──────┐ ┌──────┴──────┐                                   │
│  │POST /merge  │ │GET /check   │                                   │
│  │보고서취합   │ │주기점검     │                                   │
│  │+PPT생성     │ │+알림생성    │                                   │
│  └──────┬──────┘ └──────┬──────┘                                   │
│         │               │                                          │
│  ┌──────┴───────────────┴───────────────────────────────────────┐  │
│  │              Bedrock Claude 호출 레이어                        │  │
│  │         (프롬프트 구성 + JSON 파싱 + 에러 핸들링)              │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
└─────────────────────────────┼──────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │    Amazon Bedrock        │
                 │    Claude 3.5 Sonnet     │
                 │    (7가지 AI 역할 수행)   │
                 └─────────────────────────┘
```

### 핵심 데이터 흐름

```
[팀 생성 흐름]
팀원정보 입력 → POST /team → Bedrock(역할분배+일정) → 칸반보드 초기화

[채팅 흐름]
메시지 입력 → POST /chat → Bedrock(대화분석) → AI봇 자동응답 + 감지결과 반영

[결과물 연쇄 흐름] ⭐ 핵심
결과물 제출 → POST /review → Bedrock(품질리뷰)
  → 진행률 자동 산정 → 지연 감지 판단
    → 지연 시: 재배분 제안 자동 생성 → AI 제안 패널에 표시

[자율 판단 루프]
AI 제안 → 수락/거절 → POST /decision → Bedrock(대안생성) → 새 제안 (최대 3회)

[보고서 흐름]
전원 제출 완료 감지 → POST /merge → Bedrock(보고서병합+PPT생성) → 승인 대기
```

---

## 2. React 컴포넌트 트리

```
App
├── AppProvider (React Context + useReducer)
│   └── LocalStorageSync (상태 ↔ localStorage 자동 동기화)
│
├── Header
│   ├── ProjectTitle
│   ├── DeadlineCountdown (D-day 뱃지)
│   └── NavTabs (대시보드 / 채팅 / 보고서)
│
├── Routes
│   │
│   ├── /create → TeamCreatePage
│   │   ├── ProjectInfoForm
│   │   │   ├── ProjectNameInput
│   │   │   ├── TopicInput (프로젝트 주제)
│   │   │   └── DeadlinePicker
│   │   ├── MemberAddForm
│   │   │   ├── NameInput
│   │   │   ├── DepartmentInput
│   │   │   ├── StrengthInput
│   │   │   └── AddMemberButton
│   │   ├── MemberList (추가된 팀원 카드 목록)
│   │   │   └── MemberCard (이름/학과/강점 + 삭제버튼)
│   │   └── CreateTeamButton → POST /team → 대시보드로 이동
│   │
│   ├── /dashboard → DashboardPage
│   │   ├── LeftPanel (70%)
│   │   │   ├── MilestoneTimeline (주간 마일스톤 타임라인)
│   │   │   │   └── MilestoneItem (주차별 목표 + 달성여부)
│   │   │   │
│   │   │   └── KanbanBoard
│   │   │       ├── KanbanColumn (status: todo)
│   │   │       │   └── TaskCard
│   │   │       │       ├── TaskTitle + DifficultyBadge
│   │   │       │       ├── AssigneeBadge
│   │   │       │       ├── ProgressBar
│   │   │       │       ├── DeadlineBadge
│   │   │       │       └── SubmitWorkButton → 결과물 제출 모달
│   │   │       ├── KanbanColumn (status: inProgress)
│   │   │       └── KanbanColumn (status: done)
│   │   │
│   │   └── RightPanel (30%)
│   │       ├── AISuggestionPanel
│   │       │   ├── SuggestionCard (pending 상태)
│   │       │   │   ├── SuggestionTypeBadge (재배분/범위축소/마감연장)
│   │       │   │   ├── SuggestionContent
│   │       │   │   ├── ImpactAnalysis (영향도 표시)
│   │       │   │   ├── AcceptButton
│   │       │   │   ├── RejectButton
│   │       │   │   └── RejectionReasonInput (거절 시 표시)
│   │       │   └── SuggestionHistory (접힘/펼침)
│   │       │
│   │       └── AlertTimeline
│   │           └── AlertItem (아이콘 + 메시지 + 시간)
│   │
│   ├── /chat → ChatPage
│   │   ├── ChatMessageList
│   │   │   ├── MemberMessage (팀원 메시지)
│   │   │   │   ├── SenderAvatar + Name
│   │   │   │   ├── MessageContent
│   │   │   │   └── Timestamp
│   │   │   └── AIBotMessage (AI PM 메시지) ⭐
│   │   │       ├── AIAvatar + "AI PM" 라벨
│   │   │       ├── MessageContent
│   │   │       ├── DetectionBadge (의사결정/새태스크/리스크 감지)
│   │   │       └── Timestamp
│   │   ├── ChatInput
│   │   │   ├── TextInput
│   │   │   └── SendButton → POST /chat
│   │   └── ChatSidebar (감지된 항목 요약)
│   │       ├── DetectedDecisions (감지된 의사결정 목록)
│   │       ├── DetectedTasks (감지된 새 태스크)
│   │       └── DetectedRisks (감지된 리스크)
│   │
│   └── /report → ReportPage
│       ├── ReportViewer
│       │   ├── SectionList (섹션별 내용)
│       │   │   └── ReportSection
│       │   │       ├── SectionTitle
│       │   │       ├── SectionContent (마크다운 렌더링)
│       │   │       ├── AuthorBadge (작성 팀원)
│       │   │       └── AIComments (AI 코멘트)
│       │   ├── ApproveButton → PPT 생성 트리거
│       │   └── RequestRevisionButton
│       │
│       └── PPTPreview (승인 후 표시)
│           ├── SlideList
│           │   └── SlideCard (제목 + 핵심내용 + 키워드)
│           └── DownloadButton (HTML 프레젠테이션 다운로드)
│
├── WorkSubmitModal (결과물 제출 모달)
│   ├── TaskSelector (어떤 태스크에 대한 결과물인지)
│   ├── ContentTextarea (결과물 텍스트 입력)
│   ├── SubmitButton → POST /review
│   └── ReviewResult (AI 리뷰 결과 표시)
│       ├── ScoreRadar (완성도/논리성/분량/주제적합성 각 25점)
│       ├── FeedbackList (AI 피드백 항목)
│       └── AutoProgressBadge (자동 산정된 진행률)
│
└── LoadingOverlay (AI 응답 대기 시 스켈레톤)
```

### 컴포넌트 간 데이터 흐름

```
TeamCreatePage ──(팀 생성)──→ Context.dispatch({type:'SET_TEAM'})
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
             DashboardPage      ChatPage       ReportPage
                    │               │               │
          TaskCard.submit    ChatInput.send    ApproveButton
                    │               │               │
            POST /review     POST /chat       POST /merge
                    │               │               │
                    ▼               ▼               ▼
          Context.dispatch   Context.dispatch  Context.dispatch
          ({type:'UPDATE_   ({type:'ADD_      ({type:'SET_
           REVIEW'})         MESSAGE'})        REPORT'})
```

---

## 3. 각 API별 Bedrock 프롬프트 구조 예시

### 공통 프롬프트 헤더 (모든 API에 포함)

```
당신은 대학교 조별과제 PM AI입니다.
항상 JSON 형식으로만 응답하세요. 설명 텍스트 없이 순수 JSON만 출력하세요.

[현재 팀 상태]
- 프로젝트명: {{projectName}}
- 주제: {{topic}}
- 마감일: {{deadline}} (D-{{daysLeft}})
- 현재 날짜: {{today}}

[팀원 현황]
{{#each members}}
- {{name}} ({{department}}, 강점: {{strength}})
  담당 태스크: {{assignedTasks}} | 평균 진행률: {{avgProgress}}%
{{/each}}

[태스크 현황]
{{#each tasks}}
- {{title}} (담당: {{assignee}}, 진행률: {{progress}}%, 마감: {{deadline}}, 상태: {{status}})
{{/each}}

[이전 AI 제안 이력] (같은 제안 반복 금지)
{{#each previousSuggestions}}
- {{createdAt}}: {{content}} → {{status}} {{#if rejectionReason}}(거절사유: {{rejectionReason}}){{/if}}
{{/each}}
```

### POST /api/team — 역할 분배 + 일정 생성

```
{{공통 헤더}}

신규 팀이 생성되었습니다. 다음을 수행해주세요:

1. 프로젝트 주제를 분석하여 5-8개 태스크로 분해
2. 각 태스크에 가장 적합한 팀원 배정 (강점 매칭 + 희망역할 우선)
3. 마감일({{deadline}})에서 역산하여 주간 마일스톤 생성
4. 각 태스크의 시작일/중간마감일 설정

응답 JSON:
{
  "tasks": [
    {
      "id": "task-1",
      "title": "태스크명",
      "assigneeId": "member-1",
      "startDate": "YYYY-MM-DD",
      "deadline": "YYYY-MM-DD",
      "difficulty": "상/중/하",
      "reasoning": "이 팀원에게 배정한 이유"
    }
  ],
  "milestones": [
    {
      "week": 1,
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "goals": ["이번 주 목표 1", "목표 2"],
      "keyDeadlines": ["task-1 중간점검"]
    }
  ],
  "aiMessage": "팀에게 전달할 역할 분배 설명 메시지"
}
```

### POST /api/chat — 대화 분석 + 자동 개입

```
{{공통 헤더}}

[최근 채팅 내역 (최근 20개)]
{{#each recentMessages}}
[{{timestamp}}] {{sender}}: {{content}}
{{/each}}

[새 메시지]
{{sender}}: {{newMessage}}

이 대화를 분석하여 다음을 감지해주세요:
1. 의사결정 감지: 팀원들이 무언가를 결정했는가? (예: "그러면 A로 하자", "B 방식으로 가자")
2. 새 태스크 감지: 새로운 할 일이 언급되었는가? (예: "그러면 누가 이것도 해야겠다")
3. 일정 리스크 감지: 지연/어려움/불만 신호가 있는가? (예: "이거 좀 어렵다", "시간이 부족할 것 같다")
4. 개입 필요성: AI PM으로서 조언/정리/경고가 필요한 상황인가?

응답 JSON:
{
  "detection": {
    "type": "decision|newTask|risk|none",
    "confidence": 0.0-1.0,
    "detail": "감지된 내용 설명"
  },
  "shouldIntervene": true/false,
  "aiResponse": "AI PM으로서 채팅에 보낼 메시지 (개입 시에만)",
  "suggestedActions": [
    {
      "type": "addTask|updateTask|createAlert",
      "detail": "구체적 액션 내용"
    }
  ]
}
```

### POST /api/review — 품질 리뷰 + 진행률 산정 + 지연 감지 (연쇄)

```
{{공통 헤더}}

[제출된 결과물]
- 태스크: {{taskTitle}} (담당: {{assignee}})
- 태스크 설명: {{taskDescription}}
- 제출 내용:
{{submittedContent}}

다음을 순서대로 수행해주세요:

[STEP 1: 품질 리뷰]
결과물을 4가지 기준으로 평가 (각 25점, 총 100점):
- 완성도: 요구사항 대비 얼마나 완성되었는가
- 논리성: 내용의 논리적 흐름과 일관성
- 분량: 기대 분량 대비 적절성
- 주제적합성: 프로젝트 주제와의 관련성

[STEP 2: 진행률 자동 산정]
리뷰 점수를 기반으로 이 태스크의 진행률(%)을 산정
- 80점 이상: 진행률 90-100%
- 60-79점: 진행률 60-89%
- 40-59점: 진행률 30-59%
- 40점 미만: 진행률 0-29%

[STEP 3: 지연 감지]
산정된 진행률 vs 기대 진행률(경과일/전체일×100) 비교
- 갭 ≥ 20%: 지연 (critical) → 재배분 제안 생성
- 갭 ≥ 10%: 주의 (warning)
- 갭 < 10%: 정상 (normal)

[STEP 4: 재배분 제안] (지연 시에만)
여유 있는 팀원에게 태스크 일부 이관 제안

응답 JSON:
{
  "review": {
    "scores": {
      "completeness": 0-25,
      "logic": 0-25,
      "volume": 0-25,
      "relevance": 0-25,
      "total": 0-100
    },
    "feedback": ["피드백 1", "피드백 2"],
    "suggestedProgress": 0-100
  },
  "delayDetection": {
    "expectedProgress": 55,
    "actualProgress": 30,
    "gap": -25,
    "severity": "critical|warning|normal"
  },
  "reassignSuggestion": null | {
    "type": "reassign|reduce_scope|extend",
    "description": "구체적 제안",
    "fromMember": "지연 팀원",
    "toMember": "여유 팀원",
    "reason": "제안 이유",
    "impact": "전체 일정 영향"
  }
}
```

### POST /api/decision — 수락/거절 시 대안 생성

```
{{공통 헤더}}

[이번 제안에 대한 팀원 결정]
- 제안 내용: {{suggestionContent}}
- 결정: {{accepted ? "수락" : "거절"}}
{{#if rejectionReason}}
- 거절 사유: {{rejectionReason}}
{{/if}}

[이 태스크에 대한 이전 제안 이력] (총 {{previousCount}}회, 최대 3회)
{{#each previousSuggestions}}
{{@index+1}}. {{content}} → {{status}} {{#if rejectionReason}}(사유: {{rejectionReason}}){{/if}}
{{/each}}

{{#if accepted}}
수락되었습니다. 변경사항을 적용할 구체적 액션을 생성해주세요.
{{else}}
거절되었습니다. 거절 사유 "{{rejectionReason}}"를 반영하여 완전히 다른 대안을 제시해주세요.
이전에 제안했던 방식은 절대 반복하지 마세요.
가능한 전략: 다른 팀원 배정, 마감 연장, 범위 축소, 페어워크, 태스크 분할 등
{{/if}}

응답 JSON:
{
  "action": "apply|newSuggestion",
  "appliedChanges": [...] | null,
  "newSuggestion": null | {
    "type": "reassign|extend|reduce_scope|pair_work|split_task",
    "description": "새 대안 설명",
    "reasoning": "이전 거절 사유를 어떻게 반영했는지",
    "impact": "전체 일정 영향",
    "alternativeOptions": [
      {"option": "대안 2"},
      {"option": "대안 3"}
    ]
  }
}
```

### POST /api/merge — 보고서 취합 + PPT 생성

```
{{공통 헤더}}

[제출된 결과물 전체]
{{#each completedTasks}}
## {{title}} (작성자: {{assignee}})
{{submittedContent}}

AI 리뷰 점수: {{reviewScore}}/100
{{/each}}

다음을 수행해주세요:

[STEP 1: 보고서 병합]
- 각 팀원의 결과물을 하나의 통합 보고서로 구성
- 서론/본론/결론 구조로 재배치
- 중복 내용 제거, 문체 통일
- 각 섹션에 AI 코멘트 추가 (보완 필요 사항)

[STEP 2: PPT 슬라이드 구성안]
- 10-15장 분량의 발표 슬라이드 구성
- 각 슬라이드: 제목 + 핵심 내용 (3-5줄) + 키워드 3개
- 표지, 목차, 결론, Q&A 슬라이드 포함

응답 JSON:
{
  "report": {
    "title": "보고서 제목",
    "sections": [
      {
        "title": "섹션 제목",
        "content": "섹션 내용 (마크다운)",
        "author": "원 작성자",
        "aiComments": ["보완 사항 1"]
      }
    ]
  },
  "pptSlides": [
    {
      "slideNumber": 1,
      "title": "슬라이드 제목",
      "content": "핵심 내용",
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "speakerNotes": "발표자 노트"
    }
  ]
}
```

### GET /api/check — 주기적 점검 + 알림 생성

```
{{공통 헤더}}

현재 날짜 기준으로 팀 상태를 점검하고 필요한 알림을 생성해주세요.

점검 항목:
1. 마감 임박 알림: D-3, D-1 태스크가 있는가?
2. 장기 미업데이트: 3일 이상 진행률 변화 없는 태스크?
3. 전원 제출 완료 여부: 모든 태스크가 done인가? → 보고서 취합 트리거
4. 독촉 필요: 진행률이 낮은 팀원에게 친근한 독촉 메시지

응답 JSON:
{
  "alerts": [
    {
      "type": "deadline|delay|nudge|completion",
      "target": "팀원명 또는 전체",
      "message": "자연스러운 한국어 알림 메시지",
      "priority": "high|medium|low"
    }
  ],
  "triggerMerge": true/false,
  "aiChatMessage": "채팅방에 보낼 AI PM 메시지 (필요시)"
}
```

---

## 4. 채팅방 구현 최적 방법 (해커톤 3-4시간 기준)

### 결론: React 상태 관리 + POST 호출 방식 (웹소켓 X)

해커톤에서 웹소켓은 과도합니다. 아래 방식이 가장 빠릅니다:

```
┌─────────────────────────────────────────────┐
│              채팅방 구현 방식                  │
│                                             │
│  [방식 비교]                                 │
│  ❌ WebSocket: 서버 구현 복잡, Lambda 비적합  │
│  ❌ 폴링: 불필요한 API 호출 낭비              │
│  ✅ React State + POST: 가장 단순, 충분      │
│                                             │
│  [이유]                                      │
│  - 실시간 멀티유저가 아님 (1인 데모)          │
│  - 메시지 전송 시에만 AI 분석 필요            │
│  - 상태는 Context에서 관리, 즉시 UI 반영      │
└─────────────────────────────────────────────┘
```

### 구현 흐름

```typescript
// 1. 메시지 전송 시
const sendMessage = async (content: string, senderId: string) => {
  // 즉시 UI에 팀원 메시지 추가
  dispatch({ type: 'ADD_MESSAGE', payload: { sender: senderId, content } });

  // AI 분석 요청
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ teamState, newMessage: content, sender: senderId })
  });
  const result = await response.json();

  // AI 감지 결과 반영
  if (result.detection.type !== 'none') {
    dispatch({ type: 'ADD_DETECTION', payload: result.detection });
  }

  // AI 개입 메시지 추가
  if (result.shouldIntervene) {
    dispatch({ type: 'ADD_MESSAGE', payload: { sender: 'ai', content: result.aiResponse } });
  }

  // 제안된 액션 자동 실행
  result.suggestedActions.forEach(action => {
    dispatch({ type: 'APPLY_AI_ACTION', payload: action });
  });
};
```

### AI 봇 자동 개입 패턴

```
팀원: "프론트엔드 부분 좀 어려운데..."
  → AI 감지: risk (confidence: 0.8)
  → AI 개입: "프론트엔드에서 어려움을 겪고 계시군요.
              현재 김민수님의 진행률은 30%이고 마감까지 7일 남았습니다.
              도움이 필요하시면 태스크 분할이나 페어워크를 제안드릴 수 있어요."

팀원A: "그러면 발표는 내가 할게"
팀원B: "좋아 그렇게 하자"
  → AI 감지: decision (confidence: 0.9)
  → AI 개입: "의사결정이 감지되었습니다: 발표 담당 → 팀원A
              태스크에 반영할까요? [확인] 버튼을 눌러주세요."

팀원: "추가로 설문조사도 해야 할 것 같아"
  → AI 감지: newTask (confidence: 0.7)
  → AI 개입: "새로운 태스크가 감지되었습니다: '설문조사 실시'
              칸반보드에 추가하고 적합한 팀원을 배정할까요?"
```

---

## 5. 데이터 흐름도 (결과물 제출 → 리뷰 → 진행률 → 지연 감지 → 제안 연쇄)

```
┌──────────────────────────────────────────────────────────────────┐
│                    결과물 제출 연쇄 흐름 (핵심)                    │
└──────────────────────────────────────────────────────────────────┘

  팀원이 결과물 텍스트 제출
           │
           ▼
  ┌─────────────────────┐
  │  POST /api/review    │
  │  (단일 API, 내부 연쇄)│
  └──────────┬──────────┘
             │
  ═══════════╪═══════════════════════════════════════
  ║  STEP 1  ▼  품질 리뷰                          ║
  ║  ┌──────────────────────────────────┐           ║
  ║  │  Bedrock Claude 호출 #1          │           ║
  ║  │                                  │           ║
  ║  │  입력: 결과물 텍스트 + 태스크 설명│           ║
  ║  │                                  │           ║
  ║  │  출력:                           │           ║
  ║  │  ┌────────────────────────┐      │           ║
  ║  │  │ 완성도:  22/25         │      │           ║
  ║  │  │ 논리성:  18/25         │      │           ║
  ║  │  │ 분량:    20/25         │      │           ║
  ║  │  │ 주제적합: 23/25        │      │           ║
  ║  │  │ 총점:    83/100        │      │           ║
  ║  │  │ 피드백: [...]          │      │           ║
  ║  │  └────────────────────────┘      │           ║
  ║  └──────────────┬───────────────────┘           ║
  ║                 │                               ║
  ║  STEP 2  ▼  진행률 자동 산정                     ║
  ║  ┌──────────────────────────────────┐           ║
  ║  │  총점 83점 → 진행률 85% 산정     │           ║
  ║  │  (AI가 점수 + 피드백 종합 판단)   │           ║
  ║  └──────────────┬───────────────────┘           ║
  ║                 │                               ║
  ║  STEP 3  ▼  지연 감지                           ║
  ║  ┌──────────────────────────────────┐           ║
  ║  │  기대 진행률: 경과일/전체일 × 100 │           ║
  ║  │  예: 14일/24일 × 100 = 58%      │           ║
  ║  │                                  │           ║
  ║  │  실제 진행률: 85%                │           ║
  ║  │  갭: +27% → ✅ 정상 (앞서감)     │           ║
  ║  │                                  │           ║
  ║  │  만약 실제 30%, 갭 -28%라면:     │           ║
  ║  │  → ⚠️ critical → STEP 4로       │           ║
  ║  └──────────────┬───────────────────┘           ║
  ║                 │                               ║
  ║          ┌──────┴──────┐                        ║
  ║          │             │                        ║
  ║       정상          지연 감지                    ║
  ║          │             │                        ║
  ║          ▼             ▼                        ║
  ║     결과만 반환   STEP 4: 재배분 제안 생성       ║
  ║                        │                        ║
  ║  ┌─────────────────────┴──────────────────┐     ║
  ║  │  여유 팀원 탐색 → 이관 제안 생성        │     ║
  ║  │  → AISuggestion(pending) 생성          │     ║
  ║  └────────────────────────────────────────┘     ║
  ═══════════════════════════════════════════════════

             │
             ▼
  ┌─────────────────────────────────┐
  │  프론트엔드 응답 처리            │
  │                                 │
  │  1. 리뷰 결과 → 모달에 표시     │
  │  2. 진행률 → TaskCard 업데이트  │
  │  3. 제안 → AI 제안 패널에 추가  │
  │  4. 알림 → 타임라인에 추가      │
  └─────────────────────────────────┘
```

---

## 6. AI 자율 판단 흐름도

```
┌─────────────────────────────────────────────────────────────────────┐
│              AI 자율 판단 전체 흐름 (7가지 역할 통합)                 │
└─────────────────────────────────────────────────────────────────────┘

━━━ PHASE 1: 초기 설정 (역할 분배사 + 일정 기획자) ━━━

  팀원 정보 + 프로젝트 주제 + 마감일
                │
                ▼
  ┌─────────────────────────────────┐
  │  Bedrock Claude                  │
  │                                  │
  │  [역할 분배사]                    │
  │  ① 주제 분석 → 필요 태스크 도출  │
  │  ② 팀원 강점 ↔ 태스크 매칭       │
  │  ③ 난이도 균형 배분              │
  │                                  │
  │  [일정 기획자]                    │
  │  ④ 마감일 역산                   │
  │  ⑤ 주간 마일스톤 생성            │
  │  ⑥ 의존성 고려한 순서 배치       │
  └──────────────┬──────────────────┘
                 ▼
  칸반보드 초기화 + 마일스톤 타임라인 표시


━━━ PHASE 2: 실시간 모니터링 (채팅 모니터) ━━━

  팀원 채팅 메시지
         │
         ▼
  ┌──────────────────────────────────────┐
  │  Bedrock Claude [채팅 모니터]         │
  │                                      │
  │  분석 대상: 최근 20개 메시지 + 새 메시지│
  │                                      │
  │  감지 유형:                           │
  │  ┌────────────┬──────────────────┐   │
  │  │ 의사결정   │ "A로 하자" 패턴   │   │
  │  │ 새 태스크  │ "이것도 해야" 패턴 │   │
  │  │ 리스크     │ "어렵다/부족" 패턴 │   │
  │  │ 없음       │ 일반 대화         │   │
  │  └────────────┴──────────────────┘   │
  │                                      │
  │  개입 판단:                           │
  │  confidence ≥ 0.7 → 자동 개입        │
  │  confidence < 0.7 → 관찰만           │
  └──────────┬───────────────────────────┘
             │
     ┌───────┴───────┐
     │               │
  개입 필요        관찰만
     │               │
     ▼            (대기)
  AI 채팅 메시지 전송
  + 태스크/알림 자동 생성


━━━ PHASE 3: 품질 관리 (품질 리뷰어 + 지연 감지) ━━━

  결과물 제출
       │
       ▼
  ┌──────────────────────────────────────┐
  │  Bedrock Claude [품질 리뷰어]         │
  │                                      │
  │  4가지 평가 (각 25점):                │
  │  ┌──────────┬──────────┐             │
  │  │ 완성도   │ 논리성   │             │
  │  │ 분량     │ 주제적합 │             │
  │  └──────────┴──────────┘             │
  │  → 총점 산출 → 진행률 자동 산정       │
  └──────────────┬───────────────────────┘
                 │
                 ▼
  ┌──────────────────────────────────────┐
  │  [지연 감지 로직]                     │
  │                                      │
  │  expected = (경과일 / 전체일) × 100   │
  │  actual = AI가 산정한 진행률           │
  │  gap = expected - actual              │
  │                                      │
  │  gap ≥ 20% → ⚠️ CRITICAL            │
  │  gap ≥ 10% → ⚡ WARNING              │
  │  gap < 10% → ✅ NORMAL               │
  └──────────┬───────────────────────────┘
             │
     ┌───────┴───────┐
     │               │
  NORMAL         CRITICAL/WARNING
     │               │
  결과 저장       재배분 제안 자동 생성
                     │
                     ▼
              AI 제안 패널에 표시


━━━ PHASE 4: 자율 협상 루프 (협상가) ⭐ 핵심 ━━━

  AI 재배분 제안 표시
         │
         ▼
  ┌──────┴──────┐
  │             │
수락 ✅      거절 ❌ + 사유 입력
  │             │
  ▼             ▼
태스크 변경   ┌──────────────────────────────────┐
적용         │  Bedrock Claude [협상가]           │
  │          │                                   │
  │          │  입력:                             │
  │          │  - 거절된 제안                      │
  │          │  - 거절 사유                        │
  │          │  - 이전 제안 이력 전체 (반복 방지)   │
  │          │  - 현재 팀 상태                     │
  │          │                                   │
  │          │  판단 프로세스:                     │
  │          │  ① 거절 사유 키워드 분석            │
  │          │     "React 모름" → 기술 제약        │
  │          │     "시간 없음" → 일정 제약          │
  │          │     "하기 싫음" → 동기 문제          │
  │          │                                   │
  │          │  ② 이전 제안과 중복 체크            │
  │          │     → 같은 유형 제안 제외            │
  │          │                                   │
  │          │  ③ 대안 전략 선택:                  │
  │          │     - 다른 팀원 배정                │
  │          │     - 마감 연장                     │
  │          │     - 범위 축소                     │
  │          │     - 페어워크                      │
  │          │     - 태스크 분할                   │
  │          │                                   │
  │          │  출력: 새 제안 + 대안 2-3개         │
  │          └──────────────┬────────────────────┘
  │                         │
  │                         ▼
  │                  새 AI 제안 표시
  │                         │
  │                 ┌───────┴───────┐
  │                 │               │
  │              수락 ✅         거절 ❌ (2회차)
  │                 │               │
  │                 ▼               ▼
  │           태스크 변경      3회차 최종 제안
  │                                 │
  │                         ┌───────┴───────┐
  │                         │               │
  │                      수락 ✅         거절 ❌ (3회차)
  │                         │               │
  │                         ▼               ▼
  │                   태스크 변경     "수동 조정 모드"
  │                                  (AI 개입 중단)
  └─────────────────────────┤
                            ▼
                     최종 상태 반영


━━━ PHASE 5: 보고서 취합 + PPT (보고서 취합자) ━━━

  전원 태스크 완료 감지 (GET /check에서 triggerMerge=true)
                │
                ▼
  ┌──────────────────────────────────────┐
  │  Bedrock Claude [보고서 취합자]       │
  │                                      │
  │  STEP 1: 보고서 병합                  │
  │  - 각 팀원 결과물 수집               │
  │  - 서론/본론/결론 구조화             │
  │  - 중복 제거 + 문체 통일             │
  │  - 섹션별 AI 코멘트 추가             │
  │                                      │
  │  STEP 2: PPT 슬라이드 구성           │
  │  - 10-15장 구성안                    │
  │  - 슬라이드별 제목/내용/키워드        │
  │  - 발표자 노트 포함                  │
  └──────────────┬───────────────────────┘
                 │
                 ▼
  ┌──────────────────────────────────────┐
  │  보고서 뷰어에 표시                   │
  │                                      │
  │  ┌──────────┐    ┌──────────┐        │
  │  │ 승인 ✅  │    │ 수정요청 │        │
  │  └────┬─────┘    └────┬─────┘        │
  │       │               │              │
  │       ▼               ▼              │
  │  PPT 미리보기    수정사항 반영 후     │
  │  + 다운로드      재생성              │
  └──────────────────────────────────────┘
```

---

## 7. MVP 기능 분류 (3-4시간 기준)

### ✅ MVP 핵심 기능 (반드시 포함)

| # | 기능 | 예상 시간 | 이유 |
|---|------|----------|------|
| 1 | 팀 생성 폼 (프로젝트명 + 마감일 + 팀원 추가) | 30분 | 앱 진입점 |
| 2 | AI 역할 분배 + 일정 생성 (POST /team) | 40분 | 핵심 가치 — AI 자동 분배 |
| 3 | 칸반 보드 대시보드 (태스크 카드 + 진행률) | 40분 | 시각적 결과물, 데모 임팩트 |
| 4 | 결과물 제출 + AI 품질 리뷰 + 진행률 자동 산정 (POST /review) | 40분 | 연쇄 흐름의 시작점 |
| 5 | 지연 감지 + AI 재배분 제안 (review 연쇄) | 20분 | review API 내부에서 연쇄 처리 |
| 6 | AI 제안 수락/거절 + 대안 생성 루프 (POST /decision) | 30분 | 자율 판단 루프 완성 |
| 7 | 채팅방 + AI 봇 자동 개입 (POST /chat) | 40분 | 차별화 기능, 데모 핵심 |
| 8 | localStorage 상태 유지 | 15분 | 새로고침 대응 |
| | **합계** | **~4시간** | |

### ⏳ 시간 남으면 추가할 기능 (우선순위순)

| # | 기능 | 예상 시간 | 우선순위 |
|---|------|----------|---------|
| 1 | 보고서 자동 취합 (POST /merge) | 30분 | 🔴 높음 |
| 2 | PPT 슬라이드 구성안 생성 + HTML 프레젠테이션 | 30분 | 🔴 높음 |
| 3 | 마감 알림 자동 생성 (GET /check) | 20분 | 🟡 중간 |
| 4 | 알림 타임라인 UI | 15분 | 🟡 중간 |
| 5 | 채팅 사이드바 (감지 항목 요약) | 15분 | 🟡 중간 |
| 6 | 마일스톤 타임라인 시각화 | 20분 | 🟢 낮음 |
| 7 | D-day 카운트다운 헤더 | 5분 | 🟢 낮음 |
| 8 | 다크모드 | 10분 | 🟢 낮음 |

### MVP 완성 기준
> "팀 생성 → AI 역할 분배 → 채팅방에서 AI 자동 개입 → 결과물 제출 시 AI 리뷰 + 진행률 자동 산정 → 지연 시 재배분 제안 → 거절 시 대안 생성"
> 이 연쇄 흐름이 끊김 없이 동작하면 MVP 완성.

---

## 8. PPT 생성 구현 방법 (가장 빠른 방법)

### 결론: reveal.js 기반 HTML 프레젠테이션

해커톤에서 PPTX 파일 생성은 복잡합니다. reveal.js HTML 프레젠테이션이 가장 빠릅니다.

### 방법 비교

| 방법 | 구현 시간 | 결과물 품질 | 해커톤 적합성 |
|------|----------|-----------|-------------|
| ✅ reveal.js HTML | 20분 | ⭐⭐⭐⭐ | 최적 |
| pptxgenjs 라이브러리 | 40분 | ⭐⭐⭐ | 가능 |
| Google Slides API | 60분+ | ⭐⭐⭐⭐⭐ | 과도 |
| 마크다운 → PDF | 15분 | ⭐⭐ | 단순 |

### reveal.js 구현 방식

```typescript
// AI가 생성한 슬라이드 데이터를 reveal.js HTML로 변환
const generatePPTHtml = (slides: PPTSlide[]): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4/dist/theme/white.css">
</head>
<body>
  <div class="reveal">
    <div class="slides">
      ${slides.map(slide => `
        <section>
          <h2>${slide.title}</h2>
          <div>${slide.content}</div>
          <p><small>${slide.keywords.join(' · ')}</small></p>
          <aside class="notes">${slide.speakerNotes}</aside>
        </section>
      `).join('')}
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4/dist/reveal.js"></script>
  <script>Reveal.initialize();</script>
</body>
</html>`;
};

// 다운로드 기능
const downloadPPT = (html: string) => {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}_발표자료.html`;
  a.click();
};
```

### 프론트엔드 PPT 미리보기

```typescript
// iframe으로 reveal.js 프레젠테이션 미리보기
const PPTPreview = ({ slides }: { slides: PPTSlide[] }) => {
  const html = generatePPTHtml(slides);
  const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));

  return (
    <div>
      <iframe src={blobUrl} width="100%" height="400px" />
      <button onClick={() => downloadPPT(html)}>📥 발표자료 다운로드</button>
      <button onClick={() => window.open(blobUrl)}>🖥️ 전체화면 프레젠테이션</button>
    </div>
  );
};
```

---

## 9. 데이터 구조 (TypeScript 인터페이스)

```typescript
// === 핵심 엔티티 ===

interface Team {
  id: string;
  projectName: string;
  topic: string;
  deadline: string;
  members: Member[];
  tasks: Task[];
  milestones: Milestone[];
  chatMessages: ChatMessage[];
  aiSuggestions: AISuggestion[];
  alerts: Alert[];
  report: Report | null;
  createdAt: string;
}

interface Member {
  id: string;
  name: string;
  department: string;
  strength: string;
  assignedTasks: string[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  startDate: string;
  deadline: string;
  progress: number;
  status: 'todo' | 'inProgress' | 'done';
  difficulty: '상' | '중' | '하';
  submittedContent: string | null;
  review: Review | null;
  lastUpdated: string;
}

interface Milestone {
  week: number;
  startDate: string;
  endDate: string;
  goals: string[];
  keyDeadlines: string[];
}

// === 채팅 ===

interface ChatMessage {
  id: string;
  sender: string; // memberId 또는 'ai'
  content: string;
  timestamp: string;
  aiDetection: {
    type: 'decision' | 'newTask' | 'risk' | 'none';
    confidence: number;
    detail: string;
  } | null;
}

// === AI 제안 ===

interface AISuggestion {
  id: string;
  type: 'reassign' | 'extend' | 'reduce_scope' | 'pair_work' | 'split_task';
  content: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  previousSuggestions: string[];
  relatedTaskId: string;
  round: number; // 1, 2, 3 (최대 3회)
  createdAt: string;
}

// === 리뷰 ===

interface Review {
  taskId: string;
  scores: {
    completeness: number;  // 0-25
    logic: number;         // 0-25
    volume: number;        // 0-25
    relevance: number;     // 0-25
    total: number;         // 0-100
  };
  feedback: string[];
  suggestedProgress: number;
  delayDetection: {
    expectedProgress: number;
    actualProgress: number;
    gap: number;
    severity: 'critical' | 'warning' | 'normal';
  };
}

// === 알림 ===

interface Alert {
  id: string;
  message: string;
  type: 'deadline' | 'delay' | 'nudge' | 'completion';
  target: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

// === 보고서 + PPT ===

interface Report {
  title: string;
  sections: ReportSection[];
  status: 'draft' | 'approved';
  pptSlides: PPTSlide[] | null;
}

interface ReportSection {
  title: string;
  content: string;
  author: string;
  aiComments: string[];
}

interface PPTSlide {
  slideNumber: number;
  title: string;
  content: string;
  keywords: string[];
  speakerNotes: string;
}
```

---

## 10. 기술 스택 및 구현 가능성 종합 평가

### 기술 스택

| 레이어 | 기술 | 선택 이유 |
|--------|------|----------|
| 프론트엔드 | React 18 + TypeScript | 컴포넌트 기반, 타입 안전성 |
| 스타일링 | Tailwind CSS | 빠른 UI 구현 |
| 상태관리 | React Context + useReducer | 복잡한 상태에 적합, 외부 의존성 없음 |
| 영속성 | localStorage | DynamoDB 없이 MVP 가능 |
| 채팅 | React State + POST 호출 | 웹소켓 없이 가장 단순한 구현 |
| PPT | reveal.js (CDN) | 설치 없이 HTML 프레젠테이션 |
| 백엔드 | AWS Lambda (Node.js 20) | 서버리스, API별 독립 함수 |
| AI | Amazon Bedrock Claude 3.5 Sonnet | 한국어 우수, JSON 출력 안정 |
| API | API Gateway (REST) | Lambda 트리거 |
| 배포 | AWS Amplify + Lambda | 프론트/백엔드 분리 배포 |

### 구현 가능성 평가

| 기능 | 난이도 | 가능성 | 핵심 리스크 |
|------|--------|--------|-----------|
| AI 역할 분배 + 일정 | ⭐⭐ | ✅ 높음 | 없음 |
| 채팅 + AI 자동 개입 | ⭐⭐⭐ | ✅ 가능 | AI 감지 정확도 (confidence 임계값 조정 필요) |
| 품질 리뷰 + 진행률 산정 | ⭐⭐ | ✅ 높음 | 점수 기준의 일관성 (프롬프트로 해결) |
| 지연 감지 + 재배분 | ⭐⭐ | ✅ 높음 | 단순 수학 + AI 분석 조합 |
| 자율 협상 루프 (3회) | ⭐⭐⭐ | ✅ 가능 | 이전 이력 프롬프트 포함으로 반복 방지 |
| 보고서 취합 | ⭐⭐ | ✅ 높음 | 긴 텍스트 처리 (Claude 토큰 한도 내) |
| PPT 생성 (reveal.js) | ⭐ | ✅ 높음 | HTML 생성만으로 충분 |
| localStorage 영속성 | ⭐ | ✅ 높음 | 5MB 제한 내 충분 |

### 주요 리스크 및 대응

| 리스크 | 대응 방안 |
|--------|----------|
| Bedrock 응답 지연 (2-5초) | 로딩 스켈레톤 + "AI가 분석 중..." 메시지 |
| AI JSON 파싱 실패 | try-catch + 재시도 1회 + 에러 폴백 UI |
| 채팅 AI 감지 오탐 | confidence 임계값 0.7 + "이 감지가 맞나요?" 확인 버튼 |
| 자율 루프 무한 반복 | 최대 3회 제한 + 3회 초과 시 수동 모드 전환 |
| review 연쇄 호출 시간 | 단일 Bedrock 호출로 STEP 1-4 통합 처리 |
| localStorage 5MB 제한 | 채팅 메시지 최근 100개만 유지 |
