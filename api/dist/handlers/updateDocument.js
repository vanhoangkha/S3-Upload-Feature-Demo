"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../lib/auth");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const dynamodb_1 = require("../lib/dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
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
        const body = JSON.parse(event.body || '{}');
        const updates = (0, validation_1.validateInput)(validation_1.updateDocumentSchema, body);
        let existingDoc = null;
        if (auth.roles.includes('Admin')) {
            const scanResult = await dynamodb_1.ddbDoc.send(new lib_dynamodb_1.ScanCommand({
                TableName: process.env.TABLE_NAME || 'dms-dev-documents',
                FilterExpression: 'document_id = :docId',
                ExpressionAttributeValues: {
                    ':docId': documentId
                },
                Limit: 1
            }));
            existingDoc = scanResult.Items?.[0];
        }
        else {
            existingDoc = await (0, dynamodb_1.getDocument)(auth.vendorId, auth.userId, documentId);
        }
        if (!existingDoc || existingDoc.deleted_at) {
            throw new errors_1.NotFoundError('Document not found');
        }
        (0, auth_1.assertAccess)(auth, {
            vendorId: existingDoc.vendor_id,
            userId: existingDoc.owner_user_id
        });
        const updatedDoc = await (0, dynamodb_1.updateDocument)(existingDoc.vendor_id, existingDoc.owner_user_id, documentId, updates);
        await (0, audit_1.auditLog)({
            actor: auth,
            action: 'document.update',
            resource: { type: 'document', id: documentId },
            result: 'success',
            details: updates
        });
        logger_1.logger.info('Document updated successfully', {
            requestId,
            actor: auth,
            action: 'updateDocument',
            resource: { type: 'document', id: documentId },
            result: 'success',
            latency_ms: Date.now() - startTime
        });
        return {
            statusCode: 200,
            body: JSON.stringify({ document: updatedDoc }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
            }
        };
    }
    catch (error) {
        logger_1.logger.error('Update document failed', {
            requestId,
            action: 'updateDocument',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
