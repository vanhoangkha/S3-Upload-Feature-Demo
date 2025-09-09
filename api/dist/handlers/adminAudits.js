"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../lib/auth");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const dynamodb_1 = require("../lib/dynamodb");
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const auth = (0, auth_1.requireAdmin)(event);
        const queryParams = event.queryStringParameters || {};
        const query = (0, validation_1.validateInput)(validation_1.auditQuerySchema, queryParams);
        const result = await (0, dynamodb_1.queryAuditRecords)(query.startDate, query.endDate, query.actor, query.action, query.limit);
        logger_1.logger.info('Audit records retrieved successfully', {
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
