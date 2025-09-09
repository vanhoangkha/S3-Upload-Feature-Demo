import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth, assertAccess } from '../lib/auth';
import { validateInput, listDocumentsSchema } from '../lib/validation';
import { createErrorResponse, BadRequestError } from '../lib/errors';
import { logger } from '../lib/logger';
import { queryDocumentsByUser, queryDocumentsByVendor } from '../lib/dynamodb';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAuth(event);
    
    logger.info('List documents request', {
      requestId,
      actor: auth,
      action: 'listDocuments'
    });

    const queryParams = event.queryStringParameters || {};
    
    // Parse tags if provided
    const parsedParams: any = { ...queryParams };
    if (queryParams.tags) {
      parsedParams.tags = Array.isArray(queryParams.tags) 
        ? queryParams.tags 
        : (queryParams.tags as string).split(',');
    }

    const query = validateInput(listDocumentsSchema, parsedParams);
    
    let exclusiveStartKey;
    if (query.cursor) {
      try {
        exclusiveStartKey = JSON.parse(Buffer.from(query.cursor, 'base64').toString());
      } catch {
        throw new BadRequestError('Invalid cursor');
      }
    }

    let result;
    
    if (query.scope === 'me') {
      // List user's own documents
      result = await queryDocumentsByUser(
        auth.userId,
        query.limit,
        exclusiveStartKey,
        query.includeDeleted
      );
    } else if (query.scope === 'vendor') {
      // List all documents in vendor (requires Vendor or Admin role)
      if (!auth.roles.includes('Vendor') && !auth.roles.includes('Admin')) {
        throw new BadRequestError('Insufficient permissions for vendor scope');
      }
      
      result = await queryDocumentsByVendor(
        auth.vendorId,
        query.limit,
        exclusiveStartKey,
        query.includeDeleted
      );
    } else {
      throw new BadRequestError('Invalid scope');
    }

    // Filter by search query if provided
    let filteredItems = result.items;
    if (query.q) {
      const searchTerm = query.q.toLowerCase();
      filteredItems = result.items.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by tags if provided
    if (query.tags && query.tags.length > 0) {
      filteredItems = filteredItems.filter(doc =>
        query.tags!.some(tag => doc.tags.includes(tag))
      );
    }

    // Generate next cursor if there are more results
    let nextCursor;
    if (result.lastEvaluatedKey) {
      nextCursor = Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64');
    }

    logger.info('Documents listed successfully', {
      requestId,
      actor: auth,
      action: 'listDocuments',
      result: 'success',
      count: filteredItems.length,
      latency_ms: Date.now() - startTime
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: filteredItems,
        nextCursor,
        total: filteredItems.length
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
      }
    };

  } catch (error) {
    logger.error('List documents failed', {
      requestId,
      action: 'listDocuments',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
