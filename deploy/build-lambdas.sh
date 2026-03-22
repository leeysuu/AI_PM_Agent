#!/bin/bash
# Lambda 함수 빌드 스크립트
# 각 Lambda를 esbuild로 번들링하여 zip 파일 생성

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$SCRIPT_DIR/dist"

# 빌드 디렉토리 초기화
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# esbuild 설치 확인
if ! command -v npx &> /dev/null; then
  echo "❌ npx가 필요합니다. Node.js를 설치해주세요."
  exit 1
fi

LAMBDAS=(
  "team"
  "chat"
  "review"
  "decision"
  "merge"
  "check"
  "points-settle"
  "points-predict"
)

for LAMBDA in "${LAMBDAS[@]}"; do
  echo "📦 빌드 중: ai-pm-${LAMBDA}"
  
  LAMBDA_DIR="$PROJECT_ROOT/lambda/${LAMBDA}"
  OUT_DIR="$BUILD_DIR/ai-pm-${LAMBDA}"
  
  mkdir -p "$OUT_DIR"
  
  # esbuild로 번들링 (외부 의존성 없이 단일 파일로)
  npx esbuild "$LAMBDA_DIR/index.ts" \
    --bundle \
    --platform=node \
    --target=node20 \
    --outfile="$OUT_DIR/index.mjs" \
    --format=esm \
    --external:@aws-sdk/client-bedrock-runtime \
    --minify
  
  # zip 생성
  cd "$OUT_DIR"
  zip -j "$BUILD_DIR/ai-pm-${LAMBDA}.zip" index.mjs
  cd "$SCRIPT_DIR"
  
  echo "✅ ai-pm-${LAMBDA}.zip 생성 완료"
done

echo ""
echo "🎉 모든 Lambda 빌드 완료! dist/ 디렉토리를 확인하세요."
echo "   총 ${#LAMBDAS[@]}개 함수 빌드됨"
