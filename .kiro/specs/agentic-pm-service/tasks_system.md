# 시스템 / 인프라 / UI 태스크

> tasks.md에서 프론트엔드 UI, 상태관리, 유틸리티, 훅, API 레이어, 배포 설정 등 **AI 프롬프트/Bedrock 호출을 포함하지 않는** 태스크만 추출한 파일.

## Tasks

### 1. 프로젝트 초기 설정 및 공통 인프라

- [ ] 1.1 Vite + React 18 + TypeScript + Tailwind CSS 프로젝트 생성 및 설정
  - `vite create` 로 React + TypeScript 템플릿 생성
  - `tailwind.config.js`, `postcss.config.js` 설정
  - `tsconfig.json`에 `strict: true` 설정
  - _Requirements: 19.1_

- [ ] 1.2 TypeScript 데이터 모델 정의 (`src/types/index.ts`)
  - Team, Member, Task, Milestone, ChatMessage, AISuggestion, Review, Alert, Report, ReportSection, PPTSlide, MarketListing, AppliedChange 인터페이스 정의
  - TeamAction 유니온 타입 정의
  - _Requirements: 16.1_

- [ ] 1.3 React Context + useReducer 전역 상태 관리 구현
  - `src/context/TeamContext.tsx`: TeamContext, TeamProvider 생성
  - `src/context/teamReducer.ts`: 전체 액션 처리
  - _Requirements: 16.1, 19.6_

- [ ] 1.4 localStorage 동기화 훅 구현 (`src/hooks/useLocalStorage.ts`)
  - `useLocalStorage<T>` 제네릭 훅 구현
  - `ai-pm-agent-` 접두사 키 사용
  - _Requirements: 16.2, 16.3_

- [ ] 1.5 공통 유틸리티 구현
  - `src/utils/jsonParser.ts`: JSON 파싱 + 코드블록 래핑 제거
  - `src/utils/dateUtils.ts`: D-day 계산, 경과일 계산, 날짜 포맷팅
  - _Requirements: 18.4_

- [ ] 1.6 공통 UI 컴포넌트 구현
  - `src/components/common/LoadingOverlay.tsx`: 로딩 스피너/스켈레톤
  - `src/components/common/ErrorMessage.tsx`: 에러 메시지 표시
  - `src/components/common/Header.tsx`: 프로젝트명, D-day, 네비게이션 탭
  - _Requirements: 18.1, 18.2_

- [ ] 1.7 API 호출 공통 레이어 구현
  - `src/api/` 디렉토리에 각 API 함수 파일 생성 (teamApi, chatApi, reviewApi, decisionApi, mergeApi, checkApi)
  - fetch 기반 공통 호출 패턴: try-catch 에러 처리, 로딩 상태 관리
  - API_BASE_URL 환경변수 설정
  - _Requirements: 18.2, 18.3_

- [ ] 1.8 App.tsx 라우팅 및 레이아웃 구성
  - TeamProvider로 앱 래핑
  - 탭 기반 네비게이션: 팀 생성, 대시보드, 채팅, 보고서, 마켓플레이스
  - _Requirements: 4.6_

### 2. Checkpoint - 프로젝트 기반 구조 확인

- [ ] 2. Ensure all tests pass, ask the user if questions arise.

### 3. 팀 생성 (UI + 훅 + 연동)

- [ ] 3.1 팀 생성 폼 컴포넌트 구현
  - TeamCreatePage, ProjectInfoForm, MemberAddForm, MemberList
  - 유효성 검증: 필수 필드 누락 시각적 표시 + 제출 차단, 과거 마감일 차단, 최소 2명 팀원 필수
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3.2 useTeam 커스텀 훅 구현 (`src/hooks/useTeam.ts`)
  - `createTeam(input)`: POST /api/team 호출 → SET_TEAM dispatch
  - `updateTaskProgress(taskId, progress)`: UPDATE_TASK dispatch
  - `applyChanges(changes)`: APPLY_CHANGES dispatch
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [ ] 3.5 팀 생성 완료 후 대시보드 전환 연동
  - 팀 생성 성공 시 대시보드 탭으로 자동 전환
  - _Requirements: 3.4_

- [ ] 3.6 팀 생성 폼 유효성 검증 단위 테스트
  - 필수 필드 누락 시 제출 차단 / 과거 마감일 차단 / 팀원 2명 미만 차단
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

### 4. 채팅방 (UI + 훅)

- [ ] 4.1 채팅 UI 컴포넌트 구현
  - ChatPage, ChatMessageList, ChatInput, ChatSidebar
  - 팀원 메시지 vs AI 메시지 시각적 구분, 발신자 이름 + 타임스탬프
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4.2 useChat 커스텀 훅 구현 (`src/hooks/useChat.ts`)
  - `sendMessage(content, senderId)`: ADD_MESSAGE dispatch → POST /api/chat 호출 → AI 응답 처리
  - confidence 기반 개입/비개입 분기 로직
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 4.4 채팅 메시지 전송 및 AI 응답 처리 단위 테스트
  - 메시지 전송 후 목록 추가 / confidence 기반 분기 테스트
  - _Requirements: 6.3, 7.5, 7.6_

### 5. 결과물 제출 + 리뷰 (UI + 연동)

- [ ] 5.1 결과물 제출 UI 구현
  - WorkSubmitModal: 결과물 텍스트 입력 모달, 빈 텍스트 차단
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 5.2 AI 리뷰 결과 표시 컴포넌트 구현
  - ReviewResult: 항목별 점수, 총점, 피드백, 진행률, severity 표시
  - _Requirements: 9.2, 9.3, 9.6_

- [ ] 5.4 리뷰 결과 → 대시보드 연동
  - UPDATE_REVIEW dispatch, ADD_SUGGESTION dispatch, 칸반보드 반영
  - _Requirements: 9.6, 5.2, 5.3_

- [ ] 5.5 연쇄 처리 응답 파싱 및 상태 업데이트 단위 테스트
  - 진행률 산정 로직 / severity 판정 로직 테스트
  - _Requirements: 9.3, 9.4_

### 6. AI 제안 수락/거절 (UI + 훅)

- [ ] 6.1 AI 제안 패널 UI 구현
  - AISuggestionPanel, SuggestionCard, SuggestionHistory
  - 거절 시 사유 필수 입력 (빈 사유 차단)
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 6.2 useAISuggestion 커스텀 훅 구현 (`src/hooks/useAISuggestion.ts`)
  - acceptSuggestion / rejectSuggestion / round > 3 수동 조정 모드
  - _Requirements: 10.2, 10.3, 11.4, 11.5_

- [ ] 6.4 협상 루프 라운드 제한 및 이력 관리 단위 테스트
  - 3회 초과 수동 조정 전환 / 거절 사유 필수 입력 검증
  - _Requirements: 11.4, 11.5, 10.4_

### 7. 대시보드 UI 통합

- [ ] 7.1 대시보드 메인 페이지 구현
  - DashboardPage 레이아웃, 프로젝트 정보, D-day, 전체 진행률 바
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7.2 칸반보드 컴포넌트 구현
  - KanbanBoard, KanbanColumn, TaskCard
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7.3 마일스톤 타임라인 + 알림 타임라인 구현
  - MilestoneTimeline, AlertTimeline
  - _Requirements: 4.5, 4.7_

- [ ] 7.4 대시보드 실시간 반영 연동
  - Context 상태 변경 시 즉시 업데이트
  - _Requirements: 4.7_

### 8. Checkpoint - 핵심 MVP 기능 통합 확인

- [ ] 8. Ensure all tests pass, ask the user if questions arise.

### 9. 보고서 (UI + 연동)

- [ ] 9.1 보고서 뷰어 UI 구현
  - ReportPage, ReportViewer (마크다운 미리보기 + 승인/수정 요청)
  - _Requirements: 12.3, 12.4_

- [ ] 9.3 보고서 병합 트리거 연동
  - 전원 완료 감지 → 병합 제안 표시, SET_REPORT dispatch, 수정 요청 재호출
  - _Requirements: 12.1, 12.3, 12.4_

- [ ] 9.4 보고서 병합 응답 파싱 단위 테스트
  - 섹션 구조 검증 테스트
  - _Requirements: 12.2_

### 10. 마켓플레이스 (UI + 연동)

- [ ] 10.1 마켓플레이스 UI 구현
  - MarketplacePage, MarketListingCard, 마켓 등록 팝업
  - _Requirements: 15.1, 15.4, 15.5, 15.6_

- [ ] 10.2 마켓플레이스 로직 구현 (프론트엔드 연동 부분)
  - ADD_MARKET_LISTING dispatch, 구매 시 열람 로직, 수익 배분 표시
  - _Requirements: 15.7, 15.8_

- [ ] 10.3 대시보드 "내 과제 수익 현황" 위젯 추가
  - 판매 건수, 총 수익, 배분 현황 표시
  - _Requirements: 15.9_

- [ ] 10.4 마켓플레이스 필터 및 카드 렌더링 단위 테스트
  - 카테고리 필터 / 과제 카드 정보 표시 테스트
  - _Requirements: 15.4, 15.6_

### 11. Checkpoint - 확장 기능 통합 확인

- [ ] 11. Ensure all tests pass, ask the user if questions arise.

### 12. PPT (UI + 유틸리티 + 연동)

- [ ] 12.1 PPT 뷰어 UI 구현
  - PPTPreview: reveal.js 기반 미리보기 + 다운로드 버튼
  - _Requirements: 13.3, 13.4_

- [ ] 12.2 PPT 생성 유틸리티 구현 (`src/utils/pptGenerator.ts`)
  - PPTSlide[] → reveal.js HTML 문자열 변환
  - _Requirements: 13.1, 13.2, 19.5_

- [ ] 12.3 보고서 승인 → PPT 생성 연동
  - APPROVE_REPORT dispatch → SET_PPT_SLIDES dispatch
  - _Requirements: 13.1_

- [ ] 12.4 PPT HTML 생성 유틸리티 단위 테스트
  - reveal.js HTML 구조 검증 테스트
  - _Requirements: 13.2, 13.3_

### 13. 능동적 알림 (프론트엔드 연동)

- [ ] 13.2 능동적 알림 프론트엔드 연동
  - checkApi.runCheck() 호출, ADD_ALERT dispatch, triggerMerge 처리, 독촉/축하 메시지 추가
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 13.3 알림 생성 및 표시 단위 테스트
  - 알림 타입별 표시 테스트
  - _Requirements: 14.1, 14.2, 14.3_

### 14. 최종 통합 및 배포 설정

- [ ] 14.1 전체 컴포넌트 통합 및 탭 네비게이션 완성
  - 모든 페이지 간 전환, Context 전파, localStorage 플로우 확인
  - _Requirements: 4.6, 4.7, 16.2, 16.3_

- [ ] 14.2 Lambda 함수 배포 설정 (인프라)
  - 각 Lambda 함수 패키징 (6개 엔드포인트)
  - API Gateway REST 엔드포인트 매핑
  - Bedrock 접근 IAM 권한 설정
  - _Requirements: 19.2, 19.3_

- [ ] 14.3 AWS Amplify 프론트엔드 배포 설정
  - `amplify.yml` 빌드 설정
  - 환경변수 (API_BASE_URL) 설정
  - _Requirements: 19.4_

### 15. Final Checkpoint

- [ ] 15. Ensure all tests pass, ask the user if questions arise.
