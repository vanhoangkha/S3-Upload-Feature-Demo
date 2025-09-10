# Document Management System (DMS) - Architecture Overview

## System Architecture

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

## Key Components

### Frontend Layer
- **CloudFront CDN**: Global content delivery with caching
- **S3 Web Hosting**: Static website hosting for React app
- **React Application**: Built with AWS Cloudscape Design System

### API Layer
- **API Gateway HTTP**: RESTful API endpoints
- **JWT Authorizer**: Token-based authentication for all requests

### Authentication & Authorization
- **Cognito User Pool**: User management and authentication
- **Hosted UI**: OAuth2 + PKCE flow for secure login
- **Role-Based Access Control**: Admin, Vendor, User roles
- **Pre-token Generation**: Injects roles and vendor_id into JWT tokens

### Business Logic (Lambda Functions)
All functions are containerized and deployed via ECR:

**Document Operations:**
- Create, Read, Update, Delete documents
- List documents with filtering and pagination
- Restore soft-deleted documents
- Version management

**File Operations:**
- Generate presigned URLs for secure uploads/downloads
- Handle large file transfers

**Admin Operations:**
- User management (create, list, update roles)
- Force user sign-out
- Audit log access

**Vendor Operations:**
- Access vendor-specific documents and users
- Vendor statistics and reporting

### Storage Layer
- **S3 Documents**: KMS-encrypted document storage with versioning
- **DynamoDB**: Document metadata, audit logs, user data
- **KMS**: Customer-managed encryption keys

### Monitoring & Audit
- **CloudWatch**: Centralized logging and metrics
- **DynamoDB Streams**: Real-time audit data capture
- **Kinesis Firehose**: Stream audit data to S3
- **Athena**: SQL analytics on audit logs

## Security Features

### Data Protection
- **Encryption at Rest**: KMS encryption for S3 and DynamoDB
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Access Control**: IAM roles with least-privilege permissions

### Authentication & Authorization
- **Multi-factor Authentication**: Supported via Cognito
- **JWT Tokens**: Short-lived access tokens (60min) with refresh tokens (30d)
- **Role-based Access**: Granular permissions per user role

### Audit & Compliance
- **Comprehensive Logging**: All API calls and data changes logged
- **Real-time Monitoring**: CloudWatch alarms for security events
- **Audit Trail**: Immutable audit logs in S3 for compliance

## Deployment Architecture

### Infrastructure as Code
- **Terraform**: Complete infrastructure definition
- **Environment Separation**: dev/staging/prod environments
- **State Management**: Remote state in S3 with DynamoDB locking

### CI/CD Pipeline
- **GitHub Actions**: Automated testing and deployment
- **Container Registry**: ECR for Lambda container images
- **Blue/Green Deployment**: Zero-downtime deployments

### Scalability & Performance
- **Serverless Architecture**: Auto-scaling based on demand
- **CDN Caching**: Global content delivery via CloudFront
- **Database Optimization**: DynamoDB with proper indexing
- **Connection Pooling**: Efficient database connections

## Data Flow

1. **User Authentication**: Users authenticate via Cognito Hosted UI
2. **API Requests**: Frontend makes authenticated requests to API Gateway
3. **Authorization**: JWT Authorizer validates tokens and extracts user context
4. **Business Logic**: Lambda functions process requests based on user roles
5. **Data Storage**: Documents stored in S3, metadata in DynamoDB
6. **Audit Logging**: All operations logged for compliance and monitoring
7. **Analytics**: Audit data streamed to analytics platform for insights

## Role-Based Access Control

### Admin Role
- Full system access
- User management capabilities
- Access to all audit logs
- System configuration

### Vendor Role
- Access to vendor's documents and users
- User management within vendor scope
- Vendor-specific analytics

### User Role
- Access to own documents only
- Basic profile management
- Document upload/download

## Performance Characteristics

- **API Response Time**: < 200ms for most operations
- **File Upload**: Supports files up to 5GB via presigned URLs
- **Concurrent Users**: Scales automatically with serverless architecture
- **Global Availability**: Multi-region deployment capability
- **Uptime**: 99.9% availability SLA with proper monitoring
