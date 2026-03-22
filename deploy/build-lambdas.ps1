# Lambda 함수 빌드 스크립트 (Windows PowerShell)
# 각 Lambda를 esbuild로 번들링하여 zip 파일 생성

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BuildDir = Join-Path $ScriptDir "dist"

# 빌드 디렉토리 초기화
if (Test-Path $BuildDir) { Remove-Item -Recurse -Force $BuildDir }
New-Item -ItemType Directory -Path $BuildDir | Out-Null

$Lambdas = @(
  "team",
  "chat",
  "review",
  "decision",
  "merge",
  "check",
  "points-settle",
  "points-predict"
)

foreach ($Lambda in $Lambdas) {
  $FuncName = "ai-pm-$Lambda"
  Write-Host "📦 빌드 중: $FuncName" -ForegroundColor Cyan

  $LambdaDir = Join-Path $ProjectRoot "lambda" $Lambda
  $OutDir = Join-Path $BuildDir $FuncName

  New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

  # esbuild로 번들링
  npx esbuild "$LambdaDir/index.ts" `
    --bundle `
    --platform=node `
    --target=node20 `
    --outfile="$OutDir/index.mjs" `
    --format=esm `
    --external:@aws-sdk/client-bedrock-runtime `
    --minify

  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ $FuncName 빌드 실패" -ForegroundColor Red
    exit 1
  }

  # zip 생성 (PowerShell 내장)
  $ZipPath = Join-Path $BuildDir "$FuncName.zip"
  Compress-Archive -Path "$OutDir/index.mjs" -DestinationPath $ZipPath -Force

  Write-Host "✅ $FuncName.zip 생성 완료" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 모든 Lambda 빌드 완료! dist/ 디렉토리를 확인하세요." -ForegroundColor Green
Write-Host "   총 $($Lambdas.Count)개 함수 빌드됨"
