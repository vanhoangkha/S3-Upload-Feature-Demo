import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, ListUsersCommand, AdminListGroupsForUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { requireAdmin } from '../lib/rbac';
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
    const auth = requireAdmin(validatedEvent);

    const queryParams = validatedEvent.queryStringParameters || {};
    const { limit, nextToken } = validateInput(listUsersSchema, queryParams);

    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: limit,
      PaginationToken: nextToken
    });

    const response = await cognitoClient.send(command);

    // Get groups for all users concurrently
    const usersWithGroups = await Promise.all(
      (response.Users || []).map(async (user) => {
        try {
          const groupsCommand = new AdminListGroupsForUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: user.Username!
          });
          const groupsResponse = await cognitoClient.send(groupsCommand);
          
          return {
            username: user.Username,
            status: user.UserStatus,
            email: user.Attributes?.find(attr => attr.Name === 'email')?.Value,
            vendor_id: user.Attributes?.find(attr => attr.Name === 'custom:vendor_id')?.Value,
            groups: groupsResponse.Groups?.map(g => g.GroupName) || [],
            created: user.UserCreateDate?.toISOString(),
            lastModified: user.UserLastModifiedDate?.toISOString()
          };
        } catch (error) {
          return {
            username: user.Username,
            status: user.UserStatus,
            email: user.Attributes?.find(attr => attr.Name === 'email')?.Value,
            vendor_id: user.Attributes?.find(attr => attr.Name === 'custom:vendor_id')?.Value,
            groups: [],
            created: user.UserCreateDate?.toISOString(),
            lastModified: user.UserLastModifiedDate?.toISOString()
          };
        }
      })
    );

    logger.info('Users listed successfully', {
      requestId,
      actor: auth,
      action: 'adminListUsers',
      result: 'success',
      count: usersWithGroups.length,
      latency_ms: Date.now() - startTime
    });

    return createSafeResponse(200, {
      items: usersWithGroups,
      nextToken: response.PaginationToken
    });

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
