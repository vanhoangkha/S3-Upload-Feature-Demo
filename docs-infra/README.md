# Document Management System Infrastructure

This Terraform project sets up the AWS infrastructure for the Document Management System, including:

- **S3 Buckets**: Document storage and web hosting
- **DynamoDB Tables**: Document metadata and general data storage
- **Cognito**: User authentication and authorization
- **Lambda Function**: HonoJS API backend
- **API Gateway**: REST API endpoint
- **IAM Roles & Policies**: Secure access control

## Architecture

The infrastructure supports a document management application with:

- HonoJS API running on AWS Lambda with API Gateway
- Document storage using S3 presigned URLs
- User authentication via Cognito
- Metadata storage in DynamoDB
- S3 bucket for static web hosting (optional)

## Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.0
- Node.js 18+ (for building Lambda deployment package)

## Usage

1. **Configure variables**:

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

2. **Initialize Terraform**:

   ```bash
   terraform init
   ```

3. **Plan deployment**:

   ```bash
   terraform plan
   ```

4. **Deploy infrastructure**:

   ```bash
   terraform apply
   ```

5. **Update application configurations**:
   - Copy outputs to `docs-api/.env`
   - Copy outputs to `docs-ui/.env`

## Modules

- `cognito` - User pool and identity pool
- `dynamodb` - Document and general tables
- `s3` - Storage buckets with policies
- `lambda` - API function with IAM role
- `api-gateway` - REST API configuration
- `iam` - Roles and policies

## Outputs

The Terraform configuration outputs all necessary values for configuring the frontend and backend applications.
