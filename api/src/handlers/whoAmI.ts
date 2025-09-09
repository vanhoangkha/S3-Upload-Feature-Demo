import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth } from '../lib/auth';
import { createSuccessResponse, createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;

  try {
    // Debug: Log the entire event context
    logger.info('WhoAmI debug - event context', {
      requestId,
      authorizer: event.requestContext.authorizer,
      headers: event.headers
    });

    const auth = requireAuth(event);

    logger.info('Who am I request', {
      requestId,
      actor: auth,
      action: 'whoAmI'
    });

    const response = {
      userId: auth.userId,
      vendorId: auth.vendorId,
      roles: auth.roles,
      email: auth.email || null,
      username: auth.email?.split('@')[0] || auth.userId
    };

    logger.info('Who am I success', {
      requestId,
      actor: auth,
      action: 'whoAmI',
      result: 'success',
      latency_ms: Date.now() - startTime
    });

    return createSuccessResponse(response);

  } catch (error) {
    logger.error('Who am I failed', {
      requestId,
      action: 'whoAmI',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error);
  }
};
