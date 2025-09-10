"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const auth_1 = require("../lib/auth");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const dynamodb_1 = require("../lib/dynamodb");
const security_1 = require("../lib/security");
const AUDIT_TABLE = process.env.AUDIT_TABLE || 'dms-dev-audits';
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const validatedEvent = (0, security_1.sanitizeEvent)(event);
        const auth = (0, auth_1.requireAdmin)(validatedEvent);
        const queryParams = validatedEvent.queryStringParameters || {};
        const limit = parseInt(queryParams.limit || '50');
        const startDate = queryParams.startDate;
        const endDate = queryParams.endDate;
        const action = queryParams.action;
        let filterExpression = '';
        const expressionAttributeValues = {};
        const expressionAttributeNames = {};
        if (startDate) {
            filterExpression += '#timestamp >= :startDate';
            expressionAttributeNames['#timestamp'] = 'timestamp';
            expressionAttributeValues[':startDate'] = startDate;
        }
        if (endDate) {
            if (filterExpression)
                filterExpression += ' AND ';
            filterExpression += '#timestamp <= :endDate';
            expressionAttributeNames['#timestamp'] = 'timestamp';
            expressionAttributeValues[':endDate'] = endDate;
        }
        if (action) {
            if (filterExpression)
                filterExpression += ' AND ';
            filterExpression += 'contains(#action, :action)';
            expressionAttributeNames['#action'] = 'action';
            expressionAttributeValues[':action'] = action;
        }
        const command = new lib_dynamodb_1.QueryCommand({
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
            ScanIndexForward: false
        });
        const result = await dynamodb_1.ddbDoc.send(command);
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
        logger_1.logger.info('Audit records retrieved successfully', {
            requestId,
            actor: auth,
            action: 'adminAudits',
            result: 'success',
            count: auditRecords.length,
            latency_ms: Date.now() - startTime
        });
        return (0, security_1.createSafeResponse)(200, {
            items: auditRecords,
            total: auditRecords.length,
            hasMore: !!result.LastEvaluatedKey
        });
    }
    catch (error) {
        logger_1.logger.error('Get audit records failed', {
            requestId,
            action: 'adminAudits',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
