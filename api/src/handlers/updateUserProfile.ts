import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth } from '../lib/auth';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';
import { sanitizeEvent, safeJsonParse, createSafeResponse } from '../lib/security';
import { auditLog } from '../lib/audit';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const validatedEvent = sanitizeEvent(event);
    const auth = requireAuth(validatedEvent);
    
    const body = safeJsonParse(validatedEvent.body);
    const { name, preferences } = body;
    
    const updatedProfile = {
      userId: auth.userId,
      vendorId: auth.vendorId,
      roles: auth.roles,
      email: auth.email,
      name: name || auth.email?.split('@')[0] || auth.userId,
      preferences: preferences || {},
      updatedAt: new Date().toISOString()
    };
    
    await auditLog({
      actor: auth,
      action: 'user.profile_update',
      resource: { type: 'user', id: auth.userId },
      result: 'success',
      details: { name, preferences }
    });
    
    logger.info('User profile updated', {
      requestId,
      actor: auth,
      action: 'updateUserProfile',
      result: 'success',
      latency_ms: Date.now() - startTime
    });
    
    return createSafeResponse(200, updatedProfile);
  } catch (error) {
    logger.error('Update user profile failed', {
      requestId,
      action: 'updateUserProfile',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });
    
    return createErrorResponse(error as Error);
  }
};
