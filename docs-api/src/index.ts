import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { documents } from './routes/documents';
import { ApiResponse } from './types';
import { config } from './utils/aws-config';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: config.allowedOrigins,
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

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
app.route('/api/documents', documents);

// Root endpoint
app.get('/', (c) => {
  return c.json<ApiResponse>({
    success: true,
    message: 'Documents API Server',
    data: {
      endpoints: [
        'GET /health - Health check',
        'GET /api/documents - List documents',
        'POST /api/documents/presigned-url - Generate presigned URLs',
        'POST /api/documents - Create document',
        'GET /api/documents/:user_id/:file - Get document',
        'GET /api/documents/:user_id/:file/download - Get download URL',
        'DELETE /api/documents/:user_id/:file - Delete document'
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
  console.error('Unhandled error:', err);
  return c.json<ApiResponse>({
    success: false,
    error: 'Internal Server Error'
  }, 500);
});

export default app;
