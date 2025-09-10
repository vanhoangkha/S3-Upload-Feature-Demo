import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth, requireRole } from '../lib/auth';
import { validateInput, listDocumentsSchema } from '../lib/validation';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';
import { queryDocumentsByVendor } from '../lib/dynamodb';
import { sanitizeEvent, createSafeResponse } from '../lib/security';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const validatedEvent = sanitizeEvent(event);
    const auth = requireAuth(validatedEvent);
    requireRole(auth, ['Vendor', 'Admin']);
    
    const queryParams = validatedEvent.queryStringParameters || {};
    const query = validateInput(listDocumentsSchema, queryParams);
    
    const result = await queryDocumentsByVendor(
      auth.vendorId,
      query.limit,
      undefined,
      query.includeDeleted
    );
    
    logger.info('Vendor documents retrieved', {
      requestId,
      actor: auth,
      action: 'getVendorDocuments',
      result: 'success',
      count: result.items.length,
      latency_ms: Date.now() - startTime
    });
    
    return createSafeResponse(200, {
      items: result.items,
      total: result.items.length
    });
  } catch (error) {
    logger.error('Get vendor documents failed', {
      requestId,
      action: 'getVendorDocuments',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });
    
    return createErrorResponse(error as Error);
  }
};
