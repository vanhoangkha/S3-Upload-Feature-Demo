import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

// AWS configuration - uses default credential chain
// This will automatically use:
// 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) if set
// 2. AWS CLI profile (~/.aws/credentials)
// 3. EC2 instance profile (if running on EC2)
// 4. ECS task role (if running on ECS)
// 5. Lambda execution role (if running on Lambda)
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
};

// Initialize AWS clients
export const dynamoClient = new DynamoDBClient(awsConfig);

export const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const s3Client = new S3Client(awsConfig);

// Environment variables
export const config = {
  documentsTableName: process.env.DOCUMENTS_TABLE_NAME || 'Documents',
  generalTableName: process.env.GENERAL_TABLE_NAME || 'General',
  documentStoreBucketName: process.env.DOCUMENT_STORE_BUCKET_NAME || 'vibdmsstore2026',
  webStoreBucketName: process.env.WEB_STORE_BUCKET_NAME || 'vibdmswebstore2026',
  region: process.env.AWS_REGION || 'us-east-1',
  presignedUrlExpiry: parseInt(process.env.PRESIGNED_URL_EXPIRY || '3600'),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID,
  apiGatewayUrl: process.env.API_GATEWAY_URL,
};
