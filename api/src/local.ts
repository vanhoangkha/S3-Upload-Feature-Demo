import express from 'express';
import cors from 'cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Import all handlers
import { handler as whoAmI } from './handlers/whoAmI';
import { handler as listDocuments } from './handlers/listDocuments';
import { handler as createDocument } from './handlers/createDocument';
import { handler as getDocument } from './handlers/getDocument';
import { handler as updateDocument } from './handlers/updateDocument';
import { handler as deleteDocument } from './handlers/deleteDocument';
import { handler as restoreDocument } from './handlers/restoreDocument';
import { handler as listVersions } from './handlers/listVersions';
import { handler as presignUpload } from './handlers/presignUpload';
import { handler as presignDownload } from './handlers/presignDownload';
import { handler as adminListUsers } from './handlers/adminListUsers';
import { handler as adminCreateUser } from './handlers/adminCreateUser';
import { handler as adminUpdateRoles } from './handlers/adminUpdateRoles';
import { handler as adminSignOut } from './handlers/adminSignOut';
import { handler as adminAudits } from './handlers/adminAudits';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Convert Express request to Lambda event
const createLambdaEvent = (req: express.Request): APIGatewayProxyEvent => {
  return {
    httpMethod: req.method,
    path: req.path,
    pathParameters: req.params,
    queryStringParameters: req.query as any,
    headers: req.headers as any,
    body: req.body ? JSON.stringify(req.body) : null,
    isBase64Encoded: false,
    requestContext: {
      requestId: Math.random().toString(36),
      stage: 'dev',
      httpMethod: req.method,
      path: req.path,
      accountId: '123456789012',
      resourceId: 'resource',
      resourcePath: req.path,
      apiId: 'local-api'
    } as any,
    resource: req.path,
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: {}
  };
};

// Lambda context
const lambdaContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'local-dev',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:local-dev',
  memoryLimitInMB: '256',
  awsRequestId: 'local-request',
  logGroupName: '/aws/lambda/local-dev',
  logStreamName: 'local-stream',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {}
};

// Route handlers
const handleLambda = (handler: any) => async (req: express.Request, res: express.Response) => {
  try {
    const event = createLambdaEvent(req);
    const result: APIGatewayProxyResult = await handler(event, lambdaContext);
    
    res.status(result.statusCode);
    
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.set(key, value as string);
      });
    }
    
    res.send(result.body);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API Routes
app.get('/v1/me', handleLambda(whoAmI));
app.get('/v1/files', handleLambda(listDocuments));
app.post('/v1/files', handleLambda(createDocument));
app.get('/v1/files/:id', handleLambda(getDocument));
app.patch('/v1/files/:id', handleLambda(updateDocument));
app.delete('/v1/files/:id', handleLambda(deleteDocument));
app.post('/v1/files/:id/restore', handleLambda(restoreDocument));
app.get('/v1/files/:id/versions', handleLambda(listVersions));
app.post('/v1/files/presign/upload', handleLambda(presignUpload));
app.post('/v1/files/presign/download', handleLambda(presignDownload));

// Admin routes
app.get('/v1/admin/users', handleLambda(adminListUsers));
app.post('/v1/admin/users', handleLambda(adminCreateUser));
app.post('/v1/admin/users/:id/roles', handleLambda(adminUpdateRoles));
app.post('/v1/admin/users/:id/signout', handleLambda(adminSignOut));
app.get('/v1/admin/audits', handleLambda(adminAudits));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 DMS API Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/v1`);
});
