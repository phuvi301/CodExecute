# Build Docker Container Sandbox Image and Deploy to AWS Lambda

param (
    [string]$AWS_ACCOUNT_ID = "",
    [string]$AWS_REGION = "ap-southeast-1",
    [string]$ECR_REPO_NAME = "codexecute-lambda-worker",
    [string]$LAMBDA_FUNCTION_NAME = "codeexecute-worker"
)

$ErrorActionPreference = "Stop"

Write-Host "Checking AWS CLI..." -ForegroundColor Cyan
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    throw "AWS CLI is not installed."
}

Write-Host "Checking Docker..." -ForegroundColor Cyan
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker is not installed."
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker daemon is not running. Please start Docker Desktop."
}

if ([string]::IsNullOrWhiteSpace($AWS_ACCOUNT_ID)) {
    $AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text).Trim()
}

$ECR_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Dùng latest hoặc thay bằng timestamp/git commit nếu muốn versioning
$IMAGE_TAG = "${ECR_URI}/${ECR_REPO_NAME}:latest"

Write-Host "Checking ECR Repository..." -ForegroundColor Cyan

aws ecr describe-repositories `
    --repository-names $ECR_REPO_NAME `
    --region $AWS_REGION *> $null

if ($LASTEXITCODE -ne 0) {

    Write-Host "Repository does not exist. Creating..." -ForegroundColor Yellow

    aws ecr create-repository `
        --repository-name $ECR_REPO_NAME `
        --region $AWS_REGION *> $null
}

Write-Host "1. Login to ECR..." -ForegroundColor Green

aws ecr get-login-password --region $AWS_REGION |
docker login --username AWS --password-stdin $ECR_URI

Write-Host "2. Building Docker image..." -ForegroundColor Green

docker buildx build `
    --platform linux/amd64 `
    --provenance=false `
    --sbom=false `
    --load `
    -t $ECR_REPO_NAME `
    -f Dockerfile.lambda .

Write-Host "3. Tagging image..." -ForegroundColor Green

docker tag "${ECR_REPO_NAME}:latest" $IMAGE_TAG

Write-Host "4. Pushing image..." -ForegroundColor Green

docker push $IMAGE_TAG

Write-Host "5. Updating Lambda..." -ForegroundColor Green

aws lambda update-function-code `
    --function-name $LAMBDA_FUNCTION_NAME `
    --image-uri $IMAGE_TAG `
    --region $AWS_REGION *> $null

Write-Host "Waiting for Lambda update..." -ForegroundColor Cyan

aws lambda wait function-updated `
    --function-name $LAMBDA_FUNCTION_NAME `
    --region $AWS_REGION

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green