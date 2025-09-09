import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { requireAuth } from '../lib/auth';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAuth(event);
    
    logger.info('Who am I request', {
      requestId,
      actor: auth,
      action: 'whoAmI'
    });

    const userInfo = {
      userId: auth.userId,
      vendorId: auth.vendorId,
      roles: auth.roles
    };

    logger.info('User info retrieved', {
      requestId,
      actor: auth,
      action: 'whoAmI',
      result: 'success',
      latency_ms: Date.now() - startTime
    });

    return {
      statusCode: 200,
      body: JSON.stringify(userInfo),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
      }
    };

  } catch (error) {
    logger.error('Who am I failed', {
      requestId,
      action: 'whoAmI',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
