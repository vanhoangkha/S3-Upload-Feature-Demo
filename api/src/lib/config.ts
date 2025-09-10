export const config = {
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_GcPiggAiS',
    clientId: process.env.COGNITO_CLIENT_ID || '',
    region: process.env.AWS_REGION || 'us-east-1'
  },
  dynamodb: {
    tableName: process.env.DYNAMODB_TABLE_NAME || 'dms-documents',
    auditTableName: process.env.AUDIT_TABLE_NAME || 'dms-audit-logs'
  },
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || 'dms-documents-bucket'
  }
};
