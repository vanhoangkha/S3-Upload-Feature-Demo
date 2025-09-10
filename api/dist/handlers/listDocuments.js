"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../lib/auth");
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
        logger_1.logger.info('List documents request', {
            requestId,
            actor: auth,
            action: 'listDocuments'
        });
        const query = validatedEvent.queryStringParameters || {};
        const limit = parseInt(query.limit || '50');
        const includeDeleted = query.includeDeleted === 'true';
        let result;
        if (auth.roles.includes('Admin')) {
            const vendorId = query.vendorId || auth.vendorId;
            result = await (0, dynamodb_1.queryDocumentsByVendor)(vendorId, limit, undefined, includeDeleted);
        }
        else if (auth.roles.includes('Vendor')) {
            result = await (0, dynamodb_1.queryDocumentsByVendor)(auth.vendorId, limit, undefined, includeDeleted);
        }
        else {
            result = await (0, dynamodb_1.queryDocumentsByUser)(auth.userId, limit, undefined, includeDeleted);
        }
        logger_1.logger.info('List documents completed', {
            requestId,
            count: result.documents?.length || 0,
            duration: Date.now() - startTime
        });
        return (0, security_1.createSafeResponse)(200, {
            documents: result.documents || [],
            total: result.total || 0
        });
    }
    catch (error) {
        logger_1.logger.error('List documents failed', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
