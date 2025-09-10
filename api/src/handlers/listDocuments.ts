import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth } from '../lib/auth';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';
import { queryDocumentsByUser, queryDocumentsByVendor } from '../lib/dynamodb';
import { sanitizeEvent, createSafeResponse } from '../lib/security';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const validatedEvent = sanitizeEvent(event);
    const auth = requireAuth(validatedEvent);
    
    logger.info('List documents request', {
      requestId,
      actor: auth,
      action: 'listDocuments'
    });

    const query = validatedEvent.queryStringParameters || {};
    const limit = parseInt((query as any).limit || '50');
    const includeDeleted = (query as any).includeDeleted === 'true';
    
    let result;
    
    // Admin can see all, Vendor sees vendor docs, User sees own docs
    if (auth.roles.includes('Admin')) {
      // For simplicity, admin sees vendor docs if vendorId provided
      const vendorId = (query as any).vendorId || auth.vendorId;
      result = await queryDocumentsByVendor(vendorId, limit, undefined, includeDeleted);
    } else if (auth.roles.includes('Vendor')) {
      result = await queryDocumentsByVendor(auth.vendorId, limit, undefined, includeDeleted);
    } else {
      result = await queryDocumentsByUser(auth.userId, limit, undefined, includeDeleted);
    }

    logger.info('List documents completed', {
      requestId,
      count: result.documents?.length || 0,
      duration: Date.now() - startTime
    });

    return createSafeResponse(200, {
      documents: result.documents || [],
      total: result.total || 0
    });

  } catch (error) {
    logger.error('List documents failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    });

    return createErrorResponse(error);
  }
};
