# AI 로직 / 프롬프트 태스크

> tasks.md에서 **Bedrock Claude 호출, 프롬프트 구성, AI 응답 파싱** 등 AI 관련 Lambda 함수 구현 태스크만 추출한 파일.

## Tasks

### 3. 팀 생성 — AI 역할 분배 + 일정 생성

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

### 4. 채팅 — AI 대화 모니터링

- [ ] 4.3 POST /api/chat Lambda 함수 구현
  - 입력: teamState, newMessage, sender
  - Bedrock 프롬프트: 최근 20개 메시지 컨텍스트 + 팀 전체 상태 포함
  - 감지 유형: decision, newTask, risk, none
  - confidence 점수 0.0~1.0 산출
  - shouldIntervene 판단 (confidence ≥ 0.7)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 17.1, 17.2, 17.6_

### 5. 결과물 리뷰 — AI 4단계 연쇄 처리

- [ ] 5.3 POST /api/review Lambda 함수 구현 (4단계 연쇄 처리)
  - 단일 Bedrock 호출로 STEP 1~4 처리:
    - STEP 1: 완성도/논리성/분량/주제적합성 각 25점 채점
    - STEP 2: 총점 기반 진행률 산정 (80+→90-100%, 60-79→60-89%, 40-59→30-59%, <40→0-29%)
    - STEP 3: expectedProgress vs actualProgress 갭 계산 → severity 판정 (≥20%: critical, 10-19%: warning, <10%: normal)
    - STEP 4: critical일 때 팀 전체 상황 분석 → 재배분 제안 생성
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 17.1, 17.2, 17.3_

### 6. 협상 — AI 대안 생성 루프

- [ ] 6.3 POST /api/decision Lambda 함수 구현
  - 수락 시: 변경사항 적용 액션 생성 (reassign_task, extend_deadline, reduce_scope, add_task, split_task)
  - 거절 시: Bedrock 호출 → 거절 사유 분석 + 이전 이력 전체 포함 → 새 대안 생성
  - 대안 전략: 다른 팀원 이관, 마감 연장, 범위 축소, 페어워크, 태스크 분할
  - 이전 거절된 제안과 동일 내용 반복 금지
  - round ≤ 3 제한
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 17.1, 17.2, 17.4_

### 9. 보고서 — AI 병합 + PPT 생성

- [ ] 9.2 POST /api/merge Lambda 함수 구현 (보고서 병합)
  - Bedrock 호출: 전원 결과물 → 논리적 목차 구조 생성, 섹션 배치, 연결 문장 추가, 문체 통일
  - 응답: report{title, sections[]} + pptSlides[]
  - _Requirements: 12.1, 12.2, 17.1, 17.2_

### 10. 마켓플레이스 — AI 가격 산정 + 요약 생성

- [ ] 10.2 마켓플레이스 로직 구현 (AI 호출 부분)
  - 등록 시 Bedrock 호출: 품질 점수 기반 가격 자동 산정 + 맛보기 요약본 생성
  - _Requirements: 15.2, 15.3_

### 13. AI 능동적 알림

- [ ] 13.1 GET /api/check Lambda 함수 구현
  - Bedrock 호출: 마감 임박(D-3, D-1), 3일 이상 미업데이트 태스크, 전원 완료 여부 점검
  - 응답: alerts[], triggerMerge(boolean), aiChatMessage
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 17.1_

## 요약: Lambda 엔드포인트 ↔ AI 역할 매핑

| Lambda 엔드포인트 | AI 역할 | 프롬프트 핵심 |
|---|---|---|
| POST /api/team | 역할 분배 + 일정 생성 | 팀원 강점 + 주제 → 태스크/마일스톤 JSON |
| POST /api/chat | 대화 모니터링 | 최근 20개 메시지 → 감지 유형 + confidence |
| POST /api/review | 품질 리뷰 + 연쇄 처리 | 결과물 → 채점 → 진행률 → 지연 → 재배분 |
| POST /api/decision | 협상 대안 생성 | 거절 사유 + 이력 → 새 대안 (최대 3회) |
| POST /api/merge | 보고서 병합 + PPT | 전원 결과물 → 목차 + 섹션 + 슬라이드 |
| GET /api/check | 능동적 점검 | 팀 상태 → 알림 + 독촉/축하 메시지 |

## 공통 의존성

- **Bedrock 호출 공통 레이어** (3.4): 모든 Lambda 함수가 공유
  - `invokeBedrock(prompt)` → BedrockRuntimeClient
  - `parseAIResponse(raw)` → JSON 코드블록 제거 + 파싱
  - 모델: `anthropic.claude-3-5-sonnet-20241022-v2:0`
  - 에러 핸들링: 1회 재시도, 재시도 실패 시 500 반환
