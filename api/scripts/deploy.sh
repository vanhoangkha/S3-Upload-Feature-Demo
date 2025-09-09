#!/bin/bash
set -e

ENV=${1:-dev}
REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Deploying API to environment: $ENV"

# Get ECR repository URL from Terraform
cd ../infra/envs/$ENV
ECR_REPO=$(terraform output -raw ecr_repository_url)
cd ../../../api

echo "ECR Repository: $ECR_REPO"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO

# Build and tag image
docker build -t dms-api:$ENV .
docker tag dms-api:$ENV $ECR_REPO:latest

# Push to ECR
docker push $ECR_REPO:latest

echo "Image pushed to ECR successfully"

# Update Lambda functions
FUNCTIONS=(
    "createDocument"
    "getDocument" 
    "listDocuments"
    "updateDocument"
    "deleteDocument"
    "restoreDocument"
    "listVersions"
    "presignUpload"
    "presignDownload"
    "whoAmI"
    "adminListUsers"
    "adminCreateUser"
    "adminUpdateRoles"
    "adminSignOut"
    "adminAudits"
    "preTokenGeneration"
)

for func in "${FUNCTIONS[@]}"; do
    echo "Updating Lambda function: dms-$ENV-$func"
    aws lambda update-function-code \
        --function-name "dms-$ENV-$func" \
        --image-uri "$ECR_REPO:latest" \
        --region $REGION || echo "Warning: Failed to update $func"
done

echo "API deployment completed successfully!"
