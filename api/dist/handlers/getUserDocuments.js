"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../lib/auth");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const dynamodb_1 = require("../lib/dynamodb");
const security_1 = require("../lib/security");
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const validatedEvent = (0, security_1.sanitizeEvent)(event);
        const auth = (0, auth_1.requireAuth)(validatedEvent);
        const queryParams = validatedEvent.queryStringParameters || {};
        const query = (0, validation_1.validateInput)(validation_1.listDocumentsSchema, queryParams);
        const result = await (0, dynamodb_1.queryDocumentsByUser)(auth.userId, query.limit, undefined, query.includeDeleted);
        logger_1.logger.info('User documents retrieved', {
            requestId,
            actor: auth,
            action: 'getUserDocuments',
            result: 'success',
            count: result.items.length,
            latency_ms: Date.now() - startTime
        });
        return (0, security_1.createSafeResponse)(200, {
            items: result.items,
            total: result.items.length
        });
    }
    catch (error) {
        logger_1.logger.error('Get user documents failed', {
            requestId,
            action: 'getUserDocuments',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
