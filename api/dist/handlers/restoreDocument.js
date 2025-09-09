"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../lib/auth");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const dynamodb_1 = require("../lib/dynamodb");
const audit_1 = require("../lib/audit");
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const auth = (0, auth_1.requireAuth)(event);
        const documentId = event.pathParameters?.id;
        if (!documentId) {
            throw new errors_1.NotFoundError('Document ID is required');
        }
        const existingDoc = await (0, dynamodb_1.getDocument)(auth.vendorId, auth.userId, documentId);
        if (!existingDoc) {
            throw new errors_1.NotFoundError('Document not found');
        }
        if (!existingDoc.deleted_at) {
            throw new errors_1.BadRequestError('Document is not deleted');
        }
        (0, auth_1.assertAccess)(auth, {
            vendorId: existingDoc.vendor_id,
            userId: existingDoc.owner_user_id
        });
        const restoredDoc = await (0, dynamodb_1.updateDocument)(existingDoc.vendor_id, existingDoc.owner_user_id, documentId, { deleted_at: undefined });
        await (0, audit_1.auditLog)({
            actor: auth,
            action: 'document.restore',
            resource: { type: 'document', id: documentId },
            result: 'success',
            details: { name: existingDoc.name }
        });
        logger_1.logger.info('Document restored successfully', {
            requestId,
            actor: auth,
            action: 'restoreDocument',
            resource: { type: 'document', id: documentId },
            result: 'success',
            latency_ms: Date.now() - startTime
        });
        return {
            statusCode: 200,
            body: JSON.stringify({ document: restoredDoc }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
            }
        };
    }
    catch (error) {
        logger_1.logger.error('Restore document failed', {
            requestId,
            action: 'restoreDocument',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
