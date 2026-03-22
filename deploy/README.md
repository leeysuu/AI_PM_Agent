# AI PM 에이전트 — AWS 배포 가이드

## 아키텍처

```
[Amplify] → 프론트엔드 (React + Vite)
[API Gateway REST] → /api/{proxy+} → Lambda 함수 8개
[Lambda] → Amazon Bedrock Claude 3.5 Sonnet
```

## 리소스 목록

| 리소스 | 이름 | 리전 |
|--------|------|------|
| Amplify App | ai-pm-agent | us-east-1 |
| API Gateway | ai-pm-agent-api | us-east-1 |
| Lambda × 8 | ai-pm-{team,chat,review,decision,merge,check,points-settle,points-predict} | us-east-1 |
| IAM Role | SafeRole-{username} (기존) | - |

## 배포 순서

### 1단계: Lambda 함수 배포
```bash
# 각 Lambda 폴더에서 빌드 후 zip 업로드
cd deploy
./build-lambdas.sh
./deploy-lambdas.sh
```

### 2단계: API Gateway 설정
```bash
./setup-api-gateway.sh
```

### 3단계: Amplify 프론트엔드 배포
1. AWS Console → Amplify → 새 앱 → Git 리포지토리 연결
2. 빌드 설정: `amplify.yml` 자동 감지
3. 환경 변수: `VITE_API_BASE_URL` = API Gateway URL

## 환경 변수

| 변수 | 값 | 위치 |
|------|-----|------|
| `VITE_API_BASE_URL` | `https://{api-id}.execute-api.us-east-1.amazonaws.com/prod` | Amplify 환경변수 |
| `AWS_REGION` | `us-east-1` | Lambda 기본 |
