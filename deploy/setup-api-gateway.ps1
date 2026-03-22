# API Gateway REST API 생성 + Lambda 연결 (Windows PowerShell)

$ErrorActionPreference = "Stop"

$Region = "us-east-1"
$ApiName = "ai-pm-agent-api"
$StageName = "prod"

# AWS 계정 ID 조회
$AccountId = aws sts get-caller-identity --query 'Account' --output text
Write-Host "📌 AWS Account ID: $AccountId" -ForegroundColor Cyan

# 1. REST API 생성
Write-Host "🔧 API Gateway 생성 중: $ApiName" -ForegroundColor Cyan
$ApiId = aws apigateway create-rest-api `
  --name $ApiName `
  --description "AI PM Agent API" `
  --endpoint-configuration types=REGIONAL `
  --region $Region `
  --query 'id' --output text

Write-Host "✅ API ID: $ApiId" -ForegroundColor Green

# 루트 리소스 ID
$RootId = aws apigateway get-resources `
  --rest-api-id $ApiId `
  --region $Region `
  --query 'items[?path==`/`].id' --output text

# /api 리소스
$ApiResourceId = aws apigateway create-resource `
  --rest-api-id $ApiId `
  --parent-id $RootId `
  --path-part "api" `
  --region $Region `
  --query 'id' --output text

function New-Endpoint {
  param(
    [string]$ParentId,
    [string]$PathPart,
    [string]$LambdaName,
    [string]$NestedPath = ""
  )

  $ResourceId = ""

  if ($NestedPath) {
    # 중첩 리소스 (예: points/settle)
    $AllResources = aws apigateway get-resources --rest-api-id $ApiId --region $Region --output json | ConvertFrom-Json
    $MidResource = $AllResources.items | Where-Object { $_.pathPart -eq $PathPart -and $_.parentId -eq $ParentId }

    if (-not $MidResource) {
      $MidId = aws apigateway create-resource `
        --rest-api-id $ApiId `
        --parent-id $ParentId `
        --path-part $PathPart `
        --region $Region `
        --query 'id' --output text
    } else {
      $MidId = $MidResource.id
    }

    $ResourceId = aws apigateway create-resource `
      --rest-api-id $ApiId `
      --parent-id $MidId `
      --path-part $NestedPath `
      --region $Region `
      --query 'id' --output text
  } else {
    $ResourceId = aws apigateway create-resource `
      --rest-api-id $ApiId `
      --parent-id $ParentId `
      --path-part $PathPart `
      --region $Region `
      --query 'id' --output text
  }

  $LambdaArn = "arn:aws:lambda:${Region}:${AccountId}:function:${LambdaName}"
  $IntegrationUri = "arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations"

  # POST 메서드
  aws apigateway put-method `
    --rest-api-id $ApiId `
    --resource-id $ResourceId `
    --http-method POST `
    --authorization-type NONE `
    --region $Region --no-cli-pager | Out-Null

  aws apigateway put-integration `
    --rest-api-id $ApiId `
    --resource-id $ResourceId `
    --http-method POST `
    --type AWS_PROXY `
    --integration-http-method POST `
    --uri $IntegrationUri `
    --region $Region --no-cli-pager | Out-Null

  # OPTIONS (CORS)
  aws apigateway put-method `
    --rest-api-id $ApiId `
    --resource-id $ResourceId `
    --http-method OPTIONS `
    --authorization-type NONE `
    --region $Region --no-cli-pager | Out-Null

  aws apigateway put-integration `
    --rest-api-id $ApiId `
    --resource-id $ResourceId `
    --http-method OPTIONS `
    --type MOCK `
    --request-templates '{\"application/json\": \"{\\\"statusCode\\\": 200}\"}' `
    --region $Region --no-cli-pager | Out-Null

  aws apigateway put-method-response `
    --rest-api-id $ApiId `
    --resource-id $ResourceId `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters '{\"method.response.header.Access-Control-Allow-Headers\":false,\"method.response.header.Access-Control-Allow-Methods\":false,\"method.response.header.Access-Control-Allow-Origin\":false}' `
    --region $Region --no-cli-pager | Out-Null

  aws apigateway put-integration-response `
    --rest-api-id $ApiId `
    --resource-id $ResourceId `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters '{\"method.response.header.Access-Control-Allow-Headers\":\"''Content-Type''\",\"method.response.header.Access-Control-Allow-Methods\":\"''POST,OPTIONS''\",\"method.response.header.Access-Control-Allow-Origin\":\"''*''\"}' `
    --region $Region --no-cli-pager | Out-Null

  # Lambda 실행 권한
  $Timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  aws lambda add-permission `
    --function-name $LambdaName `
    --statement-id "apigateway-${LambdaName}-${Timestamp}" `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:${Region}:${AccountId}:${ApiId}/*" `
    --region $Region --no-cli-pager 2>$null | Out-Null

  Write-Host "  ✅ $LambdaName → POST 연결 완료" -ForegroundColor Green
}

# 3. 엔드포인트 생성
Write-Host "🔗 엔드포인트 연결 중..." -ForegroundColor Cyan

New-Endpoint -ParentId $ApiResourceId -PathPart "team" -LambdaName "ai-pm-team"
New-Endpoint -ParentId $ApiResourceId -PathPart "chat" -LambdaName "ai-pm-chat"
New-Endpoint -ParentId $ApiResourceId -PathPart "review" -LambdaName "ai-pm-review"
New-Endpoint -ParentId $ApiResourceId -PathPart "decision" -LambdaName "ai-pm-decision"
New-Endpoint -ParentId $ApiResourceId -PathPart "merge" -LambdaName "ai-pm-merge"
New-Endpoint -ParentId $ApiResourceId -PathPart "check" -LambdaName "ai-pm-check"
New-Endpoint -ParentId $ApiResourceId -PathPart "points" -LambdaName "ai-pm-points-settle" -NestedPath "settle"
New-Endpoint -ParentId $ApiResourceId -PathPart "points" -LambdaName "ai-pm-points-predict" -NestedPath "predict"

# 4. 배포
Write-Host "🚀 API 배포 중: $StageName" -ForegroundColor Cyan
aws apigateway create-deployment `
  --rest-api-id $ApiId `
  --stage-name $StageName `
  --region $Region --no-cli-pager | Out-Null

$ApiUrl = "https://${ApiId}.execute-api.${Region}.amazonaws.com/${StageName}"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "🎉 API Gateway 배포 완료!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "API URL: $ApiUrl"
Write-Host ""
Write-Host "엔드포인트:"
Write-Host "  POST $ApiUrl/api/team"
Write-Host "  POST $ApiUrl/api/chat"
Write-Host "  POST $ApiUrl/api/review"
Write-Host "  POST $ApiUrl/api/decision"
Write-Host "  POST $ApiUrl/api/merge"
Write-Host "  POST $ApiUrl/api/check"
Write-Host "  POST $ApiUrl/api/points/settle"
Write-Host "  POST $ApiUrl/api/points/predict"
Write-Host ""
Write-Host "📋 다음 단계:"
Write-Host "  1. Amplify 환경변수: VITE_API_BASE_URL=$ApiUrl"
Write-Host "  2. 로컬 개발: .env 파일에 VITE_API_BASE_URL=$ApiUrl"
Write-Host "==========================================" -ForegroundColor Green
