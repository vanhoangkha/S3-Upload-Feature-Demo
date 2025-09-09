# 🚀 AWS Deployment Guide - Document Management System

## Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.6
- Node.js 20+
- Docker
- Make

## 🔧 Initial Setup

### 1. Configure AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID, Secret, Region (us-east-1), and output format (json)
```

### 2. Setup Terraform Backend
```bash
make setup
```

## 🏗️ Infrastructure Deployment

### 1. Initialize Terraform
```bash
make infra-init ENV=dev
```

### 2. Configure Environment Variables
```bash
cd infra/envs/dev
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Deploy Infrastructure
```bash
make infra-apply ENV=dev
```

This deploys:
- **Cognito User Pool** with RBAC roles
- **API Gateway** with JWT authorization
- **Lambda functions** (containerized)
- **S3 buckets** with KMS encryption
- **DynamoDB** with streams
- **CloudFront** with WAF
- **CloudTrail** with audit logging
- **ECR repositories**
- **KMS keys** for encryption

## 🚀 API Deployment

### 1. Build and Push Container
```bash
# Install dependencies
cd api && npm install

# Build TypeScript
npm run build

# Build and push Docker image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

docker build -t dms-api .
docker tag dms-api:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
```

### 2. Update Lambda Functions
```bash
# Update all Lambda functions with new image
aws lambda update-function-code --function-name dms-dev-createDocument --image-uri $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
aws lambda update-function-code --function-name dms-dev-listDocuments --image-uri $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
aws lambda update-function-code --function-name dms-dev-getDocument --image-uri $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
aws lambda update-function-code --function-name dms-dev-updateDocument --image-uri $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
aws lambda update-function-code --function-name dms-dev-deleteDocument --image-uri $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
aws lambda update-function-code --function-name dms-dev-presignUpload --image-uri $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
aws lambda update-function-code --function-name dms-dev-presignDownload --image-uri $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
aws lambda update-function-code --function-name dms-dev-adminListUsers --image-uri $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
aws lambda update-function-code --function-name dms-dev-adminCreateUser --image-uri $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
aws lambda update-function-code --function-name dms-dev-adminUpdateUserRoles --image-uri $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
aws lambda update-function-code --function-name dms-dev-adminAudits --image-uri $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
aws lambda update-function-code --function-name dms-dev-getMe --image-uri $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/dms-dev-api:latest
```

## 🌐 Frontend Deployment

### 1. Get Infrastructure Outputs
```bash
cd infra/envs/dev
terraform output -json > ../../../web/.env.production
```

### 2. Build and Deploy Frontend
```bash
cd web
npm install
npm run build

# Deploy to S3
aws s3 sync dist/ s3://dms-dev-web --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id $(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='dms-dev-web'].Id" --output text) --paths "/*"
```

## 🔐 Post-Deployment Configuration

### 1. Create Admin User
```bash
# Get User Pool ID
USER_POOL_ID=$(aws cognito-idp list-user-pools --max-items 10 --query "UserPools[?Name=='dms-dev-user-pool'].Id" --output text)

# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

# Add admin to Admin group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --group-name Admin
```

### 2. Get Application URL
```bash
cd infra/envs/dev
terraform output cloudfront_domain
```

## 🧪 Testing Deployment

### 1. Health Check
```bash
# Test API Gateway
API_URL=$(cd infra/envs/dev && terraform output -raw api_gateway_url)
curl $API_URL/health

# Test CloudFront
CLOUDFRONT_URL=$(cd infra/envs/dev && terraform output -raw cloudfront_domain)
curl https://$CLOUDFRONT_URL
```

### 2. Authentication Test
1. Visit CloudFront URL
2. Click "Sign In"
3. Use admin credentials created above
4. Verify RBAC functionality

## 📊 Monitoring & Logs

### View Logs
```bash
# API Gateway logs
aws logs tail /aws/apigateway/dms-dev-api --follow

# Lambda function logs
aws logs tail /aws/lambda/dms-dev-createDocument --follow

# CloudTrail logs
aws logs tail /aws/cloudtrail/dms-dev-trail --follow
```

### CloudWatch Dashboards
- Navigate to CloudWatch Console
- View custom dashboards for API, Lambda, and DynamoDB metrics

## 🔄 Updates & Maintenance

### Update Infrastructure
```bash
make infra-plan ENV=dev
make infra-apply ENV=dev
```

### Update API
```bash
cd api
npm run build
# Rebuild and push Docker image (steps above)
```

### Update Frontend
```bash
cd web
npm run build
aws s3 sync dist/ s3://dms-dev-web --delete
# Invalidate CloudFront cache (step above)
```

## 🚨 Troubleshooting

### Common Issues

1. **Lambda Cold Starts**
   - Check provisioned concurrency settings
   - Monitor duration metrics

2. **API Gateway 403 Errors**
   - Verify JWT token in Authorization header
   - Check Cognito user groups

3. **S3 Access Denied**
   - Verify IAM roles and policies
   - Check S3 bucket policies

4. **CloudFront Cache Issues**
   - Create invalidation for updated files
   - Check cache behaviors

### Debug Commands
```bash
# Check Lambda function status
aws lambda get-function --function-name dms-dev-createDocument

# View API Gateway configuration
aws apigatewayv2 get-api --api-id $(aws apigatewayv2 get-apis --query "Items[?Name=='dms-dev-api'].ApiId" --output text)

# Test presigned URLs
curl -X POST $API_URL/files/presign/upload \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"filename":"test.pdf","contentType":"application/pdf"}'
```

## 🔒 Security Features Enabled

- ✅ **KMS Encryption**: All data encrypted at rest
- ✅ **WAF Protection**: CloudFront with managed rules
- ✅ **CloudTrail**: Complete audit logging
- ✅ **IAM Least Privilege**: Minimal required permissions
- ✅ **VPC Security**: Private subnets for Lambda
- ✅ **TLS 1.2+**: HTTPS only communication
- ✅ **DDoS Protection**: CloudFront Shield Standard

## 📈 Production Deployment

For production deployment:

1. Change `ENV=prod` in all commands
2. Update `terraform.tfvars` with production values
3. Enable additional monitoring and alerting
4. Configure backup strategies
5. Set up CI/CD pipeline

```bash
# Production deployment
make infra-apply ENV=prod
# Follow same steps with ENV=prod
```

---
**🎯 Your DMS is now deployed and running on AWS with enterprise-grade security!**
