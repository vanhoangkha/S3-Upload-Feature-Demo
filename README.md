# 🚀 Document Management System (DMS)

Production-ready serverless document management system with role-based access control, built on AWS.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![AWS](https://img.shields.io/badge/AWS-Serverless-orange.svg)](https://aws.amazon.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Terraform](https://img.shields.io/badge/Terraform-1.6+-623CE4.svg)](https://www.terraform.io/)

## 🌟 Overview

A comprehensive document management solution featuring secure file storage, role-based access control, and real-time audit logging. Built with modern serverless architecture on AWS for scalability and cost-effectiveness.

### ✨ Key Features

- 🔐 **Role-Based Access Control** - Admin, Vendor, and User roles with granular permissions
- 📁 **Secure Document Storage** - S3 with KMS encryption and versioning
- 🔍 **Real-time Audit Logging** - Complete activity tracking with analytics
- 🚀 **Serverless Architecture** - Auto-scaling Lambda functions with container deployment
- 🎨 **Modern UI** - React with AWS Cloudscape Design System
- 🏗️ **Infrastructure as Code** - 100% Terraform with multi-environment support
- 📊 **Monitoring & Analytics** - CloudWatch dashboards and Athena queries

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│     Users       │    │    Frontend      │    │   API Layer     │
│                 │    │                  │    │                 │
│ • Admin         │───▶│ CloudFront CDN   │───▶│ API Gateway     │
│ • Vendor        │    │ S3 Web Hosting   │    │ JWT Authorizer  │
│ • User          │    │ React App        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐             │
                       │ Authentication  │◀────────────┘
                       │                 │
                       │ Cognito Pool    │
                       │ Hosted UI       │
                       │ Pre-token Gen   │
                       └─────────────────┘
                                │
┌──────────────────────────────────────────────────────────────────┐
│                    Lambda Functions (Container-based)            │
│                                                                  │
│ Document Ops:     File Ops:        Admin Ops:      Vendor Ops:  │
│ • Create         • Presign Upload  • Create User   • Get Docs   │
│ • Get            • Presign Download• List Users    • Get Users  │
│ • Update         • List Versions   • Update Roles  • Get Stats  │
│ • Delete                           • Sign Out                   │
│ • List                             • Audit Logs                 │
│ • Restore                                                       │
└──────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
│   S3 Storage   │    │   DynamoDB      │    │   Monitoring    │
│                │    │                 │    │                 │
│ • Documents    │    │ • Metadata      │    │ • CloudWatch    │
│ • KMS Encrypt  │    │ • Audit Logs    │    │ • Kinesis       │
│ • Versioning   │    │ • User Data     │    │ • Athena        │
└────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **AWS CLI** configured with appropriate permissions
- **Node.js** 20+ and npm
- **Terraform** 1.6+
- **Docker** (for local development)

### 1. Clone & Setup

```bash
git clone <repository-url>
cd document-management-system
make setup
```

### 2. Deploy to AWS

```bash
# Deploy to development environment
make deploy ENV=dev

# Deploy to production
make deploy ENV=prod
```

### 3. Access Application

After deployment, get the CloudFront URL:
```bash
make status ENV=dev
```

## 📁 Project Structure

```
document-management-system/
├── 📋 Root Configuration
│   ├── package.json              # Workspace configuration
│   ├── Makefile                  # Build automation
│   ├── .env.example             # Environment template
│   └── docker-compose.yml       # Local development
│
├── 🚀 scripts/                  # Automation Scripts
│   ├── deploy.sh               # Main deployment
│   ├── setup-env.sh           # Environment setup
│   └── cleanup.sh             # Resource cleanup
│
├── 🏗️ infra/                   # Infrastructure as Code
│   ├── modules/                # Terraform modules
│   │   ├── apigateway/        # API Gateway configuration
│   │   ├── cognito/           # Authentication
│   │   ├── lambda/            # Function definitions
│   │   ├── s3/               # Storage buckets
│   │   └── ...               # Other AWS services
│   └── envs/                  # Environment configs
│       ├── dev/              # Development
│       ├── stg/              # Staging
│       └── prod/             # Production
│
├── 🚀 api/                     # Backend Services
│   ├── src/
│   │   ├── handlers/         # Lambda functions
│   │   ├── lib/             # Shared utilities
│   │   └── types/           # TypeScript definitions
│   ├── Dockerfile           # Container image
│   └── package.json         # Dependencies
│
├── 🎨 web/                     # Frontend Application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/          # Application pages
│   │   ├── contexts/       # React contexts
│   │   └── services/       # API clients
│   └── package.json        # Dependencies
│
└── 📖 docs/                    # Documentation
    ├── api/                  # API specifications
    ├── architecture/         # System design
    ├── deployment/          # Deployment guides
    └── security/           # Security documentation
```

## 🔧 Development

### Local Development

```bash
# Start all services locally
make dev

# Start individual services
make dev-api    # API server on :3001
make dev-web    # Web app on :3000
```

### Build & Test

```bash
# Build everything
make build

# Run tests
make test

# Run security scans
make security-scan
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

## 🔐 Security & Compliance

### Authentication & Authorization
- **Cognito User Pool** with hosted UI
- **JWT tokens** with role-based claims
- **Multi-factor authentication** support
- **Session management** with refresh tokens

### Data Protection
- **KMS encryption** for all data at rest
- **TLS 1.2+** for data in transit
- **Presigned URLs** for secure file access
- **IAM least-privilege** policies

### Audit & Monitoring
- **Complete audit trail** of all operations
- **Real-time monitoring** with CloudWatch
- **Automated alerting** for security events
- **Compliance reporting** via Athena

## 🎯 User Roles

| Role | Permissions | Use Cases |
|------|-------------|-----------|
| **Admin** | Full system access, user management, audit logs | System administrators, IT managers |
| **Vendor** | Vendor documents, vendor users, analytics | Business partners, suppliers |
| **User** | Own documents only, profile management | End users, employees |

## 📊 API Endpoints

### Document Management
```
GET    /files              # List documents
POST   /files              # Create document
GET    /files/{id}         # Get document
PATCH  /files/{id}         # Update document
DELETE /files/{id}         # Delete document
POST   /files/{id}/restore # Restore document
```

### File Operations
```
POST   /files/presign/upload   # Get upload URL
POST   /files/presign/download # Get download URL
GET    /files/{id}/versions    # List versions
```

### Administration
```
GET    /admin/users           # List users
POST   /admin/users           # Create user
POST   /admin/users/{id}/roles # Update roles
GET    /admin/audits          # Audit logs
```

## 🚀 Deployment

### Environment Configuration

1. **Development** (`dev`)
   - Single AZ deployment
   - Minimal resources
   - Debug logging enabled

2. **Staging** (`stg`)
   - Production-like setup
   - Performance testing
   - Integration validation

3. **Production** (`prod`)
   - Multi-AZ deployment
   - Auto-scaling enabled
   - Enhanced monitoring

### Deployment Commands

```bash
# Full deployment
make deploy ENV=prod

# Infrastructure only
make deploy-infra ENV=prod

# Application only
make deploy-api ENV=prod
make deploy-web ENV=prod
```

### Rollback Strategy

```bash
# Infrastructure rollback
cd infra/envs/prod
terraform apply -target=module.previous_version

# Application rollback
# Update image tags in Lambda console
```

## 📈 Monitoring

### CloudWatch Dashboards
- **System Overview** - Key metrics and health
- **Performance** - Latency and throughput
- **Security** - Authentication and access patterns
- **Cost** - Resource utilization and billing

### Alerts & Notifications
- **Error rates** > 1%
- **Response time** > 5 seconds
- **Failed authentications** > 10/minute
- **Storage quota** > 80%

### Log Analysis
```bash
# View API logs
make logs-api ENV=prod

# Query audit logs (Athena)
SELECT * FROM audit_logs 
WHERE action = 'document.create' 
AND timestamp > current_timestamp - interval '1' day
```

## 🔍 Troubleshooting

### Common Issues

**Authentication Errors**
```bash
# Check Cognito configuration
aws cognito-idp describe-user-pool --user-pool-id <pool-id>

# Verify JWT tokens
# Check token expiration and claims
```

**API Gateway Timeouts**
```bash
# Check Lambda function logs
aws logs filter-log-events --log-group-name /aws/lambda/dms-prod-api

# Monitor function duration and memory usage
```

**S3 Access Denied**
```bash
# Verify IAM permissions
aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names s3:GetObject

# Check bucket policies
aws s3api get-bucket-policy --bucket <bucket-name>
```

### Debug Commands

```bash
# Check infrastructure status
make status ENV=prod

# View recent deployments
aws cloudformation describe-stacks --stack-name dms-prod

# Test API endpoints
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/files
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow **TypeScript** best practices
- Add **tests** for new features
- Update **documentation**
- Use **conventional commits**
- Ensure **security** compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/document-management-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/document-management-system/discussions)

## 🙏 Acknowledgments

- **AWS** for serverless infrastructure
- **Cloudscape Design System** for UI components
- **Terraform** for infrastructure as code
- **Open source community** for amazing tools

---

**Built with ❤️ using AWS serverless technologies**

*For detailed documentation, see the [docs/](docs/) directory.*
