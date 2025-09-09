import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  AdminUpdateUserAttributesCommand,
  AdminListGroupsForUserCommand,
  AdminRemoveUserFromGroupCommand,
  AdminAddUserToGroupCommand,
  AdminUserGlobalSignOutCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { requireAuth, requireAdmin } from '../lib/auth';
import { validateInput, updateRolesSchema } from '../lib/validation';
import { createErrorResponse, NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { auditLog } from '../lib/audit';

const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || '';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAdmin(event);

    const userId = event.pathParameters?.id;
    if (!userId) {
      throw new NotFoundError('User ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    const input = validateInput(updateRolesSchema, body);

    // Update vendor_id if provided
    if (input.vendor_id) {
      const updateCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: userId,
        UserAttributes: [
          { Name: 'custom:vendor_id', Value: input.vendor_id }
        ]
      });
      await cognitoClient.send(updateCommand);
    }

    // Get current groups
    const listGroupsCommand = new AdminListGroupsForUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId
    });
    const currentGroups = await cognitoClient.send(listGroupsCommand);

    // Remove from all current groups
    for (const group of currentGroups.Groups || []) {
      const removeCommand = new AdminRemoveUserFromGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: userId,
        GroupName: group.GroupName!
      });
      await cognitoClient.send(removeCommand);
    }

    // Add to new groups
    for (const group of input.groups) {
      const addCommand = new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: userId,
        GroupName: group
      });
      await cognitoClient.send(addCommand);
    }

    // Force global signout to refresh tokens
    const signOutCommand = new AdminUserGlobalSignOutCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId
    });
    await cognitoClient.send(signOutCommand);

    await auditLog({
      actor: auth,
      action: 'user.role_change',
      resource: { type: 'user', id: userId },
      result: 'success',
      details: { 
        vendor_id: input.vendor_id,
        old_groups: currentGroups.Groups?.map(g => g.GroupName),
        new_groups: input.groups
      }
    });

    logger.info('User roles updated successfully', {
      requestId,
      actor: auth,
      action: 'adminUpdateRoles',
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
    logger.error('Update roles failed', {
      requestId,
      action: 'adminUpdateRoles',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
