# S3 Upload Feature Demo - Running Guide

This guide provides step-by-step instructions for setting up and running both the infrastructure and UI components of the S3 Upload Feature Demo.

## Prerequisites

### Common Requirements
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Git installed
- Docker installed and running

### Infrastructure Requirements
- Python 3.x
- SAM CLI installed
- Node.js 16.x or later (for local testing)

### UI Requirements
- Node.js 16.x or later
- npm or yarn
- AWS Amplify CLI

## Step 1: Clone and Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd VIB
```

2. Install AWS Amplify CLI globally:
```bash
npm install -g @aws-amplify/cli
```

## Step 2: Infrastructure Setup

1. Navigate to the infrastructure directory:
```bash
cd s3-upload-infra
```

2. Create and activate a Python virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Build the SAM application:
```bash
sam build --use-container
```

5. Deploy the infrastructure:
```bash
sam deploy --guided
```

During the guided deployment, you'll be prompted for:
- Stack name (e.g., `s3-upload-demo`)
- AWS Region
- Confirm changes before deploy
- Allow SAM CLI IAM role creation
- Save arguments to configuration file

6. Note the output values, especially:
- API Gateway endpoint URL
- User Pool ID
- User Pool Client ID
- S3 Bucket Name

## Step 3: UI Setup

1. Navigate to the UI directory:
```bash
cd ../s3-upload-ui
```

2. Install dependencies:
```bash
yarn install
# or
npm install
```

3. Configure Amplify:
```bash
amplify configure
```

4. Initialize Amplify in the project:
```bash
amplify init
```

5. Create a `.env` file with the values from infrastructure deployment:
```bash
REACT_APP_API_ENDPOINT=<API-Gateway-URL>
REACT_APP_REGION=<AWS-Region>
REACT_APP_USER_POOL_ID=<User-Pool-ID>
REACT_APP_USER_POOL_WEB_CLIENT_ID=<User-Pool-Client-ID>
```

## Step 4: Running the Application

### Running Infrastructure Locally

1. Start the local API:
```bash
cd s3-upload-infra
sam local start-api
```

The API will be available at `http://localhost:3000`

### Running UI Locally

1. Start the development server:
```bash
cd s3-upload-ui
yarn start
# or
npm start
```

The UI will be available at `http://localhost:3000`

## Step 5: Testing the Setup

1. Create a test vendor user:
```bash
aws cognito-idp admin-create-user \
    --user-pool-id <User-Pool-ID> \
    --username test-vendor \
    --temporary-password TempPass123! \
    --user-attributes Name=email,Value=test@example.com
```

2. Set up the vendor's folder in S3:
```bash
aws s3api put-object \
    --bucket <S3-Bucket-Name> \
    --key vendor-1/
```

3. Access the application:
- Open `http://localhost:3000` in your browser
- Log in with the test vendor credentials
- Verify access to the vendor's folder
- Test file upload functionality

## Step 6: Monitoring and Logs

### Infrastructure Logs
```bash
# View Lambda function logs
sam logs -n FunctionName --stack-name <stack-name> --tail

# View API Gateway logs
aws logs get-log-events --log-group-name /aws/apigateway/<api-name>
```

### UI Logs
- Check browser console for frontend logs
- Check Network tab for API calls

## Step 7: Cleanup

1. Delete the Amplify backend:
```bash
cd s3-upload-ui
amplify delete
```

2. Delete the SAM stack:
```bash
cd ../s3-upload-infra
aws cloudformation delete-stack --stack-name <stack-name>
```

3. Empty and delete the S3 bucket:
```bash
aws s3 rm s3://<bucket-name> --recursive
aws s3api delete-bucket --bucket <bucket-name>
```

## Troubleshooting

### Common Issues

1. SAM Build Issues
```bash
# Clean the build directory
rm -rf .aws-sam
# Rebuild
sam build --use-container
```

2. UI Connection Issues
- Verify API endpoint in `.env`
- Check CORS settings in API Gateway
- Verify Cognito configuration

3. Permission Issues
- Check IAM roles and policies
- Verify bucket policies
- Check user pool settings

### Getting Help

- Check CloudWatch Logs for detailed error messages
- Review API Gateway logs for API issues
- Check browser console for UI errors
- Contact the development team for support

## Security Notes

- Never commit `.env` files or credentials
- Use IAM roles with least privilege
- Enable CloudTrail for audit logging
- Regularly rotate access keys
- Monitor CloudWatch alarms

## Next Steps

1. Set up CI/CD pipeline
2. Configure monitoring and alerts
3. Implement backup strategy
4. Set up cross-account access
5. Configure custom domain names 