import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { documents } from './routes/documents';
import { ApiResponse } from './types';
import { config } from './utils/aws-config';
import { optionalAuthMiddleware } from './middleware/auth';
import { logger } from './utils/logger';

const app = new Hono();

// Middleware
app.use('*', honoLogger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: config.allowedOrigins,
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Add optional authentication middleware to extract user context
app.use('*', optionalAuthMiddleware);

// Health check endpoint
app.get('/health', (c) => {
  return c.json<ApiResponse>({
    success: true,
    message: 'API is healthy',
    data: {
      timestamp: new Date().toISOString(),
      service: 'docs-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// API routes
app.route('/vib-documents-function/api/documents', documents);

// Root endpoint
app.get('/', (c) => {
  return c.json<ApiResponse>({
    success: true,
    message: 'Documents API Server',
    data: {
      endpoints: [
        'GET /health - Health check',
        'GET /vib-documents-function/api/documents - List documents',
        'GET /vib-documents-function/api/documents/folders - List folders and files',
        'POST /vib-documents-function/api/documents/folders - Create folder',
        'POST /vib-documents-function/api/documents/presigned-url - Generate presigned URLs',
        'POST /vib-documents-function/api/documents - Create document',
        'GET /vib-documents-function/api/documents/:user_id/:file - Get document',
        'GET /vib-documents-function/api/documents/:user_id/:file/download - Get download URL',
        'DELETE /vib-documents-function/api/documents/:user_id/:file - Delete document'
      ]
    }
  });
});

// 404 handler
app.notFound((c) => {
  return c.json<ApiResponse>({
    success: false,
    error: 'Not Found'
  }, 404);
});

// Error handler
app.onError((err, c) => {
  logger.error('Unhandled error:', err);
  return c.json<ApiResponse>({
    success: false,
    error: 'Internal Server Error'
  }, 500);
});

export default app;
