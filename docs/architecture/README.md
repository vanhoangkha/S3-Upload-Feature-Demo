# Architecture Overview

## System Architecture

The Document Management System (DMS) is built using a serverless architecture on AWS, designed for scalability, security, and cost-effectiveness.

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   API Gateway    │    │     Lambda      │
│   (React SPA)   │◄──►│  (HTTP API +     │◄──►│   (Node.js 20   │
│                 │    │  JWT Authorizer) │    │   TypeScript)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                       ┌──────────────────┐             │
                       │     Cognito      │◄────────────┘
                       │   (User Pool +   │
                       │   Hosted UI)     │
                       └──────────────────┘
                                │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│       S3        │    │    DynamoDB      │    │      KMS        │
│  (Documents +   │    │  (Metadata +     │    │  (Encryption    │
│   Web Hosting)  │    │   Audit Logs)    │    │     Keys)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Components

### 1. Frontend (React + Cloudscape)
- **Technology**: React 18 + TypeScript + Vite
- **UI Framework**: AWS Cloudscape Design System
- **Hosting**: S3 + CloudFront
- **Authentication**: Cognito Hosted UI (OAuth2 + PKCE)
- **State Management**: React Query for server state

### 2. API Layer (API Gateway + Lambda)
- **API Gateway**: HTTP API with JWT authorizer
- **Lambda Runtime**: Node.js 20 with TypeScript
- **Deployment**: Container images via ECR
- **Architecture**: Microservices (1 Lambda per endpoint)

### 3. Authentication & Authorization (Cognito)
- **User Pool**: Manages users and groups
- **Groups**: Admin, Vendor, User
- **Tokens**: JWT with custom claims (roles, vendor_id)
- **Token TTL**: ID (10m), Access (60m), Refresh (30d)

### 4. Data Layer
#### DynamoDB Tables
- **documents**: Document metadata with GSIs for querying
- **role_audits**: Audit trail for role changes and operations

#### S3 Buckets
- **docs**: Document storage with versioning and KMS encryption
- **web**: Static website hosting for React app

### 5. Security (KMS + IAM)
- **KMS**: Customer-managed keys for S3 and DynamoDB encryption
- **IAM**: Least-privilege roles for each Lambda function
- **S3**: Block public access, deny non-TLS requests

## Data Models

### Document Schema (DynamoDB)
```
PK: TENANT#{vendor_id}
SK: USER#{owner_user_id}#DOC#{document_id}

Attributes:
- document_id: UUID
- name: string
- mime: string  
- size: number
- checksum: string
- s3_key: string
- version: number
- tags: string[]
- created_at: ISO datetime
- updated_at: ISO datetime
- deleted_at?: ISO datetime (soft delete)
- owner_user_id: string
- vendor_id: string

GSI1: owner_user_id (PK) - for user's documents
GSI2: vendor_id (PK), updated_at (SK) - for vendor documents
```

### S3 Key Strategy
```
tenant/{vendor_id}/user/{owner_user_id}/{document_id}/v{version}/{filename}
```

## Security Model

### Role-Based Access Control (RBAC)

#### Admin Role
- Full system access
- User management (create, update roles, force signout)
- Access to all documents across all vendors
- Audit log access

#### Vendor Role  
- Access to all documents within their vendor
- Cannot manage users or access other vendors
- Limited audit access (own vendor only)

#### User Role
- Access only to their own documents
- Cannot access other users' documents
- No administrative capabilities

### Authentication Flow
1. User redirected to Cognito Hosted UI
2. OAuth2 authorization code flow with PKCE
3. Code exchanged for JWT tokens
4. Pre-token generation trigger injects roles and vendor_id
5. Frontend stores ID token and uses for API calls
6. API Gateway validates JWT and extracts claims
7. Lambda functions enforce RBAC using claims

### Data Protection
- **Encryption at Rest**: KMS-encrypted S3 and DynamoDB
- **Encryption in Transit**: HTTPS/TLS only
- **Access Control**: IAM roles with least-privilege
- **Audit Trail**: All operations logged to DynamoDB

## Scalability & Performance

### Auto-Scaling Components
- **Lambda**: Automatic scaling based on demand
- **DynamoDB**: On-demand billing mode
- **API Gateway**: Handles up to 10,000 RPS by default
- **CloudFront**: Global CDN for frontend

### Performance Optimizations
- **Lambda**: Container images for faster cold starts
- **DynamoDB**: GSIs for efficient querying
- **S3**: Presigned URLs for direct upload/download
- **Frontend**: Code splitting and lazy loading

## Monitoring & Observability

### Logging
- **Structured JSON logs** from all Lambda functions
- **API Gateway access logs** in JSON format
- **CloudWatch Log Groups** with retention policies

### Metrics & Alarms
- Lambda duration, errors, throttles
- API Gateway request count, latency, errors
- DynamoDB read/write capacity, throttles
- S3 request metrics

### Audit Trail
- All document operations logged
- Role changes tracked
- DynamoDB Streams → Kinesis Firehose → S3 → Athena

## Deployment

### Infrastructure as Code
- **Terraform**: All AWS resources defined as code
- **Modules**: Reusable components for different environments
- **State Management**: Remote state in S3 with DynamoDB locking

### CI/CD Pipeline
- **Source**: Git repository
- **Build**: Docker images for Lambda
- **Deploy**: Terraform + AWS CLI automation
- **Environments**: dev, staging, production

### Disaster Recovery
- **Multi-AZ**: DynamoDB and S3 automatically replicated
- **Backups**: Point-in-time recovery enabled
- **Versioning**: S3 versioning for document history
- **Infrastructure**: Terraform state enables quick rebuild

## Cost Optimization

### Serverless Benefits
- **Pay-per-use**: No idle server costs
- **Auto-scaling**: Resources scale to zero when not used
- **Managed Services**: Reduced operational overhead

### Storage Optimization
- **S3 Lifecycle**: Automatic transition to cheaper storage classes
- **DynamoDB**: On-demand billing for variable workloads
- **CloudFront**: Reduced data transfer costs

## Security Compliance

### Best Practices Implemented
- **Least Privilege**: IAM roles with minimal required permissions
- **Defense in Depth**: Multiple layers of security controls
- **Encryption**: Data encrypted at rest and in transit
- **Audit Logging**: Complete audit trail for compliance
- **Access Control**: Fine-grained RBAC implementation

### Compliance Considerations
- **SOC 2**: Audit logs and access controls
- **GDPR**: Data encryption and access controls
- **HIPAA**: Encryption and audit requirements (if applicable)
- **ISO 27001**: Security management practices
