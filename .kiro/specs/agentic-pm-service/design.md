# Design Document: AI 조별과제 PM 에이전트

## Overview

AI 조별과제 PM 에이전트는 대학생 조별과제를 AI가 자율적으로 관리하는 웹 애플리케이션이다. 팀원은 팀 정보 입력, 채팅 및 결과물 제출, AI 제안 수락/거절 3가지만 수행하며, 나머지 프로젝트 관리 업무(역할 분배, 일정 관리, 품질 리뷰, 지연 감지, 재배분, 보고서 취합, PPT 생성)는 AI PM 에이전트가 자율적으로 수행한다.

모든 AI 판단은 Amazon Bedrock Claude API 호출을 통해 이루어지며, 하드코딩된 분기 로직을 사용하지 않는다. 프로젝트 종료 후에는 완성된 과제를 마켓플레이스에 등록하여 수익화할 수 있다. 활동 포인트(Commitment Point) 시스템을 통해 팀플 참여 보증금을 걸고, AI가 활동량을 분석하여 포인트를 정산하며, 무임승차를 억제한다.

### 핵심 설계 원칙

- **AI 자율 판단**: 모든 판단은 Bedrock Claude API 호출로 수행하며, if-else 하드코딩 분기를 사용하지 않는다
- **단일 호출 연쇄 처리**: 결과물 리뷰 시 품질 평가 → 진행률 산정 → 지연 감지 → 재배분 제안을 단일 Bedrock 호출로 처리한다
- **협상 루프**: AI 제안 거절 시 최대 3회까지 대안을 생성하며, 이전 이력을 참조하여 반복을 방지한다
- **AI 3단계 자율 사고**: 포인트 시스템에서 "예측 → 행동 → 평가"를 AI가 자율적으로 수행한다 (모두 Bedrock 호출)
- **해커톤 MVP**: localStorage 기반 영속성, 웹소켓 없이 React State + POST 호출 방식으로 채팅 구현

### 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| 프론트엔드 | React 18 + TypeScript + Tailwind CSS | Vite 빌드 |
| 백엔드 | AWS Lambda (Node.js 20) | API Gateway REST |
| AI | Amazon Bedrock Claude 3.5 Sonnet | JSON 출력 전용 |
| 배포 | AWS Amplify (프론트) + Lambda (API) | |
| 상태관리 | React Context + useReducer | 전역 상태 |
| 영속성 | localStorage | DB 사용하지 않음 (해커톤 MVP) |
| PPT | reveal.js (CDN) | HTML 프레젠테이션 |


## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "AWS Amplify (프론트엔드)"
        UI[React 18 + TypeScript + Tailwind CSS]
        CTX[React Context + useReducer]
        LS[localStorage 영속성 레이어]
        UI --> CTX
        CTX --> LS
    end

    subgraph "AWS API Gateway REST"
        GW[API Gateway]
    end

    subgraph "AWS Lambda (Node.js 20)"
        L1[POST /api/team<br/>역할분배 + 일정생성]
        L2[POST /api/chat<br/>대화분석 + 자동개입]
        L3[POST /api/review<br/>품질리뷰 + 연쇄처리]
        L4[POST /api/decision<br/>수락/거절 + 대안생성]
        L5[POST /api/merge<br/>보고서취합 + PPT생성]
        L6[GET /api/check<br/>자동점검 + 알림생성]
        L7[POST /api/points/settle<br/>포인트정산 + Best Collaborator]
        L8[POST /api/points/predict<br/>포인트예측 + 경고생성]
        BL[Bedrock 호출 레이어<br/>프롬프트 구성 + JSON 파싱 + 에러 핸들링]
    end

    subgraph "Amazon Bedrock"
        CLAUDE[Claude 3.5 Sonnet<br/>7가지 AI 역할 수행]
    end

    UI -->|HTTPS| GW
    GW --> L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8
    L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 --> BL
    BL --> CLAUDE
```

### 핵심 데이터 흐름

#### 데이터 영속성 흐름 (React Context + localStorage 전용)

모든 데이터는 React Context + useReducer로 전역 관리되며, DB 없이 localStorage만 사용한다. Context 상태가 변경될 때마다 localStorage에 자동 동기화되고, 앱 로드 시 localStorage에서 자동 복원된다.

```mermaid
graph LR
    subgraph "React 앱 (브라우저)"
        UI[UI 컴포넌트] -->|dispatch 액션| CTX[TeamContext<br/>useReducer]
        CTX -->|상태 구독| UI
        CTX -->|변경 시 자동 저장| LS[localStorage<br/>ai-pm-agent-team<br/>ai-pm-agent-market]
        LS -->|앱 로드 시 자동 복원| CTX
    end

    subgraph "AWS Lambda"
        API[API 엔드포인트] -->|Bedrock 호출| BR[Bedrock Claude]
    end

    UI -->|fetch POST/GET| API
    API -->|JSON 응답| UI
    
    Note1[DB 없음 — localStorage만 사용<br/>해커톤 MVP]
```

#### 팀 생성 흐름

```mermaid
sequenceDiagram
    participant U as 팀원
    participant FE as React 프론트엔드
    participant CTX as Context + Reducer
    participant LS as localStorage
    participant API as API Gateway
    participant LM as Lambda
    participant BR as Bedrock Claude

    U->>FE: 팀 정보 입력 + 제출
    FE->>API: POST /api/team
    API->>LM: 역할분배 + 일정생성
    LM->>BR: 프롬프트 (팀원 강점 + 주제)
    BR-->>LM: JSON (tasks + milestones)
    LM-->>FE: 응답
    FE->>CTX: dispatch(SET_TEAM)
    CTX->>LS: 자동 저장 (ai-pm-agent-team)
    CTX->>FE: 칸반보드 렌더링
```

#### 채팅방 흐름 (웹소켓 없이 React State + POST 호출)

채팅방은 웹소켓을 사용하지 않는다. 팀원이 메시지를 전송하면 React State에 즉시 추가하고, POST /api/chat을 호출하여 AI 분석 결과를 받아 다시 State에 반영한다. 모든 채팅 데이터는 Context를 통해 localStorage에 자동 저장된다.

```mermaid
sequenceDiagram
    participant U as 팀원
    participant FE as React 프론트엔드
    participant CTX as Context + Reducer
    participant LS as localStorage
    participant API as API Gateway
    participant LM as Lambda
    participant BR as Bedrock Claude

    Note over U,BR: 웹소켓 없음 — React State + POST 호출 방식
    U->>FE: 메시지 입력 + 전송
    FE->>CTX: dispatch(ADD_MESSAGE) — 즉시 채팅 목록에 표시
    CTX->>LS: 자동 저장
    FE->>API: POST /api/chat {teamState, newMessage, sender}
    API->>LM: 대화 분석
    LM->>BR: 프롬프트 (최근 20개 메시지 + Team_State)
    BR-->>LM: JSON {detection, shouldIntervene, aiResponse}
    LM-->>FE: 응답

    alt shouldIntervene === true (confidence ≥ 0.7)
        FE->>CTX: dispatch(ADD_MESSAGE, sender: 'ai') — AI 봇 메시지 추가
        CTX->>LS: 자동 저장
        CTX->>FE: 채팅 목록에 AI 메시지 표시 (시각적 구분)
    else confidence < 0.7
        FE->>FE: 사이드바에만 감지 결과 요약 표시
    else 감지 없음
        Note over FE: AI 응답 없음 (불필요한 개입 방지)
    end
```

### 연쇄 실행 아키텍처

시스템의 핵심은 3가지 연쇄 실행 패턴이다:

1. **결과물 제출 연쇄** (POST /api/review): 품질 리뷰 → 진행률 산정 → 지연 감지 → 재배분 제안을 단일 Bedrock 호출로 처리
2. **보고서 연쇄** (POST /api/merge): 전원 완료 감지 → 보고서 병합 → PPT 생성
3. **협상 루프** (POST /api/decision): 제안 → 수락/거절 → 대안 생성 (최대 3회)
4. **포인트 정산 연쇄** (POST /api/points/settle): 프로젝트 종료 → 활동 데이터 분석 → 기여도 산출 → 포인트 정산 → Best Collaborator 선정
5. **포인트 예측 연쇄** (POST /api/points/predict): AI 자율 판단 → 포인트 변동 예측 → 경고/동기부여 메시지 생성

#### 결과물 제출 4단계 연쇄 상세 흐름

팀원이 결과물 텍스트를 제출하면, 단일 POST /api/review 호출 내에서 Lambda가 하나의 Bedrock 프롬프트로 4단계를 순차 실행한다. 각 단계의 출력이 다음 단계의 입력으로 사용되며, 팀원의 추가 조작 없이 전부 자동으로 처리된다.

```mermaid
sequenceDiagram
    participant U as 팀원
    participant FE as React 프론트엔드
    participant CTX as Context + localStorage
    participant API as API Gateway
    participant LM as Lambda (POST /api/review)
    participant BR as Bedrock Claude

    U->>FE: 결과물 텍스트 제출
    FE->>FE: 빈 텍스트 검증 (빈 값 차단)
    FE->>CTX: dispatch(UPDATE_TASK, status: inProgress)
    FE->>API: POST /api/review {teamState, taskId, content}
    API->>LM: 요청 전달

    Note over LM,BR: 단일 Bedrock 호출로 4단계 연쇄 실행
    LM->>LM: 프롬프트 구성 (STEP 1~4 명시 + Team_State 전체 포함)
    LM->>BR: 단일 프롬프트 전송

    Note over BR: STEP 1: 품질 리뷰
    Note over BR: 완성도/논리성/분량/주제적합성 각 25점 채점
    Note over BR: STEP 2: 진행률 자동 산정
    Note over BR: STEP 1 점수 기반으로 진행률 결정
    Note over BR: STEP 3: 지연 감지
    Note over BR: 기대진행률 vs STEP 2 실제진행률 갭 계산
    Note over BR: STEP 4: 재배분 제안 (critical일 때만)
    Note over BR: STEP 3에서 갭≥20% 시 팀 상황 분석→재배분 생성

    BR-->>LM: JSON {review, delayDetection, reassignSuggestion}
    LM->>LM: JSON 파싱 (코드블록 래핑 제거 + 실패 시 1회 재시도)
    LM-->>API: 응답
    API-->>FE: 4단계 결과 한번에 수신

    FE->>CTX: dispatch(UPDATE_REVIEW) — 리뷰 점수 + 진행률 반영
    CTX->>FE: 칸반보드 태스크 카드 업데이트 (진행률 바 + 상태 뱃지)

    alt severity === critical (재배분 제안 있음)
        FE->>CTX: dispatch(ADD_SUGGESTION) — 재배분 제안 카드 추가
        CTX->>FE: Suggestion Panel에 제안 카드 표시
    end

    CTX->>CTX: localStorage 자동 저장 (ai-pm-agent-team)
```

#### 보고서 취합 + PPT 연쇄 흐름

```mermaid
sequenceDiagram
    participant FE as React 프론트엔드
    participant CTX as Context + localStorage
    participant API as API Gateway
    participant LM as Lambda
    participant BR as Bedrock Claude

    Note over FE,BR: 전원 태스크 완료 감지 → 보고서 병합 → PPT 생성
    FE->>API: GET /api/check {teamState}
    API->>LM: 자동 점검
    LM->>BR: 팀 상태 분석
    BR-->>LM: {triggerMerge: true}
    LM-->>FE: 보고서 병합 트리거

    FE->>API: POST /api/merge {teamState}
    API->>LM: 보고서 병합 + PPT 생성
    LM->>BR: 단일 프롬프트 (결과물 병합 + 슬라이드 구성)
    BR-->>LM: JSON {report, pptSlides}
    LM-->>FE: 응답

    FE->>CTX: dispatch(SET_REPORT) — 보고서 저장
    CTX->>FE: Report Viewer에 미리보기 표시

    alt 팀원이 승인 클릭
        FE->>CTX: dispatch(APPROVE_REPORT)
        FE->>CTX: dispatch(SET_PPT_SLIDES) — PPT 저장
        CTX->>FE: PPT Viewer에 reveal.js 프레젠테이션 표시
    else 팀원이 수정 요청
        FE->>API: POST /api/merge {teamState + feedback}
        Note over LM,BR: 피드백 반영하여 보고서 재생성
    end

    CTX->>CTX: localStorage 자동 저장
```

#### 자율 협상 루프 흐름

```mermaid
sequenceDiagram
    participant U as 팀원
    participant FE as React 프론트엔드
    participant CTX as Context + localStorage
    participant API as API Gateway
    participant LM as Lambda
    participant BR as Bedrock Claude

    Note over U,BR: 최대 3회 대안 생성 루프
    U->>FE: 제안 거절 + 사유 입력
    FE->>FE: 빈 사유 검증 (빈 값 차단)

    loop round 1~3 (거절 시마다 반복)
        FE->>API: POST /api/decision {teamState, suggestionId, rejected, reason}
        API->>LM: 대안 생성 요청
        LM->>LM: 프롬프트 구성 (이전 제안 이력 전체 포함 — 반복 방지)
        LM->>BR: Bedrock 호출
        BR-->>LM: JSON {newSuggestion}
        LM-->>FE: 새 대안

        FE->>CTX: dispatch(UPDATE_SUGGESTION, rejected)
        FE->>CTX: dispatch(ADD_SUGGESTION, newSuggestion)
        CTX->>FE: Suggestion Panel 업데이트

        alt 팀원이 수락
            FE->>API: POST /api/decision {accepted: true}
            API->>LM: 변경사항 적용
            LM-->>FE: {appliedChanges}
            FE->>CTX: dispatch(APPLY_CHANGES)
            Note over FE: 루프 종료
        else 팀원이 다시 거절 + 사유
            Note over FE: 다음 라운드로 계속
        end
    end

    alt round > 3
        FE->>FE: "팀원 간 직접 논의를 권장합니다" 안내 표시
        Note over FE: AI 자동 제안 중단
    end

    CTX->>CTX: localStorage 자동 저장
```

#### 포인트 정산 흐름 (POST /api/points/settle)

```mermaid
sequenceDiagram
    participant FE as React 프론트엔드
    participant CTX as Context + localStorage
    participant API as API Gateway
    participant LM as Lambda (POST /api/points/settle)
    participant BR as Bedrock Claude

    Note over FE,BR: 프로젝트 종료 시 AI가 팀 전체 활동 분석 → 포인트 정산
    FE->>API: POST /api/points/settle {teamState}
    API->>LM: 정산 요청

    Note over LM,BR: AI 3단계 자율 사고 - 3단계(평가)
    LM->>LM: 프롬프트 구성 (팀 전체 활동 데이터 포함)
    LM->>BR: Bedrock 호출 (결과물 품질, 마감 준수율, 채팅 참여도, AI 제안 수락률 종합 분석)

    Note over BR: 각 팀원별 기여도 산출
    Note over BR: 기여도 상위: 보증금 반환 + 보너스
    Note over BR: 기여도 평균: 보증금 전액 반환
    Note over BR: 기여도 하위: 보증금 일부 차감
    Note over BR: 기여도 1위 → Best Collaborator 선정

    BR-->>LM: JSON {settlements[], bestCollaborator}
    LM-->>API: 응답
    API-->>FE: 팀원별 {pointChange, reason, totalPoints, badge, certificate}

    FE->>CTX: dispatch(UPDATE_POINT_ACCOUNTS) — 포인트 정산 반영
    FE->>CTX: dispatch(ADD_MESSAGE) — 정산 결과 채팅방 공유
    CTX->>FE: Settlement_Screen 표시 (기여도 바 차트 + 포인트 변동 + 인증서)
    CTX->>CTX: localStorage 자동 저장
```

#### AI 실시간 포인트 예측 흐름 (POST /api/points/predict)

```mermaid
sequenceDiagram
    participant FE as React 프론트엔드
    participant CTX as Context + localStorage
    participant API as API Gateway
    participant LM as Lambda (POST /api/points/predict)
    participant BR as Bedrock Claude

    Note over FE,BR: AI 3단계 자율 사고 - 1단계(예측) + 2단계(행동)
    FE->>API: POST /api/points/predict {teamState, currentPoints}
    API->>LM: 예측 요청

    LM->>LM: 프롬프트 구성 (팀 상태 + 포인트 현황 포함)
    LM->>BR: Bedrock 호출 (예측 → 행동을 자율적으로 판단)

    Note over BR: 1단계(예측): 현재 상태로 종료 시 포인트 변동 예측
    Note over BR: 2단계(행동): 차감 예상 팀원에게 경고 + 동기부여 메시지 생성

    BR-->>LM: JSON {predictions[], warnings[], motivationMessages[]}
    LM-->>API: 응답
    API-->>FE: 팀원별 {predictedChange, warning, motivationMessage}

    FE->>CTX: dispatch(SET_POINT_PREDICTIONS) — 예측 결과 저장
    alt 차감 예상 팀원 존재
        FE->>CTX: dispatch(ADD_MESSAGE) — 경고 메시지 채팅방 전송
    end
    CTX->>FE: 대시보드 팀원 카드에 포인트 예측 표시
    CTX->>CTX: localStorage 자동 저장
```

#### 포인트 획득/차감 이벤트 흐름

```mermaid
sequenceDiagram
    participant SYS as System (이벤트 감지)
    participant CTX as Context + localStorage
    participant FE as React 프론트엔드

    Note over SYS,FE: 포인트 획득 이벤트 (자동 감지)
    alt 결과물 제출
        SYS->>CTX: dispatch(ADD_POINT_EVENT, {type: "earn", amount: 5})
    else 품질 80점 이상
        SYS->>CTX: dispatch(ADD_POINT_EVENT, {type: "earn", amount: 10})
    else 마감 전 제출
        SYS->>CTX: dispatch(ADD_POINT_EVENT, {type: "earn", amount: 3})
    else AI 제안 수락 후 실행
        SYS->>CTX: dispatch(ADD_POINT_EVENT, {type: "earn", amount: 5})
    else 건설적 의견 감지
        SYS->>CTX: dispatch(ADD_POINT_EVENT, {type: "earn", amount: 2})
    else Best Collaborator 선정
        SYS->>CTX: dispatch(ADD_POINT_EVENT, {type: "earn", amount: 20})
    end

    CTX->>FE: Point_Widget 업데이트
    CTX->>FE: Team_Chat에 "🎉 A님 +Npt 획득!" 알림

    Note over SYS,FE: 포인트 차감 이벤트 (자동 감지)
    alt 3일 이상 무응답/미제출
        SYS->>CTX: dispatch(ADD_POINT_EVENT, {type: "penalty", amount: -5})
    else 마감 초과
        SYS->>CTX: dispatch(ADD_POINT_EVENT, {type: "penalty", amount: -10})
    else AI 제안 3회 연속 거절
        SYS->>CTX: dispatch(ADD_POINT_EVENT, {type: "penalty", amount: -5})
    end

    CTX->>FE: Point_Widget 업데이트
    CTX->>FE: Team_Chat에 "⚠️ A님 -Npt 차감 (사유)" 알림
    CTX->>CTX: localStorage 자동 저장
```


## Components and Interfaces

### 프론트엔드 컴포넌트 구조

```mermaid
graph TB
    App --> AppProvider["AppProvider<br/>(Context + useReducer)"]
    AppProvider --> LSSync["LocalStorageSync<br/>(상태 ↔ localStorage)"]
    
    App --> Header
    Header --> ProjectTitle
    Header --> DeadlineCountdown
    Header --> NavTabs

    App --> Routes
    Routes --> TeamCreatePage
    Routes --> DashboardPage
    Routes --> ChatPage
    Routes --> ReportPage

    TeamCreatePage --> ProjectInfoForm
    TeamCreatePage --> MemberAddForm
    TeamCreatePage --> MemberList
    TeamCreatePage --> CreateTeamButton

    DashboardPage --> LeftPanel
    DashboardPage --> RightPanel
    LeftPanel --> MilestoneTimeline
    LeftPanel --> KanbanBoard
    KanbanBoard --> KanbanColumn
    KanbanColumn --> TaskCard
    RightPanel --> AISuggestionPanel
    RightPanel --> AlertTimeline
    AISuggestionPanel --> SuggestionCard
    SuggestionCard --> AcceptButton
    SuggestionCard --> RejectButton

    ChatPage --> ChatMessageList
    ChatPage --> ChatInput
    ChatPage --> ChatSidebar
    ChatMessageList --> MemberMessage
    ChatMessageList --> AIBotMessage

    ReportPage --> ReportViewer
    ReportPage --> PPTPreview

    App --> WorkSubmitModal

    DashboardPage --> PointWidget
    PointWidget --> PointBalance
    PointWidget --> PointHistory

    Routes --> SettlementScreen
    SettlementScreen --> ContributionChart
    SettlementScreen --> PointSettlementList
    SettlementScreen --> BestCollaboratorCert

    Routes --> PointExchangePage
```

### 파일 구조

```
src/
├── components/
│   ├── team/                    # 팀 생성 관련
│   │   ├── TeamCreatePage.tsx   # 팀 생성 페이지
│   │   ├── ProjectInfoForm.tsx  # 프로젝트 정보 입력 폼
│   │   ├── MemberAddForm.tsx    # 팀원 추가 폼
│   │   └── MemberList.tsx       # 추가된 팀원 목록
│   ├── dashboard/               # 대시보드 + 칸반보드
│   │   ├── DashboardPage.tsx    # 대시보드 메인 페이지
│   │   ├── KanbanBoard.tsx      # 칸반 보드
│   │   ├── KanbanColumn.tsx     # 칸반 컬럼 (Todo/InProgress/Done)
│   │   ├── TaskCard.tsx         # 태스크 카드
│   │   ├── MilestoneTimeline.tsx # 마일스톤 타임라인
│   │   └── AlertTimeline.tsx    # 알림 타임라인
│   ├── chat/                    # 채팅방
│   │   ├── ChatPage.tsx         # 채팅 페이지
│   │   ├── ChatMessageList.tsx  # 메시지 목록
│   │   ├── ChatInput.tsx        # 메시지 입력
│   │   └── ChatSidebar.tsx      # 감지 항목 사이드바
│   ├── review/                  # 결과물 제출 + 리뷰
│   │   ├── WorkSubmitModal.tsx  # 결과물 제출 모달
│   │   └── ReviewResult.tsx     # AI 리뷰 결과 표시
│   ├── suggestion/              # AI 제안 패널
│   │   ├── AISuggestionPanel.tsx # 제안 패널
│   │   ├── SuggestionCard.tsx   # 제안 카드
│   │   └── SuggestionHistory.tsx # 제안 이력
│   ├── report/                  # 보고서 + PPT
│   │   ├── ReportPage.tsx       # 보고서 페이지
│   │   ├── ReportViewer.tsx     # 보고서 뷰어
│   │   └── PPTPreview.tsx       # PPT 미리보기
│   ├── marketplace/             # 마켓플레이스
│   │   ├── MarketplacePage.tsx  # 마켓 메인 페이지
│   │   └── MarketListingCard.tsx # 과제 카드
│   ├── points/                  # 포인트 시스템
│   │   ├── PointWidget.tsx      # 대시보드 포인트 위젯 (잔액, 보증금, 최근 변동)
│   │   ├── SettlementScreen.tsx # 프로젝트 종료 정산 화면
│   │   ├── ContributionChart.tsx # 기여도 바 차트
│   │   ├── BestCollaboratorCert.tsx # Best Collaborator 인증서
│   │   └── PointExchangePage.tsx # 포인트 교환 페이지
│   └── common/                  # 공통 컴포넌트
│       ├── LoadingOverlay.tsx   # 로딩 오버레이
│       ├── ErrorMessage.tsx     # 에러 메시지
│       └── Header.tsx           # 헤더
├── context/
│   ├── TeamContext.tsx           # React Context 정의
│   └── teamReducer.ts           # useReducer 액션/리듀서
├── hooks/
│   ├── useTeam.ts               # 팀 상태 관리 훅
│   ├── useChat.ts               # 채팅 로직 훅
│   ├── useAISuggestion.ts       # AI 제안 관리 훅
│   ├── usePoints.ts             # 포인트 시스템 관리 훅
│   └── useLocalStorage.ts       # localStorage 동기화 훅
├── types/
│   └── index.ts                 # TypeScript 인터페이스 정의
├── api/
│   ├── teamApi.ts               # POST /api/team
│   ├── chatApi.ts               # POST /api/chat
│   ├── reviewApi.ts             # POST /api/review
│   ├── decisionApi.ts           # POST /api/decision
│   ├── mergeApi.ts              # POST /api/merge
│   ├── checkApi.ts              # GET /api/check
│   ├── pointsSettleApi.ts       # POST /api/points/settle
│   └── pointsPredictApi.ts      # POST /api/points/predict
├── utils/
│   ├── pptGenerator.ts          # reveal.js HTML 생성
│   ├── dateUtils.ts             # 날짜 유틸리티
│   └── jsonParser.ts            # JSON 파싱 + 코드블록 제거
└── App.tsx
```

### 커스텀 훅 인터페이스

```typescript
// useTeam - 팀 상태 관리
function useTeam(): {
  team: Team | null;
  loading: boolean;
  error: string | null;
  createTeam: (input: TeamCreateInput) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => void;
  applyChanges: (changes: AppliedChange[]) => void;
};

// useChat - 채팅 로직
function useChat(): {
  messages: ChatMessage[];
  detections: AiDetection[];
  sending: boolean;
  sendMessage: (content: string, senderId: string) => Promise<void>;
};

// useAISuggestion - AI 제안 관리
function useAISuggestion(): {
  suggestions: AISuggestion[];
  processing: boolean;
  acceptSuggestion: (suggestionId: string) => Promise<void>;
  rejectSuggestion: (suggestionId: string, reason: string) => Promise<void>;
};

// useLocalStorage - localStorage 동기화
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void];

// usePoints - 포인트 시스템 관리
function usePoints(): {
  pointAccounts: PointAccount[];
  predictions: PointPrediction[];
  settlementResult: SettlementResult | null;
  loading: boolean;
  initializePoints: (members: Member[]) => void;
  depositPoints: (memberId: string, amount: number) => void;
  addPointEvent: (memberId: string, type: PointHistoryType, amount: number, reason: string) => void;
  settlePoints: (teamState: Team) => Promise<void>;
  predictPoints: (teamState: Team) => Promise<void>;
  exchangePoints: (memberId: string, item: ExchangeItem) => boolean;
};
```

### API 호출 함수 인터페이스

```typescript
// api/teamApi.ts
async function createTeam(input: {
  projectName: string;
  topic: string;
  deadline: string;
  members: MemberInput[];
}): Promise<{
  tasks: Task[];
  milestones: Milestone[];
  aiMessage: string;
}>;

// api/chatApi.ts
async function analyzeChat(input: {
  teamState: Team;
  newMessage: string;
  sender: string;
}): Promise<{
  detection: { type: string; confidence: number; detail: string };
  shouldIntervene: boolean;
  aiResponse: string;
  suggestedActions: SuggestedAction[];
}>;

// api/reviewApi.ts
async function submitReview(input: {
  teamState: Team;
  taskId: string;
  submittedContent: string;
}): Promise<{
  review: Review;
  delayDetection: DelayDetection;
  reassignSuggestion: AISuggestion | null;
}>;

// api/decisionApi.ts
async function processDecision(input: {
  teamState: Team;
  suggestionId: string;
  accepted: boolean;
  rejectionReason?: string;
}): Promise<{
  action: 'apply' | 'newSuggestion';
  appliedChanges?: AppliedChange[];
  newSuggestion?: AISuggestion;
}>;

// api/mergeApi.ts
async function mergeReport(input: {
  teamState: Team;
}): Promise<{
  report: Report;
  pptSlides: PPTSlide[];
}>;

// api/checkApi.ts
async function runCheck(input: {
  teamState: Team;
}): Promise<{
  alerts: Alert[];
  triggerMerge: boolean;
  aiChatMessage: string;
}>;

// api/pointsSettleApi.ts
async function settlePoints(input: {
  teamState: Team;
  pointAccounts: PointAccount[];
}): Promise<{
  settlements: {
    memberId: string;
    pointChange: number;
    reason: string;
    totalPoints: number;
    badge: string | null;
    certificate: PointCertificate | null;
  }[];
  bestCollaborator: {
    memberId: string;
    memberName: string;
    certificate: PointCertificate;
  };
  aiComment: string;
}>;

// api/pointsPredictApi.ts
async function predictPoints(input: {
  teamState: Team;
  pointAccounts: PointAccount[];
}): Promise<{
  predictions: {
    memberId: string;
    predictedChange: number;
    warning: string | null;
    motivationMessage: string;
  }[];
}>;
```

### Lambda 함수 구조

각 Lambda 함수는 동일한 패턴을 따른다:

```typescript
// Lambda 핸들러 공통 패턴
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // 1. 프롬프트 구성 (팀 전체 상태 포함)
    const prompt = buildPrompt(body);
    
    // 2. Bedrock Claude 호출
    const aiResponse = await invokeBedrock(prompt);
    
    // 3. JSON 파싱 (코드블록 래핑 제거 포함)
    const parsed = parseAIResponse(aiResponse);
    
    return { statusCode: 200, body: JSON.stringify(parsed) };
  } catch (error) {
    // 1회 재시도
    try {
      const retryResponse = await invokeBedrock(prompt);
      const parsed = parseAIResponse(retryResponse);
      return { statusCode: 200, body: JSON.stringify(parsed) };
    } catch (retryError) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AI 응답 처리 실패' }) };
    }
  }
};
```

### Bedrock 호출 레이어

```typescript
// 공통 Bedrock 호출 유틸리티
async function invokeBedrock(prompt: string): Promise<string> {
  const client = new BedrockRuntimeClient({ region: 'us-east-1' });
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    contentType: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const response = await client.send(command);
  return new TextDecoder().decode(response.body);
}

// JSON 파싱 안전장치 (```json 래핑 제거 포함)
function parseAIResponse(raw: string): unknown {
  let text = raw;
  // Bedrock 응답 구조에서 텍스트 추출
  const parsed = JSON.parse(text);
  const content = parsed.content?.[0]?.text || text;
  // ```json 코드블록 래핑 제거
  const cleaned = content.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}
```


## Data Models

### 핵심 엔티티

```typescript
// types/index.ts

interface Team {
  id: string;                    // crypto.randomUUID()
  projectName: string;
  topic: string;
  deadline: string;              // ISO 8601 (YYYY-MM-DD)
  members: Member[];
  tasks: Task[];
  milestones: Milestone[];
  chatMessages: ChatMessage[];
  aiSuggestions: AISuggestion[];
  alerts: Alert[];
  report: Report | null;
  createdAt: string;             // ISO 8601
}

interface Member {
  id: string;
  name: string;
  department: string;            // 학과
  strength: string;              // 강점
  assignedTasks: string[];       // task id 배열
}

interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;            // member id
  startDate: string;             // ISO 8601
  deadline: string;              // ISO 8601
  progress: number;              // 0-100
  status: 'todo' | 'inProgress' | 'done';
  difficulty: '상' | '중' | '하';
  submittedContent: string | null;
  review: Review | null;
  lastUpdated: string;           // ISO 8601
}

interface Milestone {
  week: number;
  startDate: string;
  endDate: string;
  goals: string[];
  keyDeadlines: string[];
}
```

### 채팅 모델

```typescript
interface ChatMessage {
  id: string;
  sender: string;                // memberId 또는 'ai'
  content: string;
  timestamp: string;             // ISO 8601
  aiDetection: {
    type: 'decision' | 'newTask' | 'risk' | 'none';
    confidence: number;          // 0.0 ~ 1.0
    detail: string;
  } | null;
}
```

### AI 제안 모델

```typescript
interface AISuggestion {
  id: string;
  type: 'reassign' | 'extend' | 'reduce_scope' | 'pair_work' | 'split_task';
  content: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  previousSuggestions: string[]; // 이전 제안 id 배열
  relatedTaskId: string;
  round: number;                 // 1-3 (최대 3회)
  createdAt: string;
}
```

### 리뷰 모델

```typescript
interface Review {
  taskId: string;
  scores: {
    completeness: number;        // 0-25 (완성도)
    logic: number;               // 0-25 (논리성)
    volume: number;              // 0-25 (분량)
    relevance: number;           // 0-25 (주제적합성)
    total: number;               // 0-100
  };
  feedback: string[];            // 구체적 개선 포인트
  suggestedProgress: number;     // AI가 산정한 진행률 0-100
  delayDetection: {
    expectedProgress: number;    // (경과일/전체일) × 100
    actualProgress: number;      // 리뷰 점수 기반 산정
    gap: number;                 // expected - actual
    severity: 'critical' | 'warning' | 'normal';
  };
}
```

### 알림 모델

```typescript
interface Alert {
  id: string;
  message: string;
  type: 'deadline' | 'delay' | 'nudge' | 'completion';
  target: string;                // 팀원명 또는 '전체'
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}
```

### 보고서 + PPT 모델

```typescript
interface Report {
  title: string;
  sections: ReportSection[];
  status: 'draft' | 'approved';
  pptSlides: PPTSlide[] | null;
}

interface ReportSection {
  title: string;
  content: string;               // 마크다운 형식
  author: string;                // 원 작성자
  aiComments: string[];          // AI 보완 코멘트
}

interface PPTSlide {
  slideNumber: number;
  title: string;
  content: string;               // 핵심 내용 (3-5줄)
  keywords: string[];            // 키워드 3개
  speakerNotes: string;          // 발표자 노트
}
```

### 마켓플레이스 모델

```typescript
interface MarketListing {
  id: string;
  teamId: string;
  title: string;
  subject: string;               // 과목명
  department: string;            // 학과
  qualityScore: number;          // AI 품질 점수 0-100
  price: number;                 // AI 자동 산정 가격
  aiSummary: string;             // 맛보기 요약본
  fullContent: string;           // 전체 본문 (구매 후 열람)
  reviewReport: Report;          // AI 리뷰 리포트
  contributionData: {            // 기여도 데이터
    memberId: string;
    memberName: string;
    contribution: number;        // 기여도 %
  }[];
  salesCount: number;
  createdAt: string;
}
```

### 포인트 시스템 모델

```typescript
interface PointAccount {
  memberId: string;
  memberName: string;
  balance: number;               // 현재 포인트 잔액
  deposit: number;               // 보증금 (프로젝트 시작 시 20pt)
  history: PointHistory[];       // 포인트 변동 이력
  badges: string[];              // 획득한 뱃지 목록
  certificates: PointCertificate[]; // 인증서 목록
}

interface PointHistory {
  type: 'earn' | 'spend' | 'deposit' | 'refund' | 'penalty';
  amount: number;                // 양수: 획득, 음수: 차감
  reason: string;                // 변동 사유
  timestamp: string;             // ISO 8601
}

interface PointCertificate {
  type: 'best_collaborator' | 'quality_star' | 'deadline_master';
  projectName: string;
  issuedAt: string;              // ISO 8601
}

interface PointPrediction {
  memberId: string;
  predictedChange: number;       // 예측 포인트 변동
  warning: string | null;        // 경고 메시지 (차감 예상 시)
  motivationMessage: string;     // 동기부여 메시지
}

interface SettlementResult {
  settlements: {
    memberId: string;
    pointChange: number;
    reason: string;
    totalPoints: number;
    badge: string | null;
    certificate: PointCertificate | null;
  }[];
  bestCollaborator: {
    memberId: string;
    memberName: string;
    certificate: PointCertificate;
  };
  aiComment: string;             // AI 종합 코멘트
}

type ExchangeItem = 'ai_matching' | 'cover_letter' | 'collaborator_badge';

const EXCHANGE_COSTS: Record<ExchangeItem, number> = {
  ai_matching: 20,               // AI 매칭 추천 1회
  cover_letter: 15,              // 공모전 자소서 자동 생성 1회
  collaborator_badge: 50,        // "우수 협업자" 인증 뱃지
};
```

### Context Reducer 액션 타입

```typescript
type TeamAction =
  | { type: 'SET_TEAM'; payload: Team }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; updates: Partial<Task> } }
  | { type: 'UPDATE_REVIEW'; payload: { taskId: string; review: Review; suggestion?: AISuggestion } }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'ADD_DETECTION'; payload: { messageId: string; detection: ChatMessage['aiDetection'] } }
  | { type: 'ADD_SUGGESTION'; payload: AISuggestion }
  | { type: 'UPDATE_SUGGESTION'; payload: { id: string; status: AISuggestion['status']; rejectionReason?: string } }
  | { type: 'APPLY_CHANGES'; payload: AppliedChange[] }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'SET_REPORT'; payload: Report }
  | { type: 'APPROVE_REPORT' }
  | { type: 'SET_PPT_SLIDES'; payload: PPTSlide[] }
  | { type: 'ADD_MARKET_LISTING'; payload: MarketListing }
  | { type: 'LOAD_FROM_STORAGE'; payload: Team }
  | { type: 'INIT_POINT_ACCOUNTS'; payload: PointAccount[] }
  | { type: 'UPDATE_POINT_ACCOUNT'; payload: { memberId: string; updates: Partial<PointAccount> } }
  | { type: 'ADD_POINT_EVENT'; payload: { memberId: string; event: PointHistory } }
  | { type: 'SET_POINT_PREDICTIONS'; payload: PointPrediction[] }
  | { type: 'SET_SETTLEMENT_RESULT'; payload: SettlementResult };

interface AppliedChange {
  type: 'reassign_task' | 'extend_deadline' | 'reduce_scope' | 'add_task' | 'split_task';
  taskId: string;
  details: Record<string, unknown>;
}
```

### localStorage 키 구조

| 키 | 값 | 설명 |
|----|-----|------|
| `ai-pm-agent-team` | `Team` JSON | 팀 전체 상태 |
| `ai-pm-agent-market` | `MarketListing[]` JSON | 마켓플레이스 목록 |
| `ai-pm-agent-points` | `PointAccount[]` JSON | 팀원별 포인트 계정 |
| `ai-pm-agent-predictions` | `PointPrediction[]` JSON | AI 포인트 예측 결과 |
| `ai-pm-agent-settlement` | `SettlementResult` JSON | 프로젝트 종료 정산 결과 |

### 엔티티 관계도

```mermaid
erDiagram
    Team ||--o{ Member : "has"
    Team ||--o{ Task : "has"
    Team ||--o{ Milestone : "has"
    Team ||--o{ ChatMessage : "has"
    Team ||--o{ AISuggestion : "has"
    Team ||--o{ Alert : "has"
    Team ||--o| Report : "has"
    
    Member ||--o{ Task : "assigned to"
    Member ||--|| PointAccount : "has"
    Task ||--o| Review : "has"
    AISuggestion }o--|| Task : "related to"
    
    Report ||--o{ ReportSection : "has"
    Report ||--o{ PPTSlide : "has"
    
    Team ||--o| MarketListing : "listed as"
    Team ||--o| SettlementResult : "settled by"
    
    PointAccount ||--o{ PointHistory : "has"
    PointAccount ||--o{ PointCertificate : "has"
    SettlementResult ||--|| PointCertificate : "awards best collaborator"
```

