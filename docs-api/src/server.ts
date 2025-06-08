import { serve } from '@hono/node-server';
import app from './index';
import { config } from './utils/aws-config';
import { logger } from './utils/logger';

// Load environment variables
const PORT = parseInt(process.env.PORT || '3001');

logger.serverInfo('Starting Documents API Server...');
logger.configInfo('Configuration:');
logger.configInfo(`  - Port: ${PORT}`);
logger.configInfo(`  - Environment: ${process.env.NODE_ENV || 'development'}`);
logger.configInfo(`  - AWS Region: ${config.region}`);
logger.configInfo(`  - DynamoDB Tables: ${config.documentsTableName}, ${config.generalTableName}`);
logger.configInfo(`  - S3 Buckets: ${config.documentStoreBucketName}, ${config.webStoreBucketName}`);
logger.configInfo(`  - CORS Origins: ${config.allowedOrigins.join(', ')}`);

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  logger.serverInfo(`Server running on http://localhost:${info.port}`);
  logger.info('Available endpoints:');
  logger.info('  - GET  /health');
  logger.info('  - GET  /vib-documents-function/api/documents');
  logger.info('  - GET  /vib-documents-function/api/documents/folders');
  logger.info('  - POST /vib-documents-function/api/documents/folders');
  logger.info('  - POST /vib-documents-function/api/documents/presigned-url');
  logger.info('  - POST /vib-documents-function/api/documents');
  logger.info('  - GET  /vib-documents-function/api/documents/:user_id/:file');
  logger.info('  - GET  /vib-documents-function/api/documents/:user_id/:file/download');
  logger.info('  - DELETE /vib-documents-function/api/documents/:user_id/:file');
});
