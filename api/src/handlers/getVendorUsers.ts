import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { requireAuth, requireRole } from '../lib/auth';
import { validateInput, listUsersSchema } from '../lib/validation';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';
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
    
    const queryParams = validatedEvent.queryStringParameters || {};
    const { limit, nextToken } = validateInput(listUsersSchema, queryParams);
    
    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: limit,
      PaginationToken: nextToken,
      Filter: `custom:vendor_id = "${auth.vendorId}"`
    });
    
    const response = await cognitoClient.send(command);
    
    const users = (response.Users || []).map(user => ({
      username: user.Username,
      status: user.UserStatus,
      email: user.Attributes?.find(attr => attr.Name === 'email')?.Value,
      vendor_id: user.Attributes?.find(attr => attr.Name === 'custom:vendor_id')?.Value,
      created: user.UserCreateDate?.toISOString(),
      lastModified: user.UserLastModifiedDate?.toISOString()
    }));
    
    logger.info('Vendor users retrieved', {
      requestId,
      actor: auth,
      action: 'getVendorUsers',
      result: 'success',
      count: users.length,
      latency_ms: Date.now() - startTime
    });
    
    return createSafeResponse(200, {
      users,
      total: users.length,
      nextToken: response.PaginationToken
    });
  } catch (error) {
    logger.error('Get vendor users failed', {
      requestId,
      action: 'getVendorUsers',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });
    
    return createErrorResponse(error as Error);
  }
};
