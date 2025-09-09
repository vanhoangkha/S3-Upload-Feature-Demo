import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from './lib/logger';

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
import { handler as getUserDocuments } from './handlers/getUserDocuments';
import { handler as getUserProfile } from './handlers/getUserProfile';
import { handler as updateUserProfile } from './handlers/updateUserProfile';
import { handler as getVendorDocuments } from './handlers/getVendorDocuments';
import { handler as getVendorUsers } from './handlers/getVendorUsers';
import { handler as getVendorStats } from './handlers/getVendorStats';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path } = event;
  const requestId = event.requestContext.requestId;

  logger.info('Incoming request', {
    requestId,
    httpMethod,
    path,
    sourceIp: event.requestContext.identity?.sourceIp
  });

  try {
    // Health check
    if (path === '/health' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
      };
    }

    // Route to appropriate handler
    const route = `${httpMethod} ${path}`;
    
    switch (route) {
      case 'GET /me':
        return await whoAmI(event);
      case 'GET /files':
        return await listDocuments(event);
      case 'POST /files':
        return await createDocument(event);
      case 'POST /files/presign/upload':
        return await presignUpload(event);
      case 'POST /files/presign/download':
        return await presignDownload(event);
      case 'GET /admin/users':
        return await adminListUsers(event);
      case 'POST /admin/users':
        return await adminCreateUser(event);
      case 'GET /admin/audits':
        return await adminAudits(event);
      case 'GET /user/documents':
        return await getUserDocuments(event);
      case 'GET /user/profile':
        return await getUserProfile(event);
      case 'PATCH /user/profile':
        return await updateUserProfile(event);
      case 'GET /vendor/documents':
        return await getVendorDocuments(event);
      case 'GET /vendor/users':
        return await getVendorUsers(event);
      case 'GET /vendor/stats':
        return await getVendorStats(event);
      default:
        // Handle parameterized routes
        if (httpMethod === 'GET' && path.match(/^\/files\/[^\/]+$/)) {
          return await getDocument(event);
        }
        if (httpMethod === 'PATCH' && path.match(/^\/files\/[^\/]+$/)) {
          return await updateDocument(event);
        }
        if (httpMethod === 'DELETE' && path.match(/^\/files\/[^\/]+$/)) {
          return await deleteDocument(event);
        }
        if (httpMethod === 'POST' && path.match(/^\/files\/[^\/]+\/restore$/)) {
          return await restoreDocument(event);
        }
        if (httpMethod === 'GET' && path.match(/^\/files\/[^\/]+\/versions$/)) {
          return await listVersions(event);
        }
        if (httpMethod === 'POST' && path.match(/^\/admin\/users\/[^\/]+\/roles$/)) {
          return await adminUpdateRoles(event);
        }
        if (httpMethod === 'POST' && path.match(/^\/admin\/users\/[^\/]+\/signout$/)) {
          return await adminSignOut(event);
        }

        logger.warn('Route not found', { requestId, route });
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Not Found' })
        };
    }
  } catch (error) {
    logger.error('Request failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
};
