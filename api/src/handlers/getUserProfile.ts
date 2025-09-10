import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth } from '../lib/auth';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';
import { sanitizeEvent, createSafeResponse } from '../lib/security';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const validatedEvent = sanitizeEvent(event);
    const auth = requireAuth(validatedEvent);
    
    const profile = {
      userId: auth.userId,
      vendorId: auth.vendorId,
      roles: auth.roles,
      email: auth.email,
      username: auth.email?.split('@')[0] || auth.userId,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    logger.info('User profile retrieved', {
      requestId,
      actor: auth,
      action: 'getUserProfile',
      result: 'success',
      latency_ms: Date.now() - startTime
    });
    
    return createSafeResponse(200, profile);
  } catch (error) {
    logger.error('Get user profile failed', {
      requestId,
      action: 'getUserProfile',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });
    
    return createErrorResponse(error as Error);
  }
};
