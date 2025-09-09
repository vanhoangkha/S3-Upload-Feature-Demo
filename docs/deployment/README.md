# Deployment Guide

## Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.6
- Node.js 20+
- Docker
- Make

## Initial Setup (One-time)

### 1. Setup Terraform Backend

```bash
make setup
```

This creates:
- S3 bucket for Terraform state
- DynamoDB table for state locking

### 2. Configure Environment Variables

Copy and customize environment files:

```bash
# Infrastructure
cp infra/envs/dev/terraform.tfvars.example infra/envs/dev/terraform.tfvars

# Web application  
cp web/.env.example web/.env.local
```

## Deployment Process

### Full Deployment (Recommended)

Deploy everything in correct order:

```bash
make deploy ENV=dev
```

This runs:
1. `make infra-apply ENV=dev` - Deploy infrastructure
2. `make api-deploy ENV=dev` - Build and deploy API
3. `make web-deploy ENV=dev` - Build and deploy frontend

### Individual Component Deployment

#### Infrastructure Only
```bash
make infra-init ENV=dev
make infra-plan ENV=dev  # Review changes
make infra-apply ENV=dev
```

#### API Only
```bash
make api-install
make api-build
make api-deploy ENV=dev
```

#### Frontend Only
```bash
make web-install
make web-build
make web-deploy ENV=dev
```

## Environment Management

### Create New Environment

```bash
make create-env ENV=staging
```

This creates a new environment directory with template files.

### Deploy to Different Environments

```bash
# Development
make deploy ENV=dev

# Staging
make deploy ENV=stg

# Production
make deploy ENV=prod
```

## Configuration

### Infrastructure Variables

Edit `infra/envs/{ENV}/terraform.tfvars`:

```hcl
region   = "us-east-1"
app_name = "dms"
env      = "dev"

cognito_callback_urls = [
  "https://your-domain.com/auth/callback"
]

cognito_logout_urls = [
  "https://your-domain.com/auth/logout"
]
```

### Frontend Environment Variables

The web deployment script automatically creates `.env` from Terraform outputs:

```bash
VITE_API_BASE_URL=https://api-gateway-url/v1
VITE_COGNITO_DOMAIN=https://cognito-domain.auth.us-east-1.amazoncognito.com
VITE_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
VITE_REGION=us-east-1
```

## Verification

### Check Deployment Status

```bash
make status ENV=dev
```

### Get Application URLs

```bash
make infra-output ENV=dev
```

Look for:
- `cloudfront_domain` - Frontend URL
- `api_base_url` - API endpoint
- `cognito_domain` - Authentication URL

### Test API Endpoints

```bash
# Health check (no auth required)
curl https://your-api-gateway-url/v1/health

# Test with authentication
curl -H "Authorization: Bearer $JWT_TOKEN" \
     https://your-api-gateway-url/v1/me
```

## Monitoring

### View Logs

```bash
# API Lambda logs
make logs-api ENV=dev

# Specific function logs
aws logs tail /aws/lambda/dms-dev-createDocument --follow
```

### CloudWatch Dashboards

Access via AWS Console:
- Lambda function metrics
- API Gateway metrics  
- DynamoDB metrics
- S3 metrics

## Troubleshooting

### Common Issues

#### 1. Lambda Function Not Found
```bash
# Check if functions exist
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `dms-dev-`)].FunctionName'

# Redeploy infrastructure if missing
make infra-apply ENV=dev
```

#### 2. API Gateway 403 Errors
- Check JWT token is valid and not expired
- Verify Cognito configuration
- Check API Gateway authorizer settings

#### 3. S3 Upload Failures
- Verify presigned URL generation
- Check S3 bucket permissions
- Ensure KMS key permissions

#### 4. Frontend Build Failures
```bash
# Clear node_modules and reinstall
cd web
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Debug Commands

```bash
# Check Terraform state
cd infra/envs/dev && terraform show

# Validate Terraform configuration
cd infra/envs/dev && terraform validate

# Check AWS credentials
aws sts get-caller-identity

# Test Lambda function locally
cd api && npm run dev
```

## Rollback Procedures

### Infrastructure Rollback

```bash
# Rollback to previous Terraform state
cd infra/envs/prod
terraform apply -target=module.lambda_functions
```

### API Rollback

```bash
# Deploy previous Docker image
# Update image tag in Lambda console or via CLI
aws lambda update-function-code \
  --function-name dms-prod-createDocument \
  --image-uri $ECR_REPO:previous-tag
```

### Frontend Rollback

```bash
# Restore from backup
aws s3 sync s3://backup-bucket/web-backup/ s3://dms-prod-web/
aws cloudfront create-invalidation --distribution-id $CF_DIST --paths "/*"
```

## Security Considerations

### Secrets Management

- Never commit secrets to Git
- Use AWS Secrets Manager for sensitive data
- Rotate access keys regularly

### Access Control

- Use least-privilege IAM policies
- Enable MFA for AWS accounts
- Regularly audit user permissions

### Monitoring

- Enable CloudTrail for audit logging
- Set up CloudWatch alarms for errors
- Monitor unusual access patterns

## Performance Optimization

### Lambda Optimization

- Use provisioned concurrency for critical functions
- Optimize container image size
- Monitor cold start metrics

### DynamoDB Optimization

- Monitor read/write capacity metrics
- Use on-demand billing for variable workloads
- Optimize query patterns

### S3 Optimization

- Enable S3 Transfer Acceleration if needed
- Use appropriate storage classes
- Monitor request patterns

## Cost Management

### Cost Monitoring

```bash
# Check current costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

### Cost Optimization

- Use S3 lifecycle policies
- Monitor Lambda execution duration
- Review DynamoDB capacity settings
- Clean up unused resources

## Backup and Recovery

### Automated Backups

- DynamoDB: Point-in-time recovery enabled
- S3: Versioning enabled
- Infrastructure: Terraform state in S3

### Manual Backup

```bash
# Export DynamoDB table
aws dynamodb export-table-to-point-in-time \
  --table-arn arn:aws:dynamodb:us-east-1:123456789012:table/dms-prod-documents \
  --s3-bucket dms-backups

# Backup S3 bucket
aws s3 sync s3://dms-prod-docs/ s3://dms-backups/docs/
```
