#!/bin/bash

echo "🚀 Setting up local development environment..."

# Wait for LocalStack to be ready
echo "⏳ Waiting for LocalStack..."
until curl -s http://localhost:4566/health > /dev/null; do
  sleep 2
done

# Wait for DynamoDB Local to be ready
echo "⏳ Waiting for DynamoDB Local..."
until curl -s http://localhost:8000 > /dev/null; do
  sleep 2
done

echo "✅ Services are ready!"

# Create S3 bucket
echo "📦 Creating S3 bucket..."
aws --endpoint-url=http://localhost:4566 s3 mb s3://dms-dev-docs --region us-east-1

# Create DynamoDB tables
echo "🗄️ Creating DynamoDB tables..."

# Documents table
aws dynamodb create-table \
  --endpoint-url http://localhost:8000 \
  --table-name dms-dev-documents \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Audit table
aws dynamodb create-table \
  --endpoint-url http://localhost:8000 \
  --table-name dms-dev-role-audits \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Create Cognito User Pool (mock)
echo "👤 Setting up Cognito (mock)..."
aws --endpoint-url=http://localhost:4566 cognito-idp create-user-pool \
  --pool-name dms-local-pool \
  --region us-east-1

echo "🎉 Local development environment setup complete!"
echo ""
echo "📋 Services:"
echo "  - API: http://localhost:3001"
echo "  - Web: http://localhost:3000"
echo "  - LocalStack: http://localhost:4566"
echo "  - DynamoDB: http://localhost:8000"
echo ""
echo "🔧 To start development:"
echo "  docker-compose up -d"
