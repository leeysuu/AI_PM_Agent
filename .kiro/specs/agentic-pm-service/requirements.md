# Requirements Document

## Introduction

대학생 조별과제를 AI가 자율적으로 관리하는 프로젝트 매니저 에이전트 웹 애플리케이션이다. 팀원은 팀 정보 입력, 채팅 및 결과물 제출, AI 제안 수락/거절 3가지만 수행하며, 역할 분배, 일정 관리, 품질 리뷰, 지연 감지, 재배분, 보고서 취합, PPT 생성 등 나머지 프로젝트 관리 업무는 AI PM 에이전트가 자율적으로 수행한다. 프로젝트 종료 후에는 완성된 과제를 마켓플레이스에 등록하여 수익화할 수 있다. 모든 AI 판단은 Amazon Bedrock Claude API 호출을 통해 이루어지며, 하드코딩된 분기 로직을 사용하지 않는다.

## Glossary

- **System**: AI 조별과제 PM 에이전트 웹 애플리케이션 전체 시스템
- **Team_Creation_Form**: 프로젝트명, 마감일, 팀원 정보를 입력받는 팀 생성 폼 컴포넌트
- **AI_Role_Assigner**: Bedrock Claude를 호출하여 팀원 강점과 주제를 분석하고 역할을 자동 분배하는 Lambda 함수
- **AI_Schedule_Planner**: Bedrock Claude를 호출하여 마감일 역산 기반 마일스톤과 태스크별 중간 마감일을 생성하는 Lambda 함수
- **Dashboard**: 프로젝트 현황, 칸반 보드, AI 제안 패널, 채팅방, 알림 타임라인을 통합 표시하는 메인 화면. 별도 탭으로 Report_Viewer, PPT_Viewer, Marketplace를 포함한다
- **Kanban_Board**: 태스크를 To Do / In Progress / Done 상태로 분류하여 표시하는 보드 컴포넌트
- **Team_Chat**: 팀원과 AI PM 봇이 함께 참여하는 팀 전용 채팅방 컴포넌트. 웹소켓 없이 React 상태관리와 POST API 호출 방식으로 구현한다
- **AI_Chat_Monitor**: Bedrock Claude를 호출하여 채팅 메시지를 분석하고 의사결정, 새 태스크, 리스크를 감지하는 Lambda 함수
- **AI_Quality_Reviewer**: Bedrock Claude를 호출하여 제출된 결과물을 완성도, 논리성, 분량, 주제적합성 4가지 기준으로 평가하는 Lambda 함수
- **AI_Delay_Detector**: 기대 진행률과 실제 진행률을 비교하여 지연을 감지하고 재배분을 제안하는 로직 (AI_Quality_Reviewer와 단일 Bedrock 호출로 연쇄 처리)
- **AI_Negotiator**: Bedrock Claude를 호출하여 거절 사유를 분석하고 이전 이력을 참조하여 새로운 대안을 생성하는 Lambda 함수
- **AI_Report_Merger**: Bedrock Claude를 호출하여 팀원 결과물을 하나의 보고서로 병합하고 PPT 구성안을 생성하는 Lambda 함수
- **AI_Proactive_Checker**: Bedrock Claude를 호출하여 마감 임박, 장기 미업데이트, 전원 완료 여부를 점검하는 Lambda 함수 (GET /api/check 엔드포인트)
- **Suggestion_Panel**: AI가 생성한 제안을 카드 형태로 표시하고 수락/거절 버튼, 거절 사유 입력, 제안 이력을 제공하는 패널 컴포넌트
- **Report_Viewer**: 병합된 보고서를 마크다운 형식으로 표시하고 승인/수정 요청 버튼을 제공하는 뷰어 컴포넌트
- **PPT_Viewer**: reveal.js 기반 HTML 프레젠테이션을 미리보기하고 다운로드할 수 있는 뷰어 컴포넌트
- **PPT_Generator**: 승인된 보고서를 기반으로 reveal.js HTML 프레젠테이션을 생성하는 로직
- **Marketplace**: 완성된 과제를 등록, 검색, 구매할 수 있는 과제 거래 플랫폼 컴포넌트
- **MarketListing**: 마켓플레이스에 등록된 개별 과제 항목의 데이터 구조 (id, teamId, title, subject, department, qualityScore, price, aiSummary, fullContent, reviewReport, contributionData, salesCount, createdAt 필드를 포함)
- **Confidence_Score**: AI_Chat_Monitor가 감지 결과에 부여하는 0.0~1.0 범위의 확신도 수치
- **Expected_Progress**: (경과일 / 전체일) × 100으로 계산되는 기대 진행률 백분율
- **Actual_Progress**: AI_Quality_Reviewer의 리뷰 점수 기반으로 산정되는 실제 진행률 백분율
- **Negotiation_Round**: AI_Negotiator가 대안을 제시하는 회차 (최대 3회)
- **Team_State**: 팀원, 태스크, 마일스톤, 채팅, 제안 이력, 알림, 보고서 등 팀 전체 상태를 포함하는 데이터 객체

## Requirements

### Requirement 1: 팀 생성 폼 입력

**User Story:** As a 팀원, I want 프로젝트명, 전체 마감일, 팀원 정보(이름/학과/강점)를 입력하는 폼을 사용하고 싶다, so that AI가 역할 분배와 일정 생성을 자동으로 수행할 수 있다.

#### Acceptance Criteria

1. THE Team_Creation_Form SHALL 프로젝트명 텍스트 입력 필드, 전체 마감일 날짜 선택 필드, 팀원 정보(이름, 학과, 강점) 입력 필드를 제공한다
2. THE Team_Creation_Form SHALL 팀원을 동적으로 추가 및 삭제할 수 있는 기능을 제공한다
3. WHEN 필수 입력 필드(프로젝트명, 마감일, 최소 2명의 팀원 정보)가 모두 채워지지 않은 상태에서 제출 버튼을 클릭하면, THE Team_Creation_Form SHALL 누락된 필드를 시각적으로 표시하고 제출을 차단한다
4. WHEN 마감일이 현재 날짜 이전으로 설정되면, THE Team_Creation_Form SHALL 유효하지 않은 마감일임을 알리고 제출을 차단한다

### Requirement 2: AI 역할 자동 분배

**User Story:** As a 팀원, I want AI가 팀원 강점과 프로젝트 주제를 분석하여 역할을 자동으로 분배해 주길 원한다, so that 각 팀원에게 적합한 태스크가 공정하게 배정된다.

#### Acceptance Criteria

1. WHEN 팀 생성 폼이 제출되면, THE AI_Role_Assigner SHALL Bedrock Claude API를 호출하여 팀원 강점과 프로젝트 주제를 분석하고 5~8개의 태스크를 생성한다
2. WHEN 태스크가 생성되면, THE AI_Role_Assigner SHALL 각 태스크에 가장 적합한 팀원을 배정하고 배정 이유를 함께 제공한다
3. WHEN 태스크가 생성되면, THE AI_Role_Assigner SHALL 각 태스크에 난이도(상/중/하)를 산정하고 팀원 간 부하를 균형 있게 배분한다
4. WHEN AI_Role_Assigner가 Bedrock API 호출에 실패하면, THE System SHALL 1회 재시도를 수행하고, 재시도 실패 시 사용자에게 에러 메시지를 표시한다

### Requirement 3: AI 일정 자동 생성

**User Story:** As a 팀원, I want AI가 마감일을 역산하여 주간 마일스톤과 태스크별 중간 마감일을 자동으로 생성해 주길 원한다, so that 체계적인 일정 관리가 가능하다.

#### Acceptance Criteria

1. WHEN 팀 생성 폼이 제출되면, THE AI_Schedule_Planner SHALL Bedrock Claude API를 호출하여 전체 마감일에서 역산한 주간 마일스톤을 생성한다
2. WHEN 마일스톤이 생성되면, THE AI_Schedule_Planner SHALL 각 태스크에 시작일과 중간 마감일을 설정한다
3. WHEN 마일스톤이 생성되면, THE AI_Schedule_Planner SHALL 태스크 간 의존성을 고려하여 실행 순서를 배치한다
4. WHEN 역할 분배와 일정 생성이 완료되면, THE System SHALL 결과를 Kanban_Board 형태로 Dashboard에 표시한다

### Requirement 4: 대시보드 표시

**User Story:** As a 팀원, I want 프로젝트 현황을 한눈에 볼 수 있는 대시보드를 사용하고 싶다, so that 전체 진행 상황을 쉽게 파악할 수 있다.

#### Acceptance Criteria

1. THE Dashboard SHALL 상단에 프로젝트명, D-day 카운트다운, 전체 진행률 바를 표시한다
2. THE Dashboard SHALL 좌측 중앙에 Kanban_Board를 표시하여 태스크를 To Do, In Progress, Done 상태로 분류한다
3. THE Dashboard SHALL 우측에 Suggestion_Panel을 표시하여 AI 제안 카드 목록, 수락/거절 버튼, 거절 사유 입력, 제안 이력을 보여준다
4. THE Dashboard SHALL 하단 좌측에 Team_Chat을 표시한다
5. THE Dashboard SHALL 하단 우측에 알림 타임라인을 표시하여 AI가 생성한 알림을 시간순으로 나열한다
6. THE Dashboard SHALL 별도 탭으로 Report_Viewer, PPT_Viewer, Marketplace 화면을 제공한다
7. WHEN 태스크 상태 또는 진행률이 변경되면, THE Dashboard SHALL 변경된 내용을 즉시 반영하여 표시한다

### Requirement 5: 칸반 보드

**User Story:** As a 팀원, I want 태스크를 칸반 보드 형태로 보고 싶다, so that 각 태스크의 진행 상태를 직관적으로 파악할 수 있다.

#### Acceptance Criteria

1. THE Kanban_Board SHALL 태스크를 To Do, In Progress, Done 3개 컬럼으로 분류하여 카드 형태로 표시한다
2. THE Kanban_Board SHALL 각 태스크 카드에 제목, 담당자, 마감일, 진행률 바, 난이도를 표시한다
3. THE Kanban_Board SHALL 각 태스크 카드에 상태 뱃지(정상/지연/완료)를 표시한다
4. WHEN AI가 역할 분배와 일정 생성을 완료하면, THE Kanban_Board SHALL 생성된 태스크를 To Do 컬럼에 표시한다

### Requirement 6: 팀 채팅방

**User Story:** As a 팀원, I want 앱 내 팀 전용 채팅방에서 팀원들과 대화하고 싶다, so that 프로젝트 관련 소통을 한 곳에서 할 수 있다.

#### Acceptance Criteria

1. THE Team_Chat SHALL 팀원과 AI PM 봇이 함께 참여하는 채팅 인터페이스를 제공한다
2. THE Team_Chat SHALL 메시지 입력 필드와 전송 버튼을 제공한다
3. WHEN 팀원이 메시지를 전송하면, THE Team_Chat SHALL 메시지를 채팅 목록에 즉시 표시하고 발신자 이름과 타임스탬프를 함께 표시한다
4. WHEN AI PM 봇이 응답하면, THE Team_Chat SHALL AI 메시지를 시각적으로 구분하여 채팅 목록에 표시한다
5. THE Team_Chat SHALL 웹소켓 없이 React 상태관리와 POST API 호출 방식으로 구현한다 (해커톤 MVP)

### Requirement 7: AI 채팅 모니터링

**User Story:** As a 팀원, I want AI가 채팅 대화를 분석하여 의사결정, 새 태스크, 리스크를 자동으로 감지해 주길 원한다, so that 중요한 내용이 누락되지 않는다.

#### Acceptance Criteria

1. WHEN 팀원이 채팅 메시지를 전송하면, THE AI_Chat_Monitor SHALL Bedrock Claude API를 호출하여 최근 20개 메시지 컨텍스트를 분석한다
2. WHEN AI_Chat_Monitor가 의사결정을 감지하고 Confidence_Score가 0.7 이상이면, THE AI_Chat_Monitor SHALL "📋 의사결정 감지: [내용]. 회의록에 자동 기록했습니다." 형식의 메시지를 Team_Chat에 표시한다
3. WHEN AI_Chat_Monitor가 새 태스크를 감지하고 Confidence_Score가 0.7 이상이면, THE AI_Chat_Monitor SHALL "📌 새 태스크 감지: [태스크명]. 담당: [이름] / 마감: [날짜]로 추가할까요? [수락/거절]" 형식의 메시지와 수락/거절 버튼을 Team_Chat에 표시한다
4. WHEN AI_Chat_Monitor가 일정 리스크를 감지하고 Confidence_Score가 0.7 이상이면, THE AI_Chat_Monitor SHALL "📅 일정 리스크 감지. 대안 1: [내용] / 대안 2: [내용]" 형식의 메시지와 대안 선택 버튼을 Team_Chat에 표시한다
5. WHEN AI_Chat_Monitor의 Confidence_Score가 0.7 미만이면, THE AI_Chat_Monitor SHALL 감지 결과를 채팅 사이드바에만 요약 표시하고 Team_Chat에 자동 개입하지 않는다
6. WHEN AI_Chat_Monitor가 감지할 내용이 없으면, THE AI_Chat_Monitor SHALL 응답하지 않는다 (불필요한 개입 방지)

### Requirement 8: 결과물 제출

**User Story:** As a 팀원, I want 담당 태스크의 결과물 텍스트를 제출하고 싶다, so that AI가 품질 리뷰를 수행할 수 있다.

#### Acceptance Criteria

1. THE System SHALL 각 태스크 카드에 결과물 텍스트를 입력하고 제출할 수 있는 인터페이스를 제공한다
2. WHEN 팀원이 결과물을 제출하면, THE System SHALL 해당 태스크의 상태를 In Progress로 변경한다
3. IF 결과물 텍스트가 비어 있는 상태에서 제출 버튼을 클릭하면, THEN THE System SHALL 빈 결과물은 제출할 수 없다는 메시지를 표시하고 제출을 차단한다

### Requirement 9: AI 품질 리뷰 및 연쇄 처리

**User Story:** As a 팀원, I want AI가 제출한 결과물을 자동으로 리뷰하고 진행률을 산정해 주길 원한다, so that 객관적인 피드백과 진행 상황을 확인할 수 있다.

#### Acceptance Criteria

1. WHEN 팀원이 결과물을 제출하면, THE AI_Quality_Reviewer SHALL 단일 Bedrock Claude API 호출로 4단계 연쇄 처리를 수행한다: (1) 완성도, 논리성, 분량, 주제적합성 각 25점 기준 품질 평가, (2) 리뷰 점수 기반 진행률 자동 산정, (3) Expected_Progress와 Actual_Progress 비교를 통한 지연 감지, (4) 지연이 critical일 때 재배분 제안 생성
2. WHEN 품질 리뷰가 완료되면, THE AI_Quality_Reviewer SHALL 각 평가 항목별 점수(0~25점)와 총점(0~100점), 구체적 개선 포인트 피드백을 제공한다
3. WHEN 품질 리뷰가 완료되면, THE AI_Quality_Reviewer SHALL 총점 기반으로 진행률을 자동 산정한다 (80점 이상: 90~100%, 60~79점: 60~89%, 40~59점: 30~59%, 40점 미만: 0~29%)
4. WHEN 진행률이 산정되면, THE AI_Delay_Detector SHALL Expected_Progress와 Actual_Progress의 갭을 계산하여 severity를 판정한다 (갭 20% 이상: critical, 갭 10~19%: warning, 갭 10% 미만: normal)
5. WHEN severity가 critical로 판정되면, THE AI_Delay_Detector SHALL 팀 전체 상황을 분석하여 재배분 제안을 자동 생성하고 Suggestion_Panel에 카드로 표시한다
6. WHEN 연쇄 처리가 완료되면, THE System SHALL 리뷰 결과, 진행률, 지연 분석, 재배분 제안을 한번에 Dashboard에 표시한다

### Requirement 10: AI 제안 수락/거절

**User Story:** As a 팀원, I want AI의 재배분 제안을 수락하거나 거절하고 싶다, so that 팀 상황에 맞는 최적의 조정이 이루어진다.

#### Acceptance Criteria

1. THE Suggestion_Panel SHALL 각 AI 제안을 카드 형태로 표시하고 수락 버튼과 거절 버튼을 제공한다
2. WHEN 팀원이 수락 버튼을 클릭하면, THE System SHALL 제안된 변경사항(태스크 재배정, 마감 연장 등)을 Team_State에 즉시 적용한다
3. WHEN 팀원이 거절 버튼을 클릭하면, THE System SHALL 거절 사유 텍스트 입력을 필수로 요구한다
4. IF 거절 사유가 비어 있는 상태에서 거절을 확인하면, THEN THE System SHALL 거절 사유 입력이 필수임을 알리고 거절 처리를 차단한다

### Requirement 11: AI 협상 (대안 생성 루프)

**User Story:** As a 팀원, I want AI가 거절 사유를 분석하여 새로운 대안을 제시해 주길 원한다, so that 팀에 적합한 해결책을 찾을 수 있다.

#### Acceptance Criteria

1. WHEN 팀원이 제안을 거절하고 사유를 입력하면, THE AI_Negotiator SHALL Bedrock Claude API를 호출하여 거절 사유를 분석하고 이전 제안 이력 전체를 프롬프트에 포함하여 새로운 대안을 생성한다
2. THE AI_Negotiator SHALL 이전에 거절된 제안과 동일한 내용의 제안을 반복하지 않는다
3. THE AI_Negotiator SHALL 대안 유형으로 다른 팀원 이관, 마감 연장, 범위 축소, 페어워크, 태스크 분할 중 적절한 전략을 선택한다
4. WHILE Negotiation_Round가 3 이하인 동안, THE AI_Negotiator SHALL 거절 시마다 Bedrock API를 호출하여 매번 다른 결과의 새로운 대안을 생성한다
5. WHEN Negotiation_Round가 3을 초과하면, THE System SHALL "팀원 간 직접 논의를 권장합니다" 안내 메시지를 표시하고 AI 자동 제안을 중단한다

### Requirement 12: 보고서 자동 취합

**User Story:** As a 팀원, I want 모든 팀원의 결과물이 제출 완료되면 AI가 자동으로 보고서를 병합해 주길 원한다, so that 수작업 없이 통합 보고서를 얻을 수 있다.

#### Acceptance Criteria

1. WHEN 모든 팀원의 태스크가 완료 상태가 되면, THE AI_Report_Merger SHALL 자동으로 보고서 병합 제안을 표시한다
2. WHEN 보고서 병합이 트리거되면, THE AI_Report_Merger SHALL Bedrock Claude API를 호출하여 논리적 목차 구조를 자동 생성하고, 각 팀원 결과물을 해당 섹션에 배치하며, 섹션 간 연결 문장을 추가하고, 전체 문체를 통일한다
3. WHEN 보고서 병합이 완료되면, THE Report_Viewer SHALL 병합된 보고서를 마크다운 형식으로 미리보기 표시하고 승인 버튼과 수정 요청 버튼을 제공한다
4. WHEN 팀원이 수정 요청 버튼을 클릭하고 피드백을 입력하면, THE AI_Report_Merger SHALL 피드백을 반영하여 보고서를 재생성한다

### Requirement 13: PPT 자동 생성

**User Story:** As a 팀원, I want 보고서 승인 후 AI가 발표용 PPT를 자동으로 생성해 주길 원한다, so that 발표 준비 시간을 절약할 수 있다.

#### Acceptance Criteria

1. WHEN 보고서가 승인되면, THE PPT_Generator SHALL Bedrock Claude API를 호출하여 발표용 슬라이드 구성안을 자동 생성한다
2. WHEN 슬라이드 구성안이 생성되면, THE PPT_Generator SHALL 각 슬라이드에 제목, 핵심 내용 요약, 키워드를 포함한다
3. THE PPT_Viewer SHALL reveal.js 기반 HTML 프레젠테이션 형태로 미리보기를 제공한다
4. THE PPT_Viewer SHALL 생성된 프레젠테이션을 다운로드할 수 있는 기능을 제공한다

### Requirement 14: AI 능동적 알림

**User Story:** As a 팀원, I want AI가 마감 임박, 장기 미업데이트 등을 자동으로 감지하여 알림을 보내 주길 원한다, so that 중요한 일정을 놓치지 않는다.

#### Acceptance Criteria

1. WHEN 태스크의 마지막 업데이트로부터 3일 이상 경과하면, THE AI_Proactive_Checker SHALL 해당 팀원에게 독촉 메시지를 Team_Chat에 자동 전송한다
2. WHEN 전체 마감일 3일 전(D-3)이 되면, THE AI_Proactive_Checker SHALL 팀 전체에 중간 점검 알림을 생성한다
3. WHEN 전체 마감일 1일 전(D-1)이 되면, THE AI_Proactive_Checker SHALL 팀 전체에 긴급 알림을 생성한다
4. WHEN 개별 태스크가 완료되면, THE AI_Proactive_Checker SHALL 축하 메시지와 함께 팀 전체 진행률 업데이트를 Team_Chat에 공유한다
5. WHEN 모든 태스크가 완료 상태가 되면, THE AI_Proactive_Checker SHALL 보고서 취합 트리거 신호를 생성한다
6. THE AI_Proactive_Checker SHALL GET /api/check 엔드포인트를 통해 주기적으로 점검을 수행한다

### Requirement 15: 과제 마켓플레이스

**User Story:** As a 팀원, I want 프로젝트 종료 후 완성된 과제를 마켓플레이스에 등록하여 수익화하고 싶다, so that 과제 결과물로 수익을 창출할 수 있다.

#### Acceptance Criteria

1. WHEN 프로젝트가 종료되면(보고서 승인 완료), THE System SHALL "이 과제를 마켓에 등록하시겠습니까?" 팝업을 표시한다
2. WHEN 팀원이 마켓 등록을 승인하면, THE System SHALL Bedrock Claude API를 호출하여 최종 품질 리뷰 점수 기반으로 판매 가격을 자동 제안한다
3. WHEN 마켓 등록이 진행되면, THE System SHALL Bedrock Claude API를 호출하여 맛보기 요약본을 자동 생성하고 전체 본문은 비공개로 유지한다
4. THE Marketplace SHALL 과목별, 학과별 카테고리 필터 기능을 제공한다
5. THE Marketplace SHALL 인기 과제 랭킹을 품질 점수 순으로 표시한다
6. THE Marketplace SHALL 각 과제 카드에 제목, 과목명, 품질 점수, 가격, AI 요약 미리보기를 표시한다
7. WHEN 구매자가 과제를 구매하면, THE Marketplace SHALL 전체 본문, AI 리뷰 리포트, 기여도 데이터를 열람 가능하게 한다
8. THE Marketplace SHALL 판매 수익의 80%를 팀에게, 20%를 플랫폼 수수료로 배분한다
9. THE Dashboard SHALL "내 과제 수익 현황" 위젯을 표시한다

### Requirement 16: 데이터 영속성

**User Story:** As a 팀원, I want 입력한 데이터가 새로고침 후에도 유지되길 원한다, so that 작업 내용을 잃지 않는다.

#### Acceptance Criteria

1. THE System SHALL React Context API와 useReducer를 사용하여 Team_State를 전역으로 관리한다
2. WHEN Team_State가 변경되면, THE System SHALL 변경된 상태를 localStorage에 'ai-pm-agent-' 접두사를 사용하여 저장한다
3. WHEN 애플리케이션이 로드되면, THE System SHALL localStorage에서 이전에 저장된 Team_State를 복원한다

### Requirement 17: AI 판단 원칙

**User Story:** As a 개발자, I want 모든 AI 판단이 Bedrock Claude API 호출을 통해 이루어지길 원한다, so that AI가 매번 상황을 해석하여 유연한 결과를 생성한다.

#### Acceptance Criteria

1. THE System SHALL 모든 AI 판단(역할 분배, 채팅 분석, 품질 리뷰, 지연 감지, 재배분, 협상, 보고서 취합, PPT 생성, 능동적 점검, 마켓 가격 산정)을 Bedrock Claude API 호출로 수행한다
2. THE System SHALL 모든 Bedrock API 호출 프롬프트에 현재 Team_State 전체(팀원 현황, 태스크 현황, 이전 AI 제안 이력)를 포함한다
3. THE System SHALL AI 판단에 if-else 하드코딩 분기를 사용하지 않고 AI가 매번 상황을 분석하여 결과를 생성하도록 한다
4. THE System SHALL 이전 AI 제안 이력을 프롬프트에 포함하여 동일한 제안의 반복을 방지한다
5. THE System SHALL Bedrock API 응답을 JSON으로 파싱하고, 파싱 실패 시 1회 재시도를 수행하며, 재시도 실패 시 에러 폴백 UI를 표시한다
6. WHEN AI_Chat_Monitor가 감지할 내용이 없으면, THE System SHALL AI가 응답하지 않도록 한다 (불필요한 개입 방지)

### Requirement 18: API 통신 및 에러 처리

**User Story:** As a 팀원, I want API 호출 중 로딩 상태를 확인하고 에러 발생 시 명확한 안내를 받고 싶다, so that 시스템 상태를 항상 파악할 수 있다.

#### Acceptance Criteria

1. WHILE API 호출이 진행 중인 동안, THE System SHALL 로딩 인디케이터(스피너 또는 스켈레톤)를 표시한다
2. IF API 호출이 실패하면, THEN THE System SHALL 사용자 친화적인 에러 메시지를 표시한다
3. THE System SHALL 모든 API 통신에 fetch API를 사용하고 try-catch로 에러를 처리한다
4. IF Bedrock API 응답에서 JSON 코드블록 래핑(```json)이 포함되어 있으면, THEN THE System SHALL 래핑을 제거한 후 JSON 파싱을 수행한다

### Requirement 19: 기술 스택 및 배포

**User Story:** As a 개발자, I want 명확한 기술 스택과 배포 환경이 정의되길 원한다, so that 일관된 개발 환경에서 작업할 수 있다.

#### Acceptance Criteria

1. THE System SHALL 프론트엔드를 React 18, TypeScript, Tailwind CSS로 구현하고 Vite로 빌드한다
2. THE System SHALL 백엔드를 AWS Lambda (Node.js 20)로 구현하고 API Gateway REST를 통해 노출한다
3. THE System SHALL AI 기능을 Amazon Bedrock Claude Sonnet 모델로 구현한다
4. THE System SHALL AWS Amplify를 통해 프론트엔드를 자동 배포하고 URL로 즉시 접속 가능하게 한다
5. THE System SHALL PPT 생성에 reveal.js (CDN)를 사용한다
6. THE System SHALL 외부 상태관리 라이브러리 없이 React Context와 useReducer만 사용한다
7. THE System SHALL DynamoDB를 사용하지 않고 localStorage만 사용한다 (해커톤 MVP)
