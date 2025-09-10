# Deployment Examples

## Extracting Environment Variables

After running `terraform apply`, you can extract the outputs to create environment files:

### For docs-api (.env)

```bash
# Create .env file for docs-api
cat > ../docs-api/.env << EOF
AWS_REGION=$(terraform output -raw aws_region)
DOCUMENTS_TABLE_NAME=$(terraform output -raw documents_table_name)
GENERAL_TABLE_NAME=$(terraform output -raw general_table_name)
DOCUMENT_STORE_BUCKET_NAME=$(terraform output -raw document_store_bucket_name)
WEB_STORE_BUCKET_NAME=$(terraform output -raw web_store_bucket_name)
COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
API_GATEWAY_URL=$(terraform output -raw api_gateway_url)
NODE_ENV=production
PRESIGNED_URL_EXPIRY=3600
ALLOWED_ORIGINS=http://localhost:3000
EOF
```

### For docs-ui (.env)

```bash
# Create .env file for docs-ui
cat > ../docs-ui/.env << EOF
REACT_APP_API_URL=$(terraform output -raw api_gateway_url)/api
REACT_APP_ENV=production
REACT_APP_DEFAULT_USER_ID=demo-user
REACT_APP_AWS_REGION=$(terraform output -raw aws_region)
REACT_APP_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
REACT_APP_USER_POOL_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id)
REACT_APP_IDENTITY_POOL_ID=$(terraform output -raw cognito_identity_pool_id)
REACT_APP_S3_BUCKET=$(terraform output -raw web_store_bucket_name)
EOF
```

> **Note**: The `aws-exports.js` file now reads from these environment variables automatically, so no manual updates to that file are needed.

## Viewing Outputs

```bash
# View all outputs
terraform output

# View specific output
terraform output api_gateway_url

# View output in JSON format
terraform output -json

# View output in raw format (no quotes)
terraform output -raw cognito_user_pool_id
```

## Testing the Deployment

### Test API Gateway

```bash
# Get the API URL
API_URL=$(terraform output -raw api_gateway_url)

# Test health endpoint
curl "${API_URL}/health"
```

### Verify Resources

```bash
# List DynamoDB tables
aws dynamodb list-tables

# List S3 buckets
aws s3 ls

# List Lambda functions
aws lambda list-functions

# List Cognito user pools
aws cognito-idp list-user-pools --max-items 10
```
