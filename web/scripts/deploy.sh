#!/bin/bash
set -e

ENV=${1:-dev}
REGION="us-east-1"

echo "Deploying web application to environment: $ENV"

# Get S3 bucket and CloudFront distribution from Terraform
cd ../infra/envs/$ENV
S3_BUCKET=$(terraform output -raw web_bucket_name)
CF_DIST=$(terraform output -raw cloudfront_distribution_id)
API_BASE_URL=$(terraform output -raw api_base_url)
COGNITO_DOMAIN=$(terraform output -raw cognito_domain)
USER_POOL_ID=$(terraform output -raw user_pool_id)
USER_POOL_CLIENT_ID=$(terraform output -raw user_pool_client_id)
cd ../../../web

echo "S3 Bucket: $S3_BUCKET"
echo "CloudFront Distribution: $CF_DIST"

# Create .env file for build
cat > .env << EOF
VITE_API_BASE_URL=$API_BASE_URL
VITE_COGNITO_DOMAIN=$COGNITO_DOMAIN
VITE_USER_POOL_ID=$USER_POOL_ID
VITE_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
VITE_REGION=$REGION
EOF

echo "Environment variables configured"

# Build the application
npm run build

echo "Application built successfully"

# Deploy to S3
aws s3 sync dist/ s3://$S3_BUCKET/ --delete --region $REGION

echo "Files uploaded to S3"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
    --distribution-id $CF_DIST \
    --paths "/*" \
    --region $REGION

echo "CloudFront cache invalidated"
echo "Web deployment completed successfully!"
echo "Application URL: https://$(aws cloudfront get-distribution --id $CF_DIST --query 'Distribution.DomainName' --output text)"
