# 🚀 Document Management System (DMS)

Production-ready serverless document management system with RBAC, built on AWS.

## 🏗️ Architecture

- **Identity**: Amazon Cognito User Pool with RBAC (Admin/Vendor/User)
- **API**: API Gateway HTTP API + Lambda (Node.js 20, TypeScript, Container)
- **Storage**: S3 (documents) + DynamoDB (metadata) + KMS encryption
- **Frontend**: React + AWS Cloudscape Design System
- **Infrastructure**: Terraform (100% us-east-1)
- **Observability**: CloudTrail + CloudWatch + DynamoDB Streams → Firehose → Athena

## 🔐 Role-Based Access Control

- **Admin**: Full system access, user management, audit logs
- **Vendor**: Access to vendor's documents and users  
- **User**: Access to own documents only

## 📁 Project Structure

```
S3-Upload-Feature-Demo/
├── infra/                    # 🏗️ Terraform Infrastructure
│   ├── modules/             # Reusable modules (cognito, apigw, lambda, etc.)
│   └── envs/               # Environment configs (dev/stg/prod)
├── api/                     # 🚀 Lambda Backend (TypeScript)
│   ├── src/
│   │   ├── handlers/       # Lambda function handlers
│   │   └── lib/           # Shared libraries (auth, db, s3, etc.)
│   ├── tests/              # Unit & integration tests
│   └── Dockerfile          # Container image for ECR
├── web/                     # 🎨 React Frontend
│   ├── src/
│   │   ├── components/     # Cloudscape components
│   │   ├── pages/         # Application pages
│   │   ├── contexts/      # React contexts (auth, etc.)
│   │   └── lib/          # API client, utilities
│   └── public/            # Static assets
├── docs/                    # 📖 Documentation
│   ├── api/                # OpenAPI specifications
│   ├── architecture/       # Architecture diagrams
│   └── deployment/         # Deployment guides
├── Makefile                # 🛠️ Build & deployment automation
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured with us-east-1 access
- Terraform >= 1.6
- Node.js 20+
- Docker & Docker Compose
- Make

### 🌩️ **AWS Deployment (Production)**
```bash
# One-command deployment
./deploy.sh dev

# Or follow detailed guide
# See DEPLOY.md for complete AWS deployment instructions
```

### 🐳 Local Development (Docker Compose)
```bash
# Start full local development environment
make dev-up

# Access applications
# Web: http://localhost:3000
# API: http://localhost:3001/v1

# Stop environment
make dev-down
```

### ☁️ AWS Deployment

### 1. Setup Backend Infrastructure
```bash
# Setup Terraform backend (one-time)
make setup

# Initialize and deploy infrastructure
make infra-init ENV=dev
make infra-apply ENV=dev
```

### 2. Deploy API
```bash
# Install dependencies and build
make api-install
make api-build ENV=dev

# Deploy to Lambda
make api-deploy ENV=dev
```

### 3. Deploy Frontend
```bash
# Install dependencies and build
make web-install
make web-build

# Deploy to S3 + CloudFront
make web-deploy ENV=dev
```

### 4. Access Application
```bash
# Get application URL
make infra-output ENV=dev
# Look for 'cloudfront_domain' output
```

## 📋 API Endpoints

### Document Management
- `GET /files` - List documents (with filtering, pagination)
- `POST /files` - Create document metadata
- `GET /files/{id}` - Get document details
- `PATCH /files/{id}` - Update document (name, tags)
- `DELETE /files/{id}` - Soft delete document
- `POST /files/{id}/restore` - Restore deleted document
- `GET /files/{id}/versions` - List document versions

### File Operations
- `POST /files/presign/upload` - Get presigned upload URL
- `POST /files/presign/download` - Get presigned download URL

### User Management (Admin Only)
- `GET /admin/users` - List users
- `POST /admin/users` - Create user
- `POST /admin/users/{id}/roles` - Update user roles
- `POST /admin/users/{id}/signout` - Force user signout

### Audit & Monitoring
- `GET /me` - Get current user info
- `GET /admin/audits` - View audit logs (Admin only)

## 🛡️ Security Features

### Authentication & Authorization
- **Cognito Hosted UI**: OAuth2 + PKCE flow
- **JWT Tokens**: ID (10m), Access (60m), Refresh (30d)
- **Role Injection**: Pre-token generation trigger adds roles & vendor_id
- **RBAC Middleware**: Enforces access control on all endpoints

### Data Protection
- **S3 Encryption**: SSE-KMS with customer-managed keys
- **DynamoDB Encryption**: SSE-KMS enabled
- **TLS**: HTTPS only, deny non-TLS requests
- **IAM**: Least-privilege permissions, resource-scoped policies

### Audit & Compliance
- **CloudTrail**: Management events across all regions
- **Audit Logs**: All role changes and document operations
- **DynamoDB Streams**: Real-time audit data to Firehose → S3 → Athena
- **Access Logs**: API Gateway structured JSON logs

## 🔧 Development

### Local Development
```bash
# Start API in development mode
make dev-api

# Start web in development mode  
make dev-web

# Start both (parallel)
make dev
```

### Testing
```bash
# Run all tests
make test

# Run API tests only
make api-test

# Run web tests only
make web-test
```

### Environment Management
```bash
# Create new environment
make create-env ENV=staging

# Deploy to specific environment
make deploy ENV=staging

# Check deployment status
make status ENV=staging
```

## 📊 Monitoring & Observability

### Logs
```bash
# Tail Lambda function logs
make logs-api ENV=dev

# View all logs in CloudWatch
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/dms-dev
```

### Metrics & Alarms
- **Lambda**: Duration, errors, throttles
- **API Gateway**: Request count, latency, 4xx/5xx errors
- **DynamoDB**: Read/write capacity, throttles
- **S3**: Request metrics, error rates

### Audit Queries (Athena)
```sql
-- View recent document operations
SELECT timestamp, actor, action, resource
FROM audit_logs 
WHERE action LIKE 'document.%'
ORDER BY timestamp DESC
LIMIT 100;

-- View role changes
SELECT timestamp, actor, action, details
FROM audit_logs
WHERE action = 'user.role_change'
ORDER BY timestamp DESC;
```

## 🚀 Deployment

### Environments
- **dev**: Development environment
- **stg**: Staging environment
- **prod**: Production environment

### Full Deployment Pipeline
```bash
# Deploy everything to production
make deploy ENV=prod
```

### Individual Component Deployment
```bash
# Infrastructure only
make infra-apply ENV=prod

# API only
make api-deploy ENV=prod

# Frontend only
make web-deploy ENV=prod
```

### Rollback Strategy
```bash
# Rollback infrastructure
cd infra/envs/prod && terraform apply -target=module.lambda_functions

# Rollback API (deploy previous image)
# Update image tag in Lambda console or via CLI

# Rollback frontend
aws s3 sync s3://backup-bucket/web-backup/ s3://dms-prod-web/
```

## 🔍 Troubleshooting

### Common Issues

1. **Lambda Cold Starts**
   - Enable provisioned concurrency for critical functions
   - Optimize container image size

2. **DynamoDB Throttling**
   - Monitor read/write capacity metrics
   - Consider on-demand billing for variable workloads

3. **S3 Access Denied**
   - Check IAM permissions for Lambda roles
   - Verify S3 bucket policy allows Lambda access

4. **Cognito Token Issues**
   - Check token expiration times
   - Verify JWT authorizer configuration in API Gateway

### Debug Commands
```bash
# Check Lambda function status
aws lambda get-function --function-name dms-dev-createDocument

# View API Gateway logs
aws logs filter-log-events --log-group-name /aws/apigateway/dms-dev-api

# Test presigned URLs
curl -X POST https://api.example.com/files/presign/upload \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"vendorId":"vendor1","userId":"user1","filename":"test.pdf","contentType":"application/pdf"}'
```

## 📖 Documentation

- [API Documentation](docs/api/openapi.yaml)
- [Architecture Overview](docs/architecture/README.md)
- [Deployment Guide](docs/deployment/README.md)
- [Security Guide](docs/security/README.md)
- [Runbook](docs/runbook/README.md)

## 🤝 Contributing

1. Follow TypeScript/React best practices
2. Add tests for new features
3. Update documentation
4. Use conventional commits
5. Ensure security best practices

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
**Built with ❤️ using AWS serverless technologies**
