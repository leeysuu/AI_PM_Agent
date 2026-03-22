---
inclusion: always
---

# AI 조별과제 PM 에이전트 - 개발 가이드

## 1. 프로젝트 개요

대학생 조별과제를 AI가 자율적으로 관리하는 웹 애플리케이션.
팀원은 3가지만 하면 된다:
1. 팀 정보 입력 (이름/학과/강점/주제/마감일) — 처음 1번
2. 채팅방에서 대화 + 결과물 올리기 — 수시로
3. AI 제안에 수락/거절 누르기 — AI가 제안할 때

나머지는 전부 AI가 자율적으로 수행한다.

## 2. 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| 프론트엔드 | React 18 + TypeScript + Tailwind CSS | Vite 빌드 |
| 백엔드 | AWS Lambda (Node.js 20) | API Gateway REST |
| AI | Amazon Bedrock Claude 3.5 Sonnet | JSON 출력 전용 |
| 배포 | AWS Amplify (프론트) + Lambda (API) | |
| 상태관리 | React Context + useReducer | 전역 상태 |
| 영속성 | localStorage | DB 사용하지 않음 (해커톤 MVP) |
| PPT | reveal.js (CDN) | HTML 프레젠테이션 |

## 3. AI 역할 7가지 정의

### 3-1. 역할 분배사
- 팀원 강점 + 프로젝트 주제 분석 → 5-8개 태스크 자동 생성
- 각 태스크에 가장 적합한 팀원 배정 (강점 매칭 + 희망역할 우선)
- 태스크별 난이도(상/중/하) 산정, 팀원 간 균형 배분

### 3-2. 일정 기획자
- 마감일에서 역산하여 주간 마일스톤 자동 생성
- 각 태스크의 시작일/중간마감일 설정
- 태스크 간 의존성 고려한 순서 배치

### 3-3. 품질 리뷰어
- 결과물 제출 시 4가지 기준으로 평가 (각 25점, 총 100점):
  - 완성도: 요구사항 대비 완성 정도
  - 논리성: 내용의 논리적 흐름과 일관성
  - 분량: 기대 분량 대비 적절성
  - 주제적합성: 프로젝트 주제와의 관련성
- 리뷰 점수 기반 진행률 자동 산정:
  - 80점 이상 → 90-100%
  - 60-79점 → 60-89%
  - 40-59점 → 30-59%
  - 40점 미만 → 0-29%

### 3-4. 지연 감지 + 재배분
- 기대 진행률 = (경과일 / 전체일) × 100
- 실제 진행률과 기대 진행률 비교:
  - 갭 ≥ 20% → critical (재배분 제안 자동 생성)
  - 갭 ≥ 10% → warning
  - 갭 < 10% → normal
- 여유 있는 팀원에게 태스크 일부 이관 제안

### 3-5. 협상가
- 거절 시 사유 키워드 분석 (기술 제약 / 일정 제약 / 동기 문제 등)
- 이전 제안 이력 전체 참조 → 같은 제안 반복 금지
- 대안 전략: 다른 팀원 배정 / 마감 연장 / 범위 축소 / 페어워크 / 태스크 분할
- 최대 3회까지 대안 제시, 3회 초과 시 수동 조정 모드 전환

### 3-6. 채팅 모니터
- 실시간 대화 분석 (최근 20개 메시지 컨텍스트)
- 감지 유형:
  - 의사결정: "A로 하자", "그렇게 하자" 패턴
  - 새 태스크: "이것도 해야 한다" 패턴
  - 리스크: "어렵다", "시간 부족" 패턴
- confidence ≥ 0.7일 때만 자동 개입
- 감지 결과를 채팅 사이드바에 요약 표시

### 3-7. 보고서 취합 + PPT 생성
- 전원 태스크 완료 감지 시 자동 트리거
- 각 팀원 결과물을 서론/본론/결론 구조로 병합
- 중복 제거 + 문체 통일 + 섹션별 AI 코멘트
- 승인 후 reveal.js 기반 10-15장 PPT 슬라이드 구성안 생성
- 슬라이드별: 제목 + 핵심 내용 + 키워드 3개 + 발표자 노트

## 4. 데이터 구조

```typescript
interface Team {
  id: string;
  projectName: string;
  topic: string;
  deadline: string;           // ISO 8601
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
  assignedTasks: string[];    // task id 배열
}

interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  startDate: string;
  deadline: string;
  progress: number;           // 0-100
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

interface ChatMessage {
  id: string;
  sender: string;             // memberId 또는 'ai'
  content: string;
  timestamp: string;
  aiDetection: {
    type: 'decision' | 'newTask' | 'risk' | 'none';
    confidence: number;
    detail: string;
  } | null;
}

interface AISuggestion {
  id: string;
  type: 'reassign' | 'extend' | 'reduce_scope' | 'pair_work' | 'split_task';
  content: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  previousSuggestions: string[];
  relatedTaskId: string;
  round: number;              // 1-3 (최대 3회)
  createdAt: string;
}

interface Review {
  taskId: string;
  scores: {
    completeness: number;     // 0-25
    logic: number;            // 0-25
    volume: number;           // 0-25
    relevance: number;        // 0-25
    total: number;            // 0-100
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

interface Alert {
  id: string;
  message: string;
  type: 'deadline' | 'delay' | 'nudge' | 'completion';
  target: string;             // 팀원명 또는 '전체'
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

interface Report {
  title: string;
  sections: ReportSection[];
  status: 'draft' | 'approved';
  pptSlides: PPTSlide[] | null;
}

interface ReportSection {
  title: string;
  content: string;            // 마크다운
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

## 5. API 엔드포인트 명세

### POST /api/team — 팀 생성
- 입력: projectName, topic, deadline, members[]
- 처리: Bedrock 호출 → 역할 분배 + 일정 생성
- 출력: tasks[], milestones[], aiMessage
- AI 역할: 역할 분배사 + 일정 기획자

### POST /api/chat — 채팅 메시지 분석
- 입력: teamState(전체 상태), newMessage, sender
- 처리: Bedrock 호출 → 대화 분석 + 감지 + 개입 판단
- 출력: detection{type, confidence, detail}, shouldIntervene, aiResponse, suggestedActions[]
- AI 역할: 채팅 모니터
- 구현: 웹소켓 없이 React State + POST 호출 방식 (해커톤 최적)

### POST /api/review — 결과물 리뷰 (연쇄 처리)
- 입력: teamState, taskId, submittedContent
- 처리: 단일 Bedrock 호출로 4단계 연쇄 실행
  1. 품질 리뷰 (4가지 기준 각 25점)
  2. 진행률 자동 산정
  3. 지연 감지 (기대 vs 실제 진행률)
  4. 재배분 제안 생성 (지연 시에만)
- 출력: review{scores, feedback, suggestedProgress}, delayDetection, reassignSuggestion
- AI 역할: 품질 리뷰어 + 지연 감지

### POST /api/decision — 수락/거절 처리
- 입력: teamState, suggestionId, accepted, rejectionReason
- 처리:
  - 수락 시: 변경사항 적용 액션 생성
  - 거절 시: Bedrock 호출 → 거절 사유 분석 → 새 대안 생성
- 출력: action("apply"|"newSuggestion"), appliedChanges | newSuggestion
- AI 역할: 협상가
- 제한: 최대 3회, 이전 이력 필수 포함

### POST /api/merge — 보고서 취합 + PPT 생성
- 입력: teamState (전원 태스크 완료 상태)
- 처리: Bedrock 호출 → 결과물 병합 + PPT 구성안 생성
- 출력: report{title, sections[]}, pptSlides[]
- AI 역할: 보고서 취합자
- PPT: reveal.js HTML 프레젠테이션으로 변환

### GET /api/check — 자동 점검
- 입력: teamState
- 처리: Bedrock 호출 → 마감 임박/장기 미업데이트/전원 완료 점검
- 출력: alerts[], triggerMerge(boolean), aiChatMessage
- 점검 항목:
  - D-3, D-1 마감 알림
  - 3일 이상 미업데이트 태스크 독촉
  - 전원 제출 완료 시 보고서 취합 트리거

## 6. AI 프롬프트 설계 가이드

### 공통 규칙
- 모든 프롬프트에 현재 팀 전체 상태를 포함한다:
  - 팀원 목록 (이름, 학과, 강점, 담당 태스크, 평균 진행률)
  - 태스크 목록 (제목, 담당자, 진행률, 마감일, 상태)
  - 이전 AI 제안 이력 (내용, 상태, 거절 사유)
- 하드코딩 규칙 없이 AI가 매번 상황을 분석하여 다른 판단을 내린다
- 출력은 반드시 JSON 형식으로만 응답하도록 지시한다
- 이전 제안 이력을 포함하여 같은 제안 반복을 방지한다
- 한국어로 응답하도록 지시한다

### 프롬프트 템플릿 구조
```
당신은 대학교 조별과제 PM AI입니다.
항상 JSON 형식으로만 응답하세요.

[현재 팀 상태]
- 프로젝트명: {{projectName}}
- 마감일: {{deadline}} (D-{{daysLeft}})
- 현재 날짜: {{today}}

[팀원 현황]
{{각 팀원 정보}}

[태스크 현황]
{{각 태스크 정보}}

[이전 AI 제안 이력]
{{이전 제안 목록 — 같은 제안 반복 금지}}

[요청 사항]
{{API별 구체적 지시}}

[응답 JSON 형식]
{{기대하는 JSON 스키마}}
```

### JSON 파싱 안전장치
- Bedrock 응답을 try-catch로 감싸고 JSON.parse 실패 시 1회 재시도
- 재시도 실패 시 에러 폴백 UI 표시
- 응답에서 ```json 코드블록 래핑 제거 처리 포함

## 7. AI 자율 판단 규칙

### 지연 판단
- 기대 진행률 = (경과일 / 전체일) × 100
- 실제 진행률과의 갭이 20% 이상이면 critical (재배분 제안 자동 생성)
- 갭 10-19%이면 warning (알림만)

### 재배분 시 고려 사항
- 팀원 현재 부하 (담당 태스크 수 + 각 진행률)
- 강점 매칭 (이관 대상 태스크와 수행 팀원의 강점 일치도)
- 마감일 근접도 (마감 임박 태스크 우선)

### 거절 시 대안 생성
- 대안 유형: 다른 팀원 이관 / 마감 연장 / 범위 축소 / 페어워크 / 태스크 분할
- 이전 이력 필수 참조 → 같은 유형의 제안 반복 금지
- 거절 사유 키워드 분석:
  - "모름/못함" → 기술 제약 → 다른 팀원 또는 페어워크
  - "시간 없음" → 일정 제약 → 마감 연장 또는 범위 축소
  - "하기 싫음" → 동기 문제 → 태스크 교환 또는 분할
- 최대 3회까지, 3회 초과 시 수동 조정 모드 전환

### 능동적 행동
- 3일 이상 진행률 업데이트 없는 태스크 → 독촉 알림 자동 생성
- 마감 D-3 → 중간 점검 알림
- 마감 D-1 → 긴급 알림
- 전원 태스크 완료 → 보고서 취합 자동 트리거

### 채팅 개입 기준
- confidence ≥ 0.7 → 자동 개입 (AI 메시지 전송)
- confidence < 0.7 → 관찰만 (감지 결과 사이드바에만 표시)
- 의사결정 감지 시 → 태스크 반영 여부 확인 버튼 제공
- 새 태스크 감지 시 → 칸반보드 추가 제안
- 리스크 감지 시 → 도움 제안 + 필요 시 재배분 연결

## 8. 연쇄 실행 규칙

### 결과물 제출 연쇄 (POST /review 내부)
```
결과물 제출
  → STEP 1: 품질 리뷰 (4가지 기준 채점)
  → STEP 2: 진행률 자동 산정 (점수 기반)
  → STEP 3: 지연 감지 (기대 vs 실제 비교)
  → STEP 4: 재배분 제안 생성 (critical일 때만)
```
- 4단계를 단일 Bedrock 호출로 처리 (프롬프트에 STEP 1-4 명시)
- 프론트엔드는 응답 하나로 리뷰 결과 + 진행률 + 제안을 모두 처리

### 보고서 연쇄 (POST /merge)
```
전원 태스크 완료 감지 (GET /check → triggerMerge=true)
  → 보고서 자동 병합 (서론/본론/결론 구조화)
  → 보고서 뷰어에 표시
  → 승인 버튼 클릭
  → PPT 슬라이드 구성안 생성
  → reveal.js HTML 프레젠테이션 다운로드
```

### 자율 협상 루프 (POST /decision)
```
AI 제안 표시 → 수락/거절
  → 수락: 태스크 변경 적용 → 완료
  → 거절 + 사유: 대안 생성 (1회차)
    → 수락: 적용 → 완료
    → 거절 + 사유: 대안 생성 (2회차)
      → 수락: 적용 → 완료
      → 거절 + 사유: 대안 생성 (3회차, 최종)
        → 수락: 적용 → 완료
        → 거절: 수동 조정 모드 전환 (AI 개입 중단)
```

## 9. 코딩 컨벤션

### TypeScript
- strict mode 활성화 (tsconfig.json: "strict": true)
- 모든 변수/함수에 타입 명시, any 사용 금지
- 인터페이스는 섹션 4의 데이터 구조를 types/ 디렉토리에 정의

### React
- 함수형 컴포넌트만 사용 (React.FC 또는 일반 함수)
- 상태 관리: React Context + useReducer (외부 라이브러리 없음)
- 커스텀 훅으로 로직 분리 (useTeam, useChat, useAISuggestion 등)
- 컴포넌트 파일 구조: components/{기능명}/{ComponentName}.tsx

### 스타일링
- Tailwind CSS 유틸리티 클래스 사용
- 인라인 style 사용 금지
- 반응형 디자인 고려 (모바일 우선)

### API 통신
- 모든 API 응답은 JSON 형식
- fetch API 사용 (axios 등 외부 라이브러리 없음)
- 에러 핸들링 필수: try-catch + 사용자 친화적 에러 메시지
- 로딩 상태 관리: API 호출 중 스켈레톤/스피너 표시

### 파일 구조
```
src/
├── components/          # UI 컴포넌트
│   ├── team/           # 팀 생성 관련
│   ├── dashboard/      # 칸반보드 + 대시보드
│   ├── chat/           # 채팅방
│   ├── review/         # 결과물 제출 + 리뷰
│   ├── suggestion/     # AI 제안 패널
│   ├── report/         # 보고서 + PPT
│   └── common/         # 공통 컴포넌트
├── context/            # React Context + Reducer
├── types/              # TypeScript 인터페이스
├── api/                # API 호출 함수
├── utils/              # 유틸리티 함수
└── App.tsx
```

### 기타
- console.log 디버깅 코드 커밋 금지
- localStorage 키 네이밍: 'ai-pm-agent-{키명}'
- 날짜 처리: 네이티브 Date 또는 dayjs (최소 의존성)
- ID 생성: crypto.randomUUID() 사용
