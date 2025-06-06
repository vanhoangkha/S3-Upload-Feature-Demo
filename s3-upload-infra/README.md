# S3 Upload Feature Demo - SAM Project Guide

This guide provides detailed instructions for setting up, deploying, and running the S3 Upload Feature Demo SAM (Serverless Application Model) project.

## Project Overview

The S3 Upload Feature Demo is a serverless application that enables secure file uploads to Amazon S3. The infrastructure is built using AWS SAM and includes:

- Document storage in S3 with versioning
- User authentication via Amazon Cognito
- Document metadata storage in DynamoDB
- RESTful API using API Gateway
- Serverless functions using AWS Lambda

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Web Client │────▶│ API Gateway │────▶│   Lambda    │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       │
       │                                       ▼
       │                               ┌─────────────┐
       │                               │             │
       └──────────────────────────────▶│     S3      │
                                       │             │
                                       └─────────────┘
                                            │
                                            │
                                            ▼
                                     ┌─────────────┐
                                     │             │
                                     │  DynamoDB   │
                                     │             │
                                     └─────────────┘
```

## Prerequisites

Before you begin, ensure you have the following installed:

1. **AWS CLI** - [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. **AWS SAM CLI** - [Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
3. **Python 3.9** or later - [Download Python](https://www.python.org/downloads/)
4. **Docker** - [Get Docker](https://docs.docker.com/get-docker/) (required for local testing)

## Setup Instructions

### 1. Configure AWS Credentials

```bash
aws configure
```

Enter your AWS Access Key ID, Secret Access Key, default region (e.g., us-east-1), and output format (json).

### 2. Clone the Repository

```bash
git clone https://github.com/vanhoangkha/S3-Upload-Feature-Demo.git
cd S3-Upload-Feature-Demo/s3-upload-infra
```

### 3. Review and Customize Configuration

The project uses the following default configuration in `samconfig.toml`:

```toml
version = 0.1
[default.deploy.parameters]
stack_name = "vib-dms-app-2026"
resolve_s3 = true
s3_prefix = "vib-dms-app-2026"
region = "us-east-1"
confirm_changeset = true
capabilities = "CAPABILITY_IAM"
parameter_overrides = "DocumentStoreBucketName=\"vibdmsstore2026\" WebStoreBucketName=\"vibdmswebstore2026\""
image_repositories = []
```

You can modify these parameters as needed, particularly:
- `stack_name`: The name of your CloudFormation stack
- `region`: Your preferred AWS region
- `DocumentStoreBucketName` and `WebStoreBucketName`: S3 bucket names (must be globally unique)

## Building and Deploying

### 1. Build the Application

```bash
sam build --use-container
```

This command builds your Lambda functions inside a Docker container that mimics the Lambda execution environment.

### 2. Deploy the Application

#### Option 1: Guided Deployment (First-time users)

```bash
sam deploy --guided
```

Follow the prompts to configure your deployment parameters.

#### Option 2: Use Existing Configuration

```bash
sam deploy
```

This will use the parameters defined in your `samconfig.toml` file.

### 3. Verify Deployment

After deployment completes, you'll see outputs including:
- API Gateway endpoint URL
- S3 bucket names
- Cognito User Pool ID

Make note of these values as you'll need them for the frontend application.

## Project Structure

```
s3-upload-infra/
├── lambda/                # Lambda function code
│   ├── delete_doc/        # Document deletion handler
│   ├── get_general_infor/ # Get general information handler
│   ├── list_docs/         # Document listing handler
│   ├── upload_doc/        # Document upload handler
│   └── upload_general_infor/ # General information upload handler
├── templates/             # Nested CloudFormation templates
├── events/                # Sample events for local testing
├── tests/                 # Unit and integration tests
├── template.yaml          # Main SAM template
└── swagger.yaml           # API Gateway definition
```

## Local Testing

### 1. Invoke Functions Locally

Test individual Lambda functions:

```bash
# Test the list_docs function
sam local invoke DocsList --event events/list_docs_event.json

# Test the upload_doc function
sam local invoke DocsUpload --event events/upload_doc_event.json

# Test the delete_doc function
sam local invoke DocsDelete --event events/delete_doc_event.json
```

### 2. Run API Gateway Locally

Start a local API Gateway instance:

```bash
sam local start-api
```

This will make your API available at http://127.0.0.1:3000/

## API Endpoints

The application provides the following API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/docs/{id}` | GET | List documents for a specific user |
| `/docs` | POST | Upload a document |
| `/docs/{id}` | DELETE | Delete a document |
| `/docs/{id}/gen` | POST | Upload general information |
| `/docs/{id}/gen` | GET | Get general information |

## Resources Created

The SAM template creates the following AWS resources:

1. **Amazon Cognito**
   - User Pool for authentication
   - Identity Pool for AWS service access
   - User Pool Client for application integration

2. **Amazon S3**
   - Document bucket with versioning enabled
   - Web hosting bucket for frontend assets

3. **Amazon DynamoDB**
   - Documents table for file metadata
   - General table for additional information

4. **AWS Lambda Functions**
   - Document listing function
   - Document upload function
   - Document deletion function
   - General information upload function
   - General information retrieval function

5. **Amazon API Gateway**
   - RESTful API with multiple endpoints
   - Integration with Lambda functions

## Monitoring and Debugging

### View CloudWatch Logs

```bash
sam logs -n FunctionName --stack-name vib-dms-app-2026 --tail
```

Replace `FunctionName` with the name of your Lambda function (e.g., `list_docs`, `upload_doc`).

### View Resources in AWS Console

1. CloudFormation: Check stack status and resources
2. Lambda: View function code, configurations, and logs
3. API Gateway: Examine API structure and test endpoints
4. S3: Verify bucket creation and contents
5. DynamoDB: Inspect tables and data

## Cleanup

To remove all resources created by the SAM template:

```bash
sam delete
```

This will delete the CloudFormation stack and all associated resources.

## Troubleshooting

### Common Issues

1. **Deployment Failures**
   - Check CloudFormation events in the AWS Console
   - Verify that bucket names are globally unique
   - Ensure you have sufficient permissions

2. **API Gateway Errors**
   - Check Lambda function logs in CloudWatch
   - Verify API Gateway configuration in the AWS Console

3. **S3 Access Issues**
   - Check CORS configuration
   - Verify IAM permissions for Lambda functions

4. **Local Testing Problems**
   - Ensure Docker is running
   - Check that AWS credentials are properly configured

## Integration with Frontend

To connect the frontend application with this backend:

1. Update the frontend configuration with the API Gateway endpoint URL
2. Configure Cognito authentication with the User Pool ID and Client ID
3. Set up S3 direct uploads using the document bucket name

## Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [Amazon S3 Developer Guide](https://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html)
- [Amazon DynamoDB Developer Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
- [Amazon Cognito Developer Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html)
