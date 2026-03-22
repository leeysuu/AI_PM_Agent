# Lambda 함수 배포 스크립트 (Windows PowerShell)
# AWS CLI를 사용하여 Lambda 함수 생성 또는 업데이트

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BuildDir = Join-Path $ScriptDir "dist"
$Region = "us-east-1"
$Runtime = "nodejs20.x"
$Timeout = 60
$Memory = 256

# ⚠️ 본인의 username으로 변경하세요
$RoleName = "SafeRole-{USERNAME}"

# IAM Role ARN 조회
Write-Host "🔍 IAM Role 조회 중: $RoleName" -ForegroundColor Cyan
$RoleArn = aws iam get-role --role-name $RoleName --query 'Role.Arn' --output text 2>$null

if (-not $RoleArn) {
  Write-Host "❌ IAM Role을 찾을 수 없습니다: $RoleName" -ForegroundColor Red
  Write-Host "   해커톤 안내에 따라 SafeRole-{username} 형식의 역할을 사용하세요."
  exit 1
}

Write-Host "✅ Role ARN: $RoleArn" -ForegroundColor Green

$Lambdas = @(
  "ai-pm-team",
  "ai-pm-chat",
  "ai-pm-review",
  "ai-pm-decision",
  "ai-pm-merge",
  "ai-pm-check",
  "ai-pm-points-settle",
  "ai-pm-points-predict"
)

foreach ($FuncName in $Lambdas) {
  $ZipFile = Join-Path $BuildDir "$FuncName.zip"

  if (-not (Test-Path $ZipFile)) {
    Write-Host "⚠️ $FuncName.zip 파일이 없습니다. build-lambdas.ps1을 먼저 실행하세요." -ForegroundColor Yellow
    continue
  }

  Write-Host "🚀 배포 중: $FuncName" -ForegroundColor Cyan

  # 함수 존재 여부 확인
  $Exists = $false
  try {
    aws lambda get-function --function-name $FuncName --region $Region 2>$null | Out-Null
    $Exists = $true
  } catch {}

  if ($Exists) {
    # 기존 함수 업데이트
    aws lambda update-function-code `
      --function-name $FuncName `
      --zip-file "fileb://$ZipFile" `
      --region $Region `
      --no-cli-pager | Out-Null

    # 설정 업데이트 전 잠시 대기
    Start-Sleep -Seconds 2

    aws lambda update-function-configuration `
      --function-name $FuncName `
      --timeout $Timeout `
      --memory-size $Memory `
      --region $Region `
      --no-cli-pager | Out-Null

    Write-Host "  ✅ 업데이트 완료" -ForegroundColor Green
  } else {
    # 새 함수 생성
    aws lambda create-function `
      --function-name $FuncName `
      --runtime $Runtime `
      --role $RoleArn `
      --handler "index.handler" `
      --zip-file "fileb://$ZipFile" `
      --timeout $Timeout `
      --memory-size $Memory `
      --region $Region `
      --environment "Variables={AWS_REGION=$Region}" `
      --no-cli-pager | Out-Null

    Write-Host "  ✅ 생성 완료 (5초 대기...)" -ForegroundColor Green
    Start-Sleep -Seconds 5
  }
}

Write-Host ""
Write-Host "🎉 모든 Lambda 배포 완료!" -ForegroundColor Green
