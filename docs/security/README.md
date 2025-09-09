# Security Guide

## Security Architecture

The DMS implements defense-in-depth security with multiple layers of protection.

## Authentication & Authorization

### Cognito User Pool Configuration

```hcl
# Strong password policy
password_policy {
  minimum_length    = 8
  require_lowercase = true
  require_numbers   = true
  require_symbols   = true
  require_uppercase = true
}

# Token expiration
id_token_validity      = 10  # 10 minutes
access_token_validity  = 60  # 60 minutes  
refresh_token_validity = 30  # 30 days
```

### Role-Based Access Control (RBAC)

#### Admin Role
- **Permissions**: Full system access
- **Use Cases**: System administration, user management
- **Restrictions**: Should be limited to trusted personnel

#### Vendor Role  
- **Permissions**: Access to vendor's documents and users
- **Use Cases**: Vendor administrators, document managers
- **Restrictions**: Cannot access other vendors' data

#### User Role
- **Permissions**: Access to own documents only
- **Use Cases**: End users, document owners
- **Restrictions**: Cannot access other users' documents

### JWT Token Security

#### Token Claims
```json
{
  "sub": "user-id",
  "cognito:groups": ["User"],
  "custom:vendor_id": "vendor-123",
  "aud": "client-id",
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/pool-id",
  "exp": 1640995200
}
```

#### Token Validation
- **Signature**: Verified using Cognito public keys
- **Expiration**: Checked on every request
- **Audience**: Validated against client ID
- **Issuer**: Validated against Cognito URL

## Data Protection

### Encryption at Rest

#### S3 Encryption
```hcl
server_side_encryption_configuration {
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
  }
}
```

#### DynamoDB Encryption
```hcl
server_side_encryption {
  enabled     = true
  kms_key_arn = var.kms_key_arn
}
```

### Encryption in Transit

- **HTTPS Only**: All API endpoints require TLS
- **S3 Policy**: Denies non-TLS requests
- **CloudFront**: Redirects HTTP to HTTPS

```json
{
  "Sid": "DenyInsecureConnections",
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": ["bucket-arn", "bucket-arn/*"],
  "Condition": {
    "Bool": {
      "aws:SecureTransport": "false"
    }
  }
}
```

### Key Management (KMS)

#### Customer-Managed Keys
- **Rotation**: Automatic annual rotation enabled
- **Permissions**: Least-privilege access
- **Audit**: All key usage logged in CloudTrail

```hcl
resource "aws_kms_key" "docs" {
  description             = "DMS Documents encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}
```

## Network Security

### API Gateway Security

#### CORS Configuration
```hcl
cors_configuration {
  allow_credentials = false
  allow_headers     = ["content-type", "authorization"]
  allow_methods     = ["*"]
  allow_origins     = var.allowed_origins
  max_age          = 86400
}
```

#### Rate Limiting
- **Default**: 10,000 requests per second
- **Burst**: 5,000 requests
- **Throttling**: Automatic when limits exceeded

### S3 Security

#### Bucket Policies
```hcl
resource "aws_s3_bucket_public_access_block" "docs" {
  bucket = aws_s3_bucket.docs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

#### Presigned URL Security
- **Expiration**: 15 minutes maximum
- **Scope**: Limited to specific object and operation
- **Validation**: User permissions checked before generation

## IAM Security

### Least Privilege Principle

Each Lambda function has minimal required permissions:

```hcl
# Example: Document creation function
resource "aws_iam_role_policy" "create_document" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem"
        ]
        Resource = var.documents_table_arn
      }
    ]
  })
}
```

### Resource-Based Policies

#### S3 Bucket Policy
- Denies non-TLS requests
- Allows CloudFront access only
- Blocks public access

#### DynamoDB Resource Policy
- Restricts access to Lambda roles only
- Scoped to specific table operations

## Audit and Compliance

### Audit Logging

All operations are logged with:
- **Actor**: User ID, vendor ID, roles
- **Action**: Operation performed
- **Resource**: Target resource type and ID
- **Result**: Success or failure
- **Timestamp**: ISO 8601 format
- **Details**: Additional context

```typescript
await auditLog({
  actor: auth,
  action: 'document.create',
  resource: { type: 'document', id: documentId },
  result: 'success',
  details: { name: input.name, size: input.size }
});
```

### CloudTrail Integration

#### Management Events
- All API calls to AWS services
- Cross-region replication
- Log file integrity validation

#### Data Events (Optional)
- S3 object-level operations
- Lambda function invocations
- DynamoDB item-level operations

### Compliance Features

#### SOC 2 Type II
- Audit logs for all operations
- Access controls and monitoring
- Data encryption requirements

#### GDPR Compliance
- Data encryption at rest and in transit
- Access controls and audit trails
- Data retention policies

## Security Monitoring

### CloudWatch Alarms

#### Failed Authentication Attempts
```bash
aws logs create-log-group --log-group-name /aws/lambda/dms-auth-failures

# Create metric filter for failed auth
aws logs put-metric-filter \
  --log-group-name /aws/lambda/dms-auth-failures \
  --filter-name AuthFailures \
  --filter-pattern "ERROR Unauthorized" \
  --metric-transformations \
    metricName=AuthFailures,metricNamespace=DMS,metricValue=1
```

#### Unusual Access Patterns
- Multiple failed login attempts
- Access from unusual locations
- Large data downloads
- Administrative actions

### Security Dashboards

#### Key Metrics to Monitor
- Authentication success/failure rates
- API error rates (4xx, 5xx)
- Lambda function errors
- DynamoDB throttling events
- S3 access patterns

## Incident Response

### Security Incident Playbook

#### 1. Detection
- CloudWatch alarms trigger
- Manual security review
- User reports suspicious activity

#### 2. Assessment
- Review audit logs
- Check access patterns
- Identify affected resources

#### 3. Containment
- Disable compromised accounts
- Rotate access keys
- Update security groups

#### 4. Recovery
- Restore from backups if needed
- Update security policies
- Deploy security patches

#### 5. Lessons Learned
- Document incident details
- Update security procedures
- Implement additional controls

### Emergency Procedures

#### Compromise Response
```bash
# Force user signout
aws cognito-idp admin-user-global-sign-out \
  --user-pool-id $USER_POOL_ID \
  --username $COMPROMISED_USER

# Disable API access
aws apigateway update-stage \
  --rest-api-id $API_ID \
  --stage-name prod \
  --patch-ops op=replace,path=/throttle/rateLimit,value=0
```

#### Data Breach Response
1. **Immediate**: Stop data access
2. **Assessment**: Determine scope of breach
3. **Notification**: Inform stakeholders
4. **Recovery**: Restore secure operations
5. **Prevention**: Implement additional controls

## Security Best Practices

### Development Security

#### Code Security
- No hardcoded secrets
- Input validation on all endpoints
- SQL injection prevention (using DynamoDB)
- XSS prevention in frontend

#### Dependency Management
```bash
# Regular security audits
npm audit
npm audit fix

# Update dependencies
npm update
```

### Operational Security

#### Access Management
- Regular access reviews
- Principle of least privilege
- Multi-factor authentication
- Strong password policies

#### Monitoring and Alerting
- Real-time security monitoring
- Automated incident response
- Regular security assessments
- Penetration testing

### Data Security

#### Data Classification
- **Public**: Marketing materials
- **Internal**: Business documents
- **Confidential**: Customer data
- **Restricted**: Financial records

#### Data Handling
- Encryption for all sensitive data
- Secure data transmission
- Regular data backups
- Secure data disposal

## Security Testing

### Automated Security Testing

#### Static Code Analysis
```bash
# ESLint security rules
npm install eslint-plugin-security
```

#### Dependency Scanning
```bash
# Check for known vulnerabilities
npm audit
snyk test
```

### Manual Security Testing

#### Penetration Testing
- Annual third-party assessments
- Internal security reviews
- Vulnerability assessments
- Social engineering tests

#### Security Code Reviews
- Peer review process
- Security-focused reviews
- Automated security checks
- Regular security training

## Compliance Checklist

### Pre-Deployment Security Review

- [ ] All secrets removed from code
- [ ] IAM policies follow least privilege
- [ ] Encryption enabled for all data
- [ ] Audit logging configured
- [ ] Security monitoring enabled
- [ ] Access controls tested
- [ ] Vulnerability scan completed
- [ ] Security documentation updated

### Ongoing Security Maintenance

- [ ] Regular security assessments
- [ ] Dependency updates
- [ ] Access reviews
- [ ] Incident response testing
- [ ] Security training
- [ ] Compliance audits
- [ ] Backup testing
- [ ] Disaster recovery testing
