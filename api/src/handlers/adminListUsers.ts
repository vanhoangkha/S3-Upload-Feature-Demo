import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { requireAuth, requireAdmin } from '../lib/auth';
import { validateInput, listUsersSchema } from '../lib/validation';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';

const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || '';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAdmin(event);

    const queryParams = event.queryStringParameters || {};
    const { limit, nextToken } = validateInput(listUsersSchema, queryParams);

    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: limit,
      PaginationToken: nextToken
    });

    const response = await cognitoClient.send(command);

    const users = (response.Users || []).map(user => ({
      username: user.Username,
      status: user.UserStatus,
      email: user.Attributes?.find(attr => attr.Name === 'email')?.Value,
      vendor_id: user.Attributes?.find(attr => attr.Name === 'custom:vendor_id')?.Value,
      groups: [] // Would need separate call to get groups
    }));

    logger.info('Users listed successfully', {
      requestId,
      actor: auth,
      action: 'adminListUsers',
      result: 'success',
      count: users.length,
      latency_ms: Date.now() - startTime
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: users,
        nextToken: response.PaginationToken
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
      }
    };

  } catch (error) {
    logger.error('List users failed', {
      requestId,
      action: 'adminListUsers',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
