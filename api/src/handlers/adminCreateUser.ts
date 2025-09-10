import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { requireAuth, requireAdmin } from '../lib/auth';
import { validateInput, createUserSchema } from '../lib/validation';
import { createErrorResponse, BadRequestError } from '../lib/errors';
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

    const body = safeJsonParse(validatedEvent.body);
    const input = validateInput(createUserSchema, body);

    // Validate groups
    const validGroups = ['Admin', 'Vendor', 'User'];
    const invalidGroups = (input.groups || []).filter(g => !validGroups.includes(g));
    if (invalidGroups.length > 0) {
      throw new BadRequestError(`Invalid groups: ${invalidGroups.join(', ')}`);
    }

    // Create user
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: input.usernameOrEmail,
      UserAttributes: [
        { Name: 'email', Value: input.usernameOrEmail },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'custom:vendor_id', Value: input.vendor_id }
      ],
      MessageAction: 'SUPPRESS'
    });

    await cognitoClient.send(createCommand);

    // Add to groups concurrently
    if (input.groups && input.groups.length > 0) {
      const groupCommands = input.groups.map(group => 
        new AdminAddUserToGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: input.usernameOrEmail,
          GroupName: group
        })
      );
      
      await Promise.all(
        groupCommands.map(command => cognitoClient.send(command))
      );
    }

    await auditLog({
      actor: auth,
      action: 'user.create',
      resource: { type: 'user', id: input.usernameOrEmail },
      result: 'success',
      details: { vendor_id: input.vendor_id, groups: input.groups }
    });

    logger.info('User created successfully', {
      requestId,
      actor: auth,
      action: 'adminCreateUser',
      resource: { type: 'user', id: input.usernameOrEmail },
      result: 'success',
      latency_ms: Date.now() - startTime
    });

    return createSafeResponse(201, {
      username: input.usernameOrEmail,
      vendor_id: input.vendor_id,
      groups: input.groups || ['User'],
      status: 'FORCE_CHANGE_PASSWORD',
      created: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Create user failed', {
      requestId,
      action: 'adminCreateUser',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
