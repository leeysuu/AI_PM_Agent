# Implementation Plan: AI 조별과제 PM 에이전트

## Overview

MVP 우선순위에 따라 핵심 기능부터 점진적으로 구현한다. 프론트엔드는 React 18 + TypeScript + Tailwind CSS (Vite), 백엔드는 AWS Lambda (Node.js 20) + API Gateway, AI는 Amazon Bedrock Claude를 사용한다. 각 태스크는 이전 태스크 위에 증분적으로 빌드되며, 마지막에 전체를 통합한다.

## Tasks

- [ ] 1. 프로젝트 초기 설정 및 공통 인프라
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
    - `src/context/teamReducer.ts`: SET_TEAM, UPDATE_TASK, UPDATE_REVIEW, ADD_MESSAGE, ADD_DETECTION, ADD_SUGGESTION, UPDATE_SUGGESTION, APPLY_CHANGES, ADD_ALERT, SET_REPORT, APPROVE_REPORT, SET_PPT_SLIDES, ADD_MARKET_LISTING, LOAD_FROM_STORAGE 액션 처리
    - _Requirements: 16.1, 19.6_

  - [ ] 1.4 localStorage 동기화 훅 구현 (`src/hooks/useLocalStorage.ts`)
    - `useLocalStorage<T>` 제네릭 훅 구현
    - `ai-pm-agent-` 접두사 키 사용
    - TeamProvider 내에서 상태 변경 시 자동 저장, 앱 로드 시 자동 복원
    - _Requirements: 16.2, 16.3_

  - [ ] 1.5 공통 유틸리티 구현
    - `src/utils/jsonParser.ts`: JSON 파싱 + ````json` 코드블록 래핑 제거
    - `src/utils/dateUtils.ts`: D-day 계산, 경과일 계산, 날짜 포맷팅
    - _Requirements: 18.4_

  - [ ] 1.6 공통 UI 컴포넌트 구현
    - `src/components/common/LoadingOverlay.tsx`: 로딩 스피너/스켈레톤
    - `src/components/common/ErrorMessage.tsx`: 에러 메시지 표시
    - `src/components/common/Header.tsx`: 프로젝트명, D-day, 네비게이션 탭
    - _Requirements: 18.1, 18.2_

  - [ ] 1.7 API 호출 공통 레이어 구현
    - `src/api/` 디렉토리에 각 API 함수 파일 생성 (teamApi.ts, chatApi.ts, reviewApi.ts, decisionApi.ts, mergeApi.ts, checkApi.ts)
    - fetch 기반 공통 호출 패턴: try-catch 에러 처리, 로딩 상태 관리
    - API_BASE_URL 환경변수 설정
    - _Requirements: 18.2, 18.3_

  - [ ] 1.8 App.tsx 라우팅 및 레이아웃 구성
    - TeamProvider로 앱 래핑
    - 탭 기반 네비게이션: 팀 생성, 대시보드, 채팅, 보고서, 마켓플레이스
    - _Requirements: 4.6_

- [ ] 2. Checkpoint - 프로젝트 기반 구조 확인
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. [1순위] 팀 생성 + AI 역할 분배 + AI 일정 생성
  - [ ] 3.1 팀 생성 폼 컴포넌트 구현
    - `src/components/team/TeamCreatePage.tsx`: 팀 생성 페이지 컨테이너
    - `src/components/team/ProjectInfoForm.tsx`: 프로젝트명, 마감일 입력 필드
    - `src/components/team/MemberAddForm.tsx`: 팀원 이름/학과/강점 입력 + 추가 버튼
    - `src/components/team/MemberList.tsx`: 추가된 팀원 목록 + 삭제 버튼
    - 유효성 검증: 필수 필드 누락 시 시각적 표시 + 제출 차단, 마감일 과거 날짜 차단, 최소 2명 팀원 필수
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 3.2 useTeam 커스텀 훅 구현 (`src/hooks/useTeam.ts`)
    - `createTeam(input)`: POST /api/team 호출 → 응답으로 tasks, milestones 받아 SET_TEAM dispatch
    - `updateTaskProgress(taskId, progress)`: UPDATE_TASK dispatch
    - `applyChanges(changes)`: APPLY_CHANGES dispatch
    - 로딩/에러 상태 관리
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

  - [ ] 3.3 POST /api/team Lambda 함수 구현
    - 입력: projectName, topic, deadline, members[]
    - Bedrock Claude 프롬프트 구성: 팀원 강점 + 주제 분석 → 5~8개 태스크 생성, 담당자 배정 + 배정 이유, 난이도 산정, 마감일 역산 마일스톤 생성
    - JSON 응답 파싱 (코드블록 래핑 제거 포함)
    - 실패 시 1회 재시도, 재시도 실패 시 500 에러 반환
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 17.1, 17.2, 17.3, 17.5_

  - [ ] 3.4 Bedrock 호출 공통 레이어 구현 (Lambda 공유 모듈)
    - `invokeBedrock(prompt)`: BedrockRuntimeClient + InvokeModelCommand
    - `parseAIResponse(raw)`: Bedrock 응답 구조 파싱 + JSON 코드블록 제거
    - 모델 ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`
    - _Requirements: 17.1, 17.5, 19.3_

  - [ ] 3.5 팀 생성 완료 후 대시보드 전환 연동
    - 팀 생성 성공 시 대시보드 탭으로 자동 전환
    - SET_TEAM dispatch 후 칸반보드에 태스크 표시
    - _Requirements: 3.4_

  - [ ]* 3.6 팀 생성 폼 유효성 검증 단위 테스트
    - 필수 필드 누락 시 제출 차단 테스트
    - 과거 마감일 차단 테스트
    - 팀원 2명 미만 차단 테스트
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 4. [2순위] 채팅방 + AI 대화 모니터링
  - [ ] 4.1 채팅 UI 컴포넌트 구현
    - `src/components/chat/ChatPage.tsx`: 채팅 페이지 레이아웃 (메시지 목록 + 입력 + 사이드바)
    - `src/components/chat/ChatMessageList.tsx`: 메시지 목록 렌더링 (팀원 메시지 vs AI 메시지 시각적 구분)
    - `src/components/chat/ChatInput.tsx`: 메시지 입력 필드 + 전송 버튼
    - `src/components/chat/ChatSidebar.tsx`: AI 감지 항목 요약 표시 (confidence < 0.7인 항목)
    - 발신자 이름 + 타임스탬프 표시
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 4.2 useChat 커스텀 훅 구현 (`src/hooks/useChat.ts`)
    - `sendMessage(content, senderId)`: ADD_MESSAGE dispatch → POST /api/chat 호출 → AI 응답 처리
    - confidence ≥ 0.7: AI 메시지를 채팅에 자동 추가 (의사결정/새태스크/리스크 감지 포맷)
    - confidence < 0.7: 사이드바에만 감지 결과 표시
    - 감지 없음: AI 응답 없음 (불필요한 개입 방지)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 4.3 POST /api/chat Lambda 함수 구현
    - 입력: teamState, newMessage, sender
    - Bedrock 프롬프트: 최근 20개 메시지 컨텍스트 + 팀 전체 상태 포함
    - 감지 유형: decision, newTask, risk, none
    - confidence 점수 0.0~1.0 산출
    - shouldIntervene 판단 (confidence ≥ 0.7)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 17.1, 17.2, 17.6_

  - [ ]* 4.4 채팅 메시지 전송 및 AI 응답 처리 단위 테스트
    - 메시지 전송 후 목록 추가 테스트
    - AI 감지 confidence 기반 개입/비개입 분기 테스트
    - _Requirements: 6.3, 7.5, 7.6_

- [ ] 5. [3순위] 결과물 제출 → 품질 리뷰 → 진행률 → 지연 감지 (연쇄 처리)
  - [ ] 5.1 결과물 제출 UI 구현
    - `src/components/review/WorkSubmitModal.tsx`: 태스크 카드에서 열리는 결과물 텍스트 입력 모달
    - 빈 텍스트 제출 차단 + 에러 메시지 표시
    - 제출 시 태스크 상태를 inProgress로 변경
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 5.2 AI 리뷰 결과 표시 컴포넌트 구현
    - `src/components/review/ReviewResult.tsx`: 4가지 항목별 점수 (0~25), 총점 (0~100), 개선 포인트 피드백, 진행률, 지연 severity 표시
    - _Requirements: 9.2, 9.3, 9.6_

  - [ ] 5.3 POST /api/review Lambda 함수 구현 (4단계 연쇄 처리)
    - 단일 Bedrock 호출로 STEP 1~4 처리:
      - STEP 1: 완성도/논리성/분량/주제적합성 각 25점 채점
      - STEP 2: 총점 기반 진행률 산정 (80+→90-100%, 60-79→60-89%, 40-59→30-59%, <40→0-29%)
      - STEP 3: expectedProgress vs actualProgress 갭 계산 → severity 판정 (≥20%: critical, 10-19%: warning, <10%: normal)
      - STEP 4: critical일 때 팀 전체 상황 분석 → 재배분 제안 생성
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 17.1, 17.2, 17.3_

  - [ ] 5.4 리뷰 결과 → 대시보드 연동
    - UPDATE_REVIEW dispatch: 태스크 리뷰 결과 + 진행률 업데이트
    - 재배분 제안 있을 시 ADD_SUGGESTION dispatch → Suggestion Panel에 카드 표시
    - 칸반보드 태스크 카드에 진행률 바 + 상태 뱃지 반영
    - _Requirements: 9.6, 5.2, 5.3_

  - [ ]* 5.5 연쇄 처리 응답 파싱 및 상태 업데이트 단위 테스트
    - 리뷰 점수 기반 진행률 산정 로직 테스트
    - severity 판정 로직 테스트
    - _Requirements: 9.3, 9.4_

- [ ] 6. [4순위] AI 제안 수락/거절 + 협상 대안 루프
  - [ ] 6.1 AI 제안 패널 UI 구현
    - `src/components/suggestion/AISuggestionPanel.tsx`: 제안 카드 목록 패널
    - `src/components/suggestion/SuggestionCard.tsx`: 제안 내용 + 수락/거절 버튼 + 거절 사유 입력 필드
    - `src/components/suggestion/SuggestionHistory.tsx`: 이전 제안 이력 표시
    - 거절 시 사유 필수 입력 (빈 사유 차단)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 6.2 useAISuggestion 커스텀 훅 구현 (`src/hooks/useAISuggestion.ts`)
    - `acceptSuggestion(id)`: POST /api/decision (accepted=true) → APPLY_CHANGES dispatch
    - `rejectSuggestion(id, reason)`: POST /api/decision (accepted=false) → 새 대안 수신 시 ADD_SUGGESTION dispatch
    - round > 3 시 "팀원 간 직접 논의를 권장합니다" 메시지 표시 + AI 자동 제안 중단
    - _Requirements: 10.2, 10.3, 11.4, 11.5_

  - [ ] 6.3 POST /api/decision Lambda 함수 구현
    - 수락 시: 변경사항 적용 액션 생성 (reassign_task, extend_deadline, reduce_scope, add_task, split_task)
    - 거절 시: Bedrock 호출 → 거절 사유 분석 + 이전 이력 전체 포함 → 새 대안 생성
    - 대안 전략: 다른 팀원 이관, 마감 연장, 범위 축소, 페어워크, 태스크 분할
    - 이전 거절된 제안과 동일 내용 반복 금지
    - round ≤ 3 제한
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 17.1, 17.2, 17.4_

  - [ ]* 6.4 협상 루프 라운드 제한 및 이력 관리 단위 테스트
    - 3회 초과 시 수동 조정 모드 전환 테스트
    - 거절 사유 필수 입력 검증 테스트
    - _Requirements: 11.4, 11.5, 10.4_

- [ ] 7. [5순위] 대시보드 UI 통합
  - [ ] 7.1 대시보드 메인 페이지 구현
    - `src/components/dashboard/DashboardPage.tsx`: 레이아웃 구성 (상단: 프로젝트 정보, 좌측: 칸반보드, 우측: 제안패널 + 알림)
    - 상단: 프로젝트명, D-day 카운트다운, 전체 진행률 바
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 7.2 칸반보드 컴포넌트 구현
    - `src/components/dashboard/KanbanBoard.tsx`: To Do / In Progress / Done 3컬럼 레이아웃
    - `src/components/dashboard/KanbanColumn.tsx`: 컬럼별 태스크 카드 렌더링
    - `src/components/dashboard/TaskCard.tsx`: 제목, 담당자, 마감일, 진행률 바, 난이도, 상태 뱃지(정상/지연/완료), 결과물 제출 버튼
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 7.3 마일스톤 타임라인 + 알림 타임라인 구현
    - `src/components/dashboard/MilestoneTimeline.tsx`: 주간 마일스톤 시각적 표시
    - `src/components/dashboard/AlertTimeline.tsx`: AI 알림 시간순 나열
    - _Requirements: 4.5, 4.7_

  - [ ] 7.4 대시보드 실시간 반영 연동
    - Context 상태 변경 시 칸반보드, 진행률 바, 알림 타임라인 즉시 업데이트
    - _Requirements: 4.7_

- [ ] 8. Checkpoint - 핵심 MVP 기능 통합 확인
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. [6순위] 보고서 자동 취합
  - [ ] 9.1 보고서 뷰어 UI 구현
    - `src/components/report/ReportPage.tsx`: 보고서 페이지 컨테이너
    - `src/components/report/ReportViewer.tsx`: 마크다운 형식 보고서 미리보기 + 승인/수정 요청 버튼 + 수정 피드백 입력
    - _Requirements: 12.3, 12.4_

  - [ ] 9.2 POST /api/merge Lambda 함수 구현 (보고서 병합)
    - Bedrock 호출: 전원 결과물 → 논리적 목차 구조 생성, 섹션 배치, 연결 문장 추가, 문체 통일
    - 응답: report{title, sections[]} + pptSlides[]
    - _Requirements: 12.1, 12.2, 17.1, 17.2_

  - [ ] 9.3 보고서 병합 트리거 연동
    - 전원 태스크 완료 감지 시 자동 병합 제안 표시
    - SET_REPORT dispatch → ReportViewer에 표시
    - 수정 요청 시 피드백 포함하여 POST /api/merge 재호출
    - _Requirements: 12.1, 12.3, 12.4_

  - [ ]* 9.4 보고서 병합 응답 파싱 단위 테스트
    - 섹션 구조 검증 테스트
    - _Requirements: 12.2_

- [ ] 10. [7순위] 과제 마켓플레이스
  - [ ] 10.1 마켓플레이스 UI 구현
    - `src/components/marketplace/MarketplacePage.tsx`: 마켓 메인 (카테고리 필터 + 인기 랭킹 + 과제 카드 목록)
    - `src/components/marketplace/MarketListingCard.tsx`: 제목, 과목명, 품질 점수, 가격, AI 요약 미리보기
    - 마켓 등록 팝업: 보고서 승인 후 "마켓에 등록하시겠습니까?" 확인
    - _Requirements: 15.1, 15.4, 15.5, 15.6_

  - [ ] 10.2 마켓플레이스 로직 구현
    - 등록 시 Bedrock 호출: 품질 점수 기반 가격 자동 산정 + 맛보기 요약본 생성
    - 구매 시 전체 본문 + AI 리뷰 리포트 + 기여도 데이터 열람
    - 수익 배분: 팀 80% / 플랫폼 20%
    - ADD_MARKET_LISTING dispatch
    - _Requirements: 15.2, 15.3, 15.7, 15.8_

  - [ ] 10.3 대시보드 "내 과제 수익 현황" 위젯 추가
    - 판매 건수, 총 수익, 배분 현황 표시
    - _Requirements: 15.9_

  - [ ]* 10.4 마켓플레이스 필터 및 카드 렌더링 단위 테스트
    - 카테고리 필터 동작 테스트
    - 과제 카드 정보 표시 테스트
    - _Requirements: 15.4, 15.6_

- [ ] 11. Checkpoint - 확장 기능 통합 확인
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. [8순위] PPT 자동 생성
  - [ ] 12.1 PPT 뷰어 UI 구현
    - `src/components/report/PPTPreview.tsx`: reveal.js 기반 HTML 프레젠테이션 미리보기 + 다운로드 버튼
    - _Requirements: 13.3, 13.4_

  - [ ] 12.2 PPT 생성 유틸리티 구현 (`src/utils/pptGenerator.ts`)
    - PPTSlide[] → reveal.js HTML 문자열 변환
    - 슬라이드별: 제목 + 핵심 내용 + 키워드 + 발표자 노트
    - reveal.js CDN 링크 포함
    - _Requirements: 13.1, 13.2, 19.5_

  - [ ] 12.3 보고서 승인 → PPT 생성 연동
    - APPROVE_REPORT dispatch 후 POST /api/merge 응답의 pptSlides 활용
    - SET_PPT_SLIDES dispatch → PPTPreview에 표시
    - _Requirements: 13.1_

  - [ ]* 12.4 PPT HTML 생성 유틸리티 단위 테스트
    - reveal.js HTML 구조 검증 테스트
    - _Requirements: 13.2, 13.3_

- [ ] 13. [9순위] AI 능동적 알림
  - [ ] 13.1 GET /api/check Lambda 함수 구현
    - Bedrock 호출: 마감 임박(D-3, D-1), 3일 이상 미업데이트 태스크, 전원 완료 여부 점검
    - 응답: alerts[], triggerMerge(boolean), aiChatMessage
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 17.1_

  - [ ] 13.2 능동적 알림 프론트엔드 연동
    - checkApi.runCheck() 호출 (수동 트리거 또는 페이지 로드 시)
    - ADD_ALERT dispatch → AlertTimeline에 표시
    - triggerMerge=true 시 보고서 병합 플로우 트리거
    - 독촉/축하 메시지 → Team_Chat에 AI 메시지로 추가
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 13.3 알림 생성 및 표시 단위 테스트
    - 알림 타입별 표시 테스트
    - _Requirements: 14.1, 14.2, 14.3_

- [ ] 14. 최종 통합 및 배포 설정
  - [ ] 14.1 전체 컴포넌트 통합 및 탭 네비게이션 완성
    - 모든 페이지 간 전환 동작 확인
    - Context 상태가 모든 컴포넌트에 올바르게 전파되는지 확인
    - localStorage 저장/복원 전체 플로우 확인
    - _Requirements: 4.6, 4.7, 16.2, 16.3_

  - [ ] 14.2 Lambda 함수 배포 설정
    - 각 Lambda 함수 패키징 (6개 엔드포인트)
    - API Gateway REST 엔드포인트 매핑
    - Bedrock 접근 IAM 권한 설정
    - _Requirements: 19.2, 19.3_

  - [ ] 14.3 AWS Amplify 프론트엔드 배포 설정
    - `amplify.yml` 빌드 설정
    - 환경변수 (API_BASE_URL) 설정
    - _Requirements: 19.4_

- [ ] 15. Final Checkpoint - 전체 통합 및 배포 확인
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- MVP 우선순위: 1순위(팀생성+역할+일정) → 2순위(채팅+모니터링) → 3순위(리뷰연쇄) → 4순위(수락/거절+협상) → 5순위(대시보드) → 6순위(보고서) → 7순위(마켓) → 8순위(PPT) → 9순위(알림)
- 모든 AI 판단은 Bedrock Claude API 호출로 수행하며 하드코딩 분기 없음 (Requirement 17)
- 각 Lambda 함수는 동일한 패턴: 프롬프트 구성 → Bedrock 호출 → JSON 파싱 → 에러 핸들링
- Checkpoints ensure incremental validation at key integration points

