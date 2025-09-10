import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { requireAuth, requireRole } from '../lib/auth';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';
import { queryDocumentsByVendor } from '../lib/dynamodb';
import { sanitizeEvent, createSafeResponse } from '../lib/security';

const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || '';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const validatedEvent = sanitizeEvent(event);
    const auth = requireAuth(validatedEvent);
    requireRole(auth, ['Vendor', 'Admin']);
    
    // Get document count and storage
    const documents = await queryDocumentsByVendor(auth.vendorId, 1000);
    const totalDocuments = documents.items.length;
    const storageUsed = documents.items.reduce((total, doc) => total + (doc.size || 0), 0);
    
    // Get user count
    const usersCommand = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `custom:vendor_id = "${auth.vendorId}"`
    });
    const usersResponse = await cognitoClient.send(usersCommand);
    const totalUsers = usersResponse.Users?.length || 0;
    
    const stats = {
      totalDocuments,
      totalUsers,
      storageUsed,
      averageDocumentSize: totalDocuments > 0 ? Math.round(storageUsed / totalDocuments) : 0,
      lastUpdated: new Date().toISOString()
    };
    
    logger.info('Vendor stats retrieved', {
      requestId,
      actor: auth,
      action: 'getVendorStats',
      result: 'success',
      stats,
      latency_ms: Date.now() - startTime
    });
    
    return createSafeResponse(200, stats);
  } catch (error) {
    logger.error('Get vendor stats failed', {
      requestId,
      action: 'getVendorStats',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });
    
    return createErrorResponse(error as Error);
  }
};
