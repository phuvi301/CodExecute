#!/usr/bin/env bash

set -euo pipefail

AWS_ACCOUNT_ID="${1:-}"
AWS_REGION="${2:-ap-southeast-1}"
ECR_REPO_NAME="${3:-codexecute-lambda-worker}"
LAMBDA_FUNCTION_NAME="${4:-codeexecute-worker}"

echo "Checking AWS CLI..."
command -v aws >/dev/null 2>&1 || {
    echo "AWS CLI is not installed."
    exit 1
}

echo "Checking Docker..."
command -v docker >/dev/null 2>&1 || {
    echo "Docker is not installed."
    exit 1
}

docker info >/dev/null 2>&1 || {
    echo "Docker daemon is not running."
    exit 1
}

if [ -z "$AWS_ACCOUNT_ID" ]; then
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
fi

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_TAG="${ECR_URI}/${ECR_REPO_NAME}:latest"

echo "Checking ECR repository..."

if ! aws ecr describe-repositories \
    --repository-names "${ECR_REPO_NAME}" \
    --region "${AWS_REGION}" >/dev/null 2>&1
then
    echo "Repository does not exist. Creating..."

    aws ecr create-repository \
        --repository-name "${ECR_REPO_NAME}" \
        --region "${AWS_REGION}" >/dev/null
fi

echo "1. Login to ECR..."

aws ecr get-login-password --region "${AWS_REGION}" |
docker login \
    --username AWS \
    --password-stdin "${ECR_URI}"

echo "2. Building Docker image..."

docker buildx build \
    --platform linux/amd64 \
    --provenance=false \
    --sbom=false \
    --load \
    -t "${ECR_REPO_NAME}" \
    -f Dockerfile.lambda .

echo "3. Tagging image..."

docker tag \
    "${ECR_REPO_NAME}:latest" \
    "${IMAGE_TAG}"

echo "4. Pushing image..."

docker push "${IMAGE_TAG}"

echo "5. Updating Lambda..."

aws lambda update-function-code \
    --function-name "${LAMBDA_FUNCTION_NAME}" \
    --image-uri "${IMAGE_TAG}" \
    --region "${AWS_REGION}" >/dev/null

echo "Waiting for Lambda update..."

aws lambda wait function-updated \
    --function-name "${LAMBDA_FUNCTION_NAME}" \
    --region "${AWS_REGION}"

echo ""
echo "Deployment completed successfully!"