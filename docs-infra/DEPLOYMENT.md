# Document Management System - Deployment Guide

This guide walks you through deploying the complete Document Management System infrastructure using Terraform.

## 📋 Prerequisites

### Required Tools

- **AWS CLI** (configured with appropriate permissions)
- **Terraform** >= 1.0
- **Node.js** >= 18.x
- **npm** >= 8.x

### AWS Permissions

Your AWS credentials need the following permissions:

- S3 (full access for bucket creation and management)
- DynamoDB (full access for table creation and management)
- Lambda (full access for function creation and deployment)
- API Gateway (full access for API creation)
- Cognito (full access for user pool management)
- IAM (full access for role and policy creation)
- CloudWatch (logs creation and management)

## 🚀 Deployment

### Manual Deployment

If you prefer manual control over each step:

#### Step 1: Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your specific values
```

Key variables to configure:

```hcl
# Basic Configuration
aws_region = "us-east-1"
environment = "dev"
project_name = "docs-management"

# S3 Configuration
s3_bucket_suffix = "2026"  # Make this unique

# CORS Configuration
cors_allowed_origins = [
  "http://localhost:3000",
  "https://yourdomain.com"  # Add your domain if applicable
]
```

#### Step 2: Build API Package

```bash
cd ../docs-api
npm install
npm run build:lambda
cd ../docs-infra
```

#### Step 3: Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

#### Step 4: Configure Applications

Extract outputs and update application configurations:

```bash
# Get API configuration
terraform output api_env_config

# Get UI configuration
terraform output ui_env_config

# Get AWS Amplify configuration
terraform output aws_exports_config
```

Manually update:

- `docs-api/.env`
- `docs-ui/.env`
- `docs-ui/src/aws-exports.js`

#### Step 5: Deploy React Application (Optional)

```bash
cd ../docs-ui
npm install
npm run build

# Upload to S3 (if using S3 for static hosting)
aws s3 sync build/ s3://YOUR_WEB_BUCKET_NAME --delete
```

## 🏗️ Infrastructure Components

The Terraform configuration creates:

### Core Services

- **S3 Buckets**: Document storage and web hosting
- **DynamoDB Tables**: Document metadata and general data
- **Lambda Function**: HonoJS API backend
- **API Gateway**: REST API endpoint
- **Cognito**: User authentication and authorization

### Security & Access

- **IAM Roles**: Lambda execution with minimal required permissions
- **S3 Bucket Policies**: Secure access controls
- **Cognito Policies**: User-based S3 access
- **CORS Configuration**: Cross-origin resource sharing

### Monitoring & Logging

- **CloudWatch Log Groups**: API and Lambda logs
- **API Gateway Logging**: Request/response logging

## 🔧 Configuration Options

### Environment Variables

#### docs-api Configuration

```bash
AWS_REGION=us-east-1
DOCUMENTS_TABLE_NAME=Documents
GENERAL_TABLE_NAME=General
DOCUMENT_STORE_BUCKET_NAME=vibdmsstore2026
WEB_STORE_BUCKET_NAME=vibdmswebstore2026
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
NODE_ENV=production
PRESIGNED_URL_EXPIRY=3600
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.cloudfront.net
```

#### docs-ui Configuration

```bash
REACT_APP_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/api
REACT_APP_ENV=production
REACT_APP_DEFAULT_USER_ID=demo-user
```

## 📊 Outputs

After deployment, Terraform provides:

```bash
# View all outputs
terraform output

# Specific outputs
terraform output api_gateway_url
terraform output cognito_user_pool_id
```

Key outputs include:

- **API URL**: API Gateway endpoint
- **Cognito Details**: User pool and client IDs
- **S3 Buckets**: Document and web storage bucket names
- **DynamoDB Tables**: Table names for application use

## 🔍 Post-Deployment Verification

### Test Infrastructure

1. **API Health Check**:

   ```bash
   curl https://your-api-url/health
   ```

2. **Frontend Access**:
   Visit the CloudFront distribution URL

3. **Cognito Setup**:
   Create test users in the Cognito User Pool

### Application Testing

1. **User Registration**: Test user signup flow
2. **Document Upload**: Test file upload functionality
3. **Document Management**: Test CRUD operations
4. **Authentication**: Test login/logout flows

## 🛠️ Troubleshooting

### Common Issues

#### Lambda Deployment Package Missing

```bash
cd docs-api
npm run build:lambda
```

#### S3 Bucket Name Conflicts

Update `s3_bucket_suffix` in `terraform.tfvars` to a unique value.

#### CORS Issues

Ensure your domain is included in `cors_allowed_origins` variable.

### Debugging

- Check CloudWatch logs for Lambda errors
- Review API Gateway logs for request issues
- Verify IAM permissions for access issues

## 🗑️ Cleanup

To destroy all resources:

```bash
# Destroy infrastructure
terraform destroy

# Clean up local files
rm -f terraform.tfstate*
rm -f tfplan
rm -rf .terraform/
```

## 🔒 Security Best Practices

1. **Environment Separation**: Use different AWS accounts for dev/staging/prod
2. **Secret Management**: Consider AWS Secrets Manager for sensitive values
3. **Access Control**: Regularly review IAM permissions
4. **Monitoring**: Set up CloudWatch alarms for critical metrics
5. **Backup**: Enable point-in-time recovery for DynamoDB in production

## 📚 Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [HonoJS Documentation](https://hono.dev/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
