import { serve } from '@hono/node-server';
import app from './index';
import { config } from './utils/aws-config';

// Load environment variables
const PORT = parseInt(process.env.PORT || '3001');

console.log('🚀 Starting Documents API Server...');
console.log('📊 Configuration:');
console.log(`  - Port: ${PORT}`);
console.log(`  - Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`  - AWS Region: ${config.region}`);
console.log(`  - DynamoDB Tables: ${config.documentsTableName}, ${config.generalTableName}`);
console.log(`  - S3 Buckets: ${config.documentStoreBucketName}, ${config.webStoreBucketName}`);
console.log(`  - CORS Origins: ${config.allowedOrigins.join(', ')}`);

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`✅ Server running on http://localhost:${info.port}`);
  console.log('📝 Available endpoints:');
  console.log('  - GET  /health');
  console.log('  - GET  /api/documents');
  console.log('  - POST /api/documents/presigned-url');
  console.log('  - POST /api/documents');
  console.log('  - GET  /api/documents/:user_id/:file');
  console.log('  - PUT  /api/documents/:user_id/:file');
  console.log('  - GET  /api/documents/:user_id/:file/download');
  console.log('  - DELETE /api/documents/:user_id/:file');
});
