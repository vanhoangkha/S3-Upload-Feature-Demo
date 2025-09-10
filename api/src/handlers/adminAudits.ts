import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { requireAuth, requireAdmin } from '../lib/auth';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';
import { ddbDoc } from '../lib/dynamodb';
import { sanitizeEvent, createSafeResponse } from '../lib/security';

const AUDIT_TABLE = process.env.AUDIT_TABLE || 'dms-dev-audits';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const validatedEvent = sanitizeEvent(event);
    const auth = requireAdmin(validatedEvent);

    const queryParams = validatedEvent.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || '50');
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;
    const action = queryParams.action;
    
    // Build query for audit records
    let filterExpression = '';
    const expressionAttributeValues: any = {};
    const expressionAttributeNames: any = {};
    
    if (startDate) {
      filterExpression += '#timestamp >= :startDate';
      expressionAttributeNames['#timestamp'] = 'timestamp';
      expressionAttributeValues[':startDate'] = startDate;
    }
    
    if (endDate) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += '#timestamp <= :endDate';
      expressionAttributeNames['#timestamp'] = 'timestamp';
      expressionAttributeValues[':endDate'] = endDate;
    }
    
    if (action) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += 'contains(#action, :action)';
      expressionAttributeNames['#action'] = 'action';
      expressionAttributeValues[':action'] = action;
    }

    const command = new QueryCommand({
      TableName: AUDIT_TABLE,
      IndexName: 'timestamp-index',
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': 'AUDIT',
        ...expressionAttributeValues
      },
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      FilterExpression: filterExpression || undefined,
      Limit: limit,
      ScanIndexForward: false // Most recent first
    });

    const result = await ddbDoc.send(command);
    
    // Format audit records
    const auditRecords = (result.Items || []).map(item => ({
      timestamp: item.timestamp,
      actor: {
        userId: item.actor_user_id,
        vendorId: item.actor_vendor_id,
        roles: item.actor_roles || []
      },
      action: item.action,
      resource: {
        type: item.resource_type,
        id: item.resource_id
      },
      result: item.result,
      details: item.details || {}
    }));

    logger.info('Audit records retrieved successfully', {
      requestId,
      actor: auth,
      action: 'adminAudits',
      result: 'success',
      count: auditRecords.length,
      latency_ms: Date.now() - startTime
    });

    return createSafeResponse(200, {
      items: auditRecords,
      total: auditRecords.length,
      hasMore: !!result.LastEvaluatedKey
    });

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
