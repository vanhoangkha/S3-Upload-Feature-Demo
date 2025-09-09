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
        const auth = (0, auth_1.requireAuth)(event);
        logger_1.logger.info('List documents request', {
            requestId,
            actor: auth,
            action: 'listDocuments'
        });
        const queryParams = event.queryStringParameters || {};
        const parsedParams = { ...queryParams };
        if (queryParams.tags) {
            parsedParams.tags = Array.isArray(queryParams.tags)
                ? queryParams.tags
                : queryParams.tags.split(',');
        }
        const query = (0, validation_1.validateInput)(validation_1.listDocumentsSchema, parsedParams);
        let exclusiveStartKey;
        if (query.cursor) {
            try {
                exclusiveStartKey = JSON.parse(Buffer.from(query.cursor, 'base64').toString());
            }
            catch {
                throw new errors_1.BadRequestError('Invalid cursor');
            }
        }
        let result;
        if (query.scope === 'me') {
            result = await (0, dynamodb_1.queryDocumentsByUser)(auth.userId, query.limit, exclusiveStartKey, query.includeDeleted);
        }
        else if (query.scope === 'vendor') {
            if (!auth.roles.includes('Vendor') && !auth.roles.includes('Admin')) {
                throw new errors_1.BadRequestError('Insufficient permissions for vendor scope');
            }
            result = await (0, dynamodb_1.queryDocumentsByVendor)(auth.vendorId, query.limit, exclusiveStartKey, query.includeDeleted);
        }
        else {
            throw new errors_1.BadRequestError('Invalid scope');
        }
        let filteredItems = result.items;
        if (query.q) {
            const searchTerm = query.q.toLowerCase();
            filteredItems = result.items.filter(doc => doc.name.toLowerCase().includes(searchTerm) ||
                doc.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        }
        if (query.tags && query.tags.length > 0) {
            filteredItems = filteredItems.filter(doc => query.tags.some(tag => doc.tags.includes(tag)));
        }
        let nextCursor;
        if (result.lastEvaluatedKey) {
            nextCursor = Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64');
        }
        logger_1.logger.info('Documents listed successfully', {
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
    }
    catch (error) {
        logger_1.logger.error('List documents failed', {
            requestId,
            action: 'listDocuments',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
