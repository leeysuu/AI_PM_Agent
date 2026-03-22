#!/bin/bash
# Lambda 함수 배포 스크립트
# AWS CLI를 사용하여 Lambda 함수 생성 또는 업데이트

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/dist"
REGION="us-east-1"
RUNTIME="nodejs20.x"
TIMEOUT=60
MEMORY=256

# ⚠️ 본인의 username으로 변경하세요
ROLE_NAME="SafeRole-{USERNAME}"

# IAM Role ARN 조회
echo "🔍 IAM Role 조회 중: $ROLE_NAME"
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null)

if [ -z "$ROLE_ARN" ]; then
  echo "❌ IAM Role을 찾을 수 없습니다: $ROLE_NAME"
  echo "   해커톤 안내에 따라 SafeRole-{username} 형식의 역할을 사용하세요."
  exit 1
fi

echo "✅ Role ARN: $ROLE_ARN"

LAMBDAS=(
  "ai-pm-team"
  "ai-pm-chat"
  "ai-pm-review"
  "ai-pm-decision"
  "ai-pm-merge"
  "ai-pm-check"
  "ai-pm-points-settle"
  "ai-pm-points-predict"
)

for FUNC_NAME in "${LAMBDAS[@]}"; do
  ZIP_FILE="$BUILD_DIR/${FUNC_NAME}.zip"
  
  if [ ! -f "$ZIP_FILE" ]; then
    echo "⚠️ ${FUNC_NAME}.zip 파일이 없습니다. build-lambdas.sh를 먼저 실행하세요."
    continue
  fi
  
  echo "🚀 배포 중: $FUNC_NAME"
  
  # 함수 존재 여부 확인
  if aws lambda get-function --function-name "$FUNC_NAME" --region "$REGION" &>/dev/null; then
    # 기존 함수 업데이트
    aws lambda update-function-code \
      --function-name "$FUNC_NAME" \
      --zip-file "fileb://$ZIP_FILE" \
      --region "$REGION" \
      --no-cli-pager
    
    aws lambda update-function-configuration \
      --function-name "$FUNC_NAME" \
      --timeout "$TIMEOUT" \
      --memory-size "$MEMORY" \
      --region "$REGION" \
      --no-cli-pager
    
    echo "  ✅ 업데이트 완료"
  else
    # 새 함수 생성
    aws lambda create-function \
      --function-name "$FUNC_NAME" \
      --runtime "$RUNTIME" \
      --role "$ROLE_ARN" \
      --handler "index.handler" \
      --zip-file "fileb://$ZIP_FILE" \
      --timeout "$TIMEOUT" \
      --memory-size "$MEMORY" \
      --region "$REGION" \
      --environment "Variables={AWS_REGION=$REGION}" \
      --no-cli-pager
    
    echo "  ✅ 생성 완료 (5초 대기...)"
    sleep 5
  fi
done

echo ""
echo "🎉 모든 Lambda 배포 완료!"
