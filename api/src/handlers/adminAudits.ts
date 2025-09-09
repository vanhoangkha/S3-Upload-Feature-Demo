import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth, requireAdmin } from '../lib/auth';
import { validateInput, auditQuerySchema } from '../lib/validation';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';
import { queryAuditRecords } from '../lib/dynamodb';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAdmin(event);

    const queryParams = event.queryStringParameters || {};
    const query = validateInput(auditQuerySchema, queryParams);

    const result = await queryAuditRecords(
      query.startDate,
      query.endDate,
      query.actor,
      query.action,
      query.limit
    );

    logger.info('Audit records retrieved successfully', {
      requestId,
      actor: auth,
      action: 'adminAudits',
      result: 'success',
      count: result.items.length,
      latency_ms: Date.now() - startTime
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: result.items
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
      }
    };

  } catch (error) {
    logger.error('Get audit records failed', {
      requestId,
      action: 'adminAudits',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
