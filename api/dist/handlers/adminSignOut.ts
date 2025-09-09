import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  AdminUserGlobalSignOutCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { requireAuth, requireAdmin } from '../lib/auth';
import { createErrorResponse, NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { auditLog } from '../lib/audit';

const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || '';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAuth(event);
    requireAdmin(auth);

    const userId = event.pathParameters?.id;
    if (!userId) {
      throw new NotFoundError('User ID is required');
    }

    const command = new AdminUserGlobalSignOutCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId
    });

    await cognitoClient.send(command);

    await auditLog({
      actor: auth,
      action: 'user.signout',
      resource: { type: 'user', id: userId },
      result: 'success'
    });

    logger.info('User signed out successfully', {
      requestId,
      actor: auth,
      action: 'adminSignOut',
      resource: { type: 'user', id: userId },
      result: 'success',
      latency_ms: Date.now() - startTime
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
      }
    };

  } catch (error) {
    logger.error('Sign out user failed', {
      requestId,
      action: 'adminSignOut',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
