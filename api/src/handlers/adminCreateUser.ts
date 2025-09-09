import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { requireAuth, requireAdmin } from '../lib/auth';
import { validateInput, createUserSchema } from '../lib/validation';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';
import { auditLog } from '../lib/audit';

const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || '';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAdmin(event);

    const body = JSON.parse(event.body || '{}');
    const input = validateInput(createUserSchema, body);

    // Create user
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: input.usernameOrEmail,
      UserAttributes: [
        { Name: 'email', Value: input.usernameOrEmail },
        { Name: 'custom:vendor_id', Value: input.vendor_id }
      ],
      MessageAction: 'SUPPRESS'
    });

    const createResponse = await cognitoClient.send(createCommand);

    // Add to groups
    if (input.groups) {
      for (const group of input.groups) {
        const groupCommand = new AdminAddUserToGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: input.usernameOrEmail,
          GroupName: group
        });
        await cognitoClient.send(groupCommand);
      }
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

    return {
      statusCode: 201,
      body: JSON.stringify({
        username: input.usernameOrEmail,
        vendor_id: input.vendor_id,
        groups: input.groups
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
      }
    };

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
