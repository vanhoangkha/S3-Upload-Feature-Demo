import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminInitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { sanitizeEvent, safeJsonParse, createSafeResponse } from '../lib/security';
import { logger } from '../lib/logger';

const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_GcPiggAiS';
const CLIENT_ID = process.env.CLIENT_ID || '5kpfm8nfp48dkinpphvlhm6fqv';

export const signIn = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const validatedEvent = sanitizeEvent(event);
    const { username, password } = safeJsonParse(validatedEvent.body);

    if (!username || !password) {
      return createSafeResponse(400, {
        error: { code: 400, message: 'Username and password are required' }
      });
    }

    const command = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: String(username).trim(),
        PASSWORD: String(password)
      }
    });

    const response = await cognitoClient.send(command);

    if (response.AuthenticationResult) {
      logger.info('Authentication successful', {
        requestId,
        username: String(username).trim(),
        latency_ms: Date.now() - startTime
      });
      
      return createSafeResponse(200, {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken
      });
    } else {
      logger.warn('Authentication failed - no result', {
        requestId,
        username: String(username).trim(),
        latency_ms: Date.now() - startTime
      });
      
      return createSafeResponse(401, {
        error: { code: 401, message: 'Authentication failed' }
      });
    }
  } catch (error: any) {
    logger.error('Authentication error', {
      requestId,
      error: error.message,
      latency_ms: Date.now() - startTime
    });
    
    return createSafeResponse(401, {
      error: { code: 401, message: 'Authentication failed' }
    });
  }
};

export const handler = signIn;
