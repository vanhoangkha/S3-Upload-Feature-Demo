"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../lib/auth");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const dynamodb_1 = require("../lib/dynamodb");
const s3_1 = require("../lib/s3");
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const auth = (0, auth_1.requireAuth)(event);
        const documentId = event.pathParameters?.id;
        if (!documentId) {
            throw new errors_1.NotFoundError('Document ID is required');
        }
        const document = await (0, dynamodb_1.getDocument)(auth.vendorId, auth.userId, documentId);
        if (!document) {
            throw new errors_1.NotFoundError('Document not found');
        }
        (0, auth_1.assertAccess)(auth, {
            vendorId: document.vendor_id,
            userId: document.owner_user_id
        });
        const versions = await (0, s3_1.listObjectVersions)(document.vendor_id, document.owner_user_id, documentId);
        logger_1.logger.info('Document versions listed successfully', {
            requestId,
            actor: auth,
            action: 'listVersions',
            resource: { type: 'document', id: documentId },
            result: 'success',
            count: versions.length,
            latency_ms: Date.now() - startTime
        });
        return {
            statusCode: 200,
            body: JSON.stringify({ versions }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
            }
        };
    }
    catch (error) {
        logger_1.logger.error('List versions failed', {
            requestId,
            action: 'listVersions',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
