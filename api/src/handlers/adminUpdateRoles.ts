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
import { createErrorResponse, NotFoundError, BadRequestError } from '../lib/errors';
import { logger } from '../lib/logger';
import { auditLog } from '../lib/audit';
import { sanitizeEvent, safeJsonParse, createSafeResponse } from '../lib/security';

const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || '';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const validatedEvent = sanitizeEvent(event);
    const auth = requireAdmin(validatedEvent);

    const userId = validatedEvent.pathParameters?.id;
    if (!userId) {
      throw new NotFoundError('User ID is required');
    }

    const body = safeJsonParse(validatedEvent.body);
    const input = validateInput(updateRolesSchema, body);

    // Validate target groups exist first
    const validGroups = ['Admin', 'Vendor', 'User'];
    const invalidGroups = input.groups.filter(g => !validGroups.includes(g));
    if (invalidGroups.length > 0) {
      throw new BadRequestError(`Invalid groups: ${invalidGroups.join(', ')}`);
    }

    // Get current state for rollback
    const currentGroups = await cognitoClient.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: userId
      })
    );

    try {
      // Update vendor_id if provided
      if (input.vendor_id) {
        await cognitoClient.send(new AdminUpdateUserAttributesCommand({
          UserPoolId: USER_POOL_ID,
          Username: userId,
          UserAttributes: [
            { Name: 'custom:vendor_id', Value: input.vendor_id }
          ]
        }));
      }

      // Remove from current groups
      for (const group of currentGroups.Groups || []) {
        await cognitoClient.send(new AdminRemoveUserFromGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: userId,
          GroupName: group.GroupName!
        }));
      }
      
      // Add to new groups
      for (const group of input.groups) {
        await cognitoClient.send(new AdminAddUserToGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: userId,
          GroupName: group
        }));
      }
      
    } catch (error) {
      // Rollback: restore original groups
      for (const group of currentGroups.Groups || []) {
        try {
          await cognitoClient.send(new AdminAddUserToGroupCommand({
            UserPoolId: USER_POOL_ID,
            Username: userId,
            GroupName: group.GroupName!
          }));
        } catch (rollbackError) {
          logger.error('Rollback failed', { userId, group: group.GroupName, error: rollbackError });
        }
      }
      throw error;
    }

    // Force signout after successful update
    await cognitoClient.send(new AdminUserGlobalSignOutCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId
    }));

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

    return createSafeResponse(200, { 
      success: true,
      userId,
      newGroups: input.groups,
      updatedAt: new Date().toISOString()
    });

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
