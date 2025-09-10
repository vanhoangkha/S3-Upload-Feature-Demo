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

    logger.info('Who am I request', {
      requestId,
      actor: auth,
      action: 'whoAmI'
    });

    const userInfo = {
      userId: auth.userId,
      vendorId: auth.vendorId,
      roles: auth.roles,
      email: auth.email || null,
      username: auth.email?.split('@')[0] || auth.userId,
      permissions: {
        canViewDocuments: true,
        canCreateDocuments: true,
        canManageUsers: auth.roles.includes('Admin'),
        canViewVendorData: auth.roles.includes('Admin') || auth.roles.includes('Vendor'),
        canViewAuditLogs: auth.roles.includes('Admin')
      },
      lastLogin: new Date().toISOString()
    };

    logger.info('Who am I success', {
      requestId,
      actor: auth,
      action: 'whoAmI',
      result: 'success',
      latency_ms: Date.now() - startTime
    });

    return createSafeResponse(200, userInfo);

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
