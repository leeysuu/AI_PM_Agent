#!/bin/bash
# API Gateway REST API 생성 + Lambda 연결 스크립트
# 해커톤 환경: us-east-1, SafeRole-{USERNAME}

set -e

REGION="us-east-1"
API_NAME="ai-pm-agent-api"
STAGE_NAME="prod"

# ⚠️ 본인의 AWS 계정 ID로 변경하세요
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
echo "📌 AWS Account ID: $ACCOUNT_ID"

# 1. REST API 생성
echo "🔧 API Gateway 생성 중: $API_NAME"
API_ID=$(aws apigateway create-rest-api \
  --name "$API_NAME" \
  --description "AI PM Agent API" \
  --endpoint-configuration types=REGIONAL \
  --region "$REGION" \
  --query 'id' --output text)

echo "✅ API ID: $API_ID"

# 루트 리소스 ID 조회
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query 'items[?path==`/`].id' --output text)

# 2. /api 리소스 생성
API_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id "$API_ID" \
  --parent-id "$ROOT_ID" \
  --path-part "api" \
  --region "$REGION" \
  --query 'id' --output text)

# 헬퍼 함수: 리소스 + POST 메서드 + Lambda 통합 + CORS
create_endpoint() {
  local PARENT_ID=$1
  local PATH_PART=$2
  local LAMBDA_NAME=$3
  local NESTED_PATH=$4  # 선택적: 중첩 경로 (예: points/settle)

  if [ -n "$NESTED_PATH" ]; then
    # 중첩 리소스 생성 (예: /api/points)
    local MID_ID
    MID_ID=$(aws apigateway get-resources \
      --rest-api-id "$API_ID" \
      --region "$REGION" \
      --query "items[?pathPart==\`$PATH_PART\`].id" --output text 2>/dev/null)
    
    if [ -z "$MID_ID" ] || [ "$MID_ID" = "None" ]; then
      MID_ID=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$PARENT_ID" \
        --path-part "$PATH_PART" \
        --region "$REGION" \
        --query 'id' --output text)
    fi

    RESOURCE_ID=$(aws apigateway create-resource \
      --rest-api-id "$API_ID" \
      --parent-id "$MID_ID" \
      --path-part "$NESTED_PATH" \
      --region "$REGION" \
      --query 'id' --output text)
  else
    RESOURCE_ID=$(aws apigateway create-resource \
      --rest-api-id "$API_ID" \
      --parent-id "$PARENT_ID" \
      --path-part "$PATH_PART" \
      --region "$REGION" \
      --query 'id' --output text)
  fi

  local LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${LAMBDA_NAME}"
  local INTEGRATION_URI="arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"

  # POST 메서드
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method POST \
    --authorization-type NONE \
    --region "$REGION" --no-cli-pager

  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "$INTEGRATION_URI" \
    --region "$REGION" --no-cli-pager

  # OPTIONS (CORS preflight)
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region "$REGION" --no-cli-pager

  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
    --region "$REGION" --no-cli-pager

  aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}' \
    --region "$REGION" --no-cli-pager

  aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'POST,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' \
    --region "$REGION" --no-cli-pager

  # Lambda 실행 권한 부여
  aws lambda add-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "apigateway-${LAMBDA_NAME}-$(date +%s)" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
    --region "$REGION" --no-cli-pager 2>/dev/null || true

  echo "  ✅ ${LAMBDA_NAME} → POST 연결 완료"
}

# 3. 엔드포인트 생성
echo "🔗 엔드포인트 연결 중..."

create_endpoint "$API_RESOURCE_ID" "team" "ai-pm-team"
create_endpoint "$API_RESOURCE_ID" "chat" "ai-pm-chat"
create_endpoint "$API_RESOURCE_ID" "review" "ai-pm-review"
create_endpoint "$API_RESOURCE_ID" "decision" "ai-pm-decision"
create_endpoint "$API_RESOURCE_ID" "merge" "ai-pm-merge"
create_endpoint "$API_RESOURCE_ID" "check" "ai-pm-check"
create_endpoint "$API_RESOURCE_ID" "points" "ai-pm-points-settle" "settle"
create_endpoint "$API_RESOURCE_ID" "points" "ai-pm-points-predict" "predict"

# 4. 배포
echo "🚀 API 배포 중: $STAGE_NAME"
aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE_NAME" \
  --region "$REGION" --no-cli-pager

API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}"

echo ""
echo "=========================================="
echo "🎉 API Gateway 배포 완료!"
echo "=========================================="
echo "API URL: $API_URL"
echo ""
echo "엔드포인트:"
echo "  POST $API_URL/api/team"
echo "  POST $API_URL/api/chat"
echo "  POST $API_URL/api/review"
echo "  POST $API_URL/api/decision"
echo "  POST $API_URL/api/merge"
echo "  POST $API_URL/api/check"
echo "  POST $API_URL/api/points/settle"
echo "  POST $API_URL/api/points/predict"
echo ""
echo "📋 다음 단계:"
echo "  1. Amplify 환경변수에 추가: VITE_API_BASE_URL=$API_URL"
echo "  2. 또는 로컬 개발: echo 'VITE_API_BASE_URL=$API_URL' > .env"
echo "=========================================="
