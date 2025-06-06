# S3 Upload Feature Demo - Infrastructure

This repository contains the AWS SAM (Serverless Application Model) infrastructure code for the S3 Upload Feature Demo. The infrastructure implements a secure, role-based document management system with vendor-specific S3 bucket organization.

## Core Features

- Vendor-based S3 bucket structure
- Role-based access control (Vendor/Admin roles)
- Secure file operations (upload/download/delete)
- Cross-account synchronization support
- API Gateway integration for UI access

## Project Structure

```
s3-upload-infra/
├── lambda/            # Lambda functions for file operations
│   ├── upload/       # File upload handlers
│   ├── download/     # File download handlers
│   ├── delete/       # File deletion handlers
│   └── sync/         # Cross-account sync handlers
├── templates/         # CloudFormation templates
├── common/           # Shared utilities
├── events/           # Test events
├── tests/            # Unit and integration tests
├── template.yaml     # Main SAM template
└── swagger.yaml      # API Gateway specification
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- SAM CLI installed
- Python 3.x
- Docker (for local testing)

## Deployment

1. Build the application:
```bash
sam build --use-container
```

2. Deploy the application:
```bash
sam deploy --guided
```

The guided deployment will prompt you for:
- Stack name
- AWS Region
- Deployment preferences
- IAM role creation permissions

## Role-Based Access Control

### Vendor Role
- Limited access to their specific vendor folder
- Can upload/download/delete files in their folder
- Cannot access other vendor folders

### Admin Role
- Full access to all vendor folders
- Can manage vendor permissions
- Can perform cross-account operations

## S3 Bucket Structure

```
s3://<bucket-name>/
├── vendor-1/
│   ├── documents/
│   └── metadata/
├── vendor-2/
│   ├── documents/
│   └── metadata/
└── shared/
    └── common-files/
```

## Local Development

1. Start the local API:
```bash
sam local start-api
```

2. Test individual functions:
```bash
sam local invoke FunctionName --event events/event.json
```

3. View logs:
```bash
sam logs -n FunctionName --stack-name <stack-name> --tail
```

## Testing

Run the test suite:
```bash
# Install test dependencies
pip install -r tests/requirements.txt --user

# Run unit tests
python -m pytest tests/unit -v

# Run integration tests
AWS_SAM_STACK_NAME=<stack-name> python -m pytest tests/integration -v
```

## Security

- IAM roles with least privilege principle
- S3 bucket policies for vendor isolation
- KMS encryption for sensitive data
- API Gateway authentication
- CloudTrail logging for audit trails

## Cross-Account Sync

The infrastructure supports cross-account synchronization through:
- S3 bucket replication
- IAM role assumption
- Event-driven sync triggers

## Monitoring

- CloudWatch Logs for Lambda functions
- CloudWatch Metrics for API Gateway
- S3 access logs
- CloudTrail audit logs

## Cleanup

To remove the deployed stack:
```bash
aws cloudformation delete-stack --stack-name <stack-name>
```

## Support

For issues and support, please contact the development team or create an issue in the repository.
