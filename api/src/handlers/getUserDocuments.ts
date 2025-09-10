import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth } from '../lib/auth';
import { validateInput, listDocumentsSchema } from '../lib/validation';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';
import { queryDocumentsByUser } from '../lib/dynamodb';
import { sanitizeEvent, createSafeResponse } from '../lib/security';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const validatedEvent = sanitizeEvent(event);
    const auth = requireAuth(validatedEvent);
    
    const queryParams = validatedEvent.queryStringParameters || {};
    const query = validateInput(listDocumentsSchema, queryParams);
    
    const result = await queryDocumentsByUser(
      auth.userId,
      query.limit,
      undefined,
      query.includeDeleted
    );
    
    logger.info('User documents retrieved', {
      requestId,
      actor: auth,
      action: 'getUserDocuments',
      result: 'success',
      count: result.items.length,
      latency_ms: Date.now() - startTime
    });
    
    return createSafeResponse(200, {
      items: result.items,
      total: result.items.length
    });
  } catch (error) {
    logger.error('Get user documents failed', {
      requestId,
      action: 'getUserDocuments',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });
    
    return createErrorResponse(error as Error);
  }
};
