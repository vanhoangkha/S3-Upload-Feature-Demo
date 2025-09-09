"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../lib/auth");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const dynamodb_1 = require("../lib/dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const auth = (0, auth_1.requireAuth)(event);
        const documentId = event.pathParameters?.id;
        if (!documentId) {
            throw new errors_1.NotFoundError('Document ID is required');
        }
        logger_1.logger.info('Get document request', {
            requestId,
            actor: auth,
            action: 'getDocument',
            resource: { type: 'document', id: documentId }
        });
        const queryParams = event.queryStringParameters || {};
        const { includeDeleted } = (0, validation_1.validateInput)(validation_1.listDocumentsSchema, queryParams);
        let document = null;
        if (auth.roles.includes('Admin')) {
            const scanResult = await dynamodb_1.ddbDoc.send(new lib_dynamodb_1.ScanCommand({
                TableName: process.env.TABLE_NAME || 'dms-dev-documents',
                FilterExpression: 'document_id = :docId',
                ExpressionAttributeValues: {
                    ':docId': documentId
                },
                Limit: 1
            }));
            document = scanResult.Items?.[0];
        }
        else {
            document = await (0, dynamodb_1.getDocument)(auth.vendorId, auth.userId, documentId);
            if (!document && auth.roles.includes('Vendor')) {
                throw new errors_1.NotFoundError('Vendor-wide document lookup not implemented');
            }
        }
        if (!document) {
            throw new errors_1.NotFoundError('Document not found');
        }
        if (document.deleted_at && !includeDeleted) {
            throw new errors_1.NotFoundError('Document not found');
        }
        (0, auth_1.assertAccess)(auth, {
            vendorId: document.vendor_id,
            userId: document.owner_user_id
        });
        logger_1.logger.info('Document retrieved successfully', {
            requestId,
            actor: auth,
            action: 'getDocument',
            resource: { type: 'document', id: documentId },
            result: 'success',
            latency_ms: Date.now() - startTime
        });
        return {
            statusCode: 200,
            body: JSON.stringify({
                document
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
        logger_1.logger.error('Get document failed', {
            requestId,
            action: 'getDocument',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
