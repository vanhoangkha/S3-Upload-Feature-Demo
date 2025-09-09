"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../lib/auth");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const s3_1 = require("../lib/s3");
const dynamodb_1 = require("../lib/dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const auth = (0, auth_1.requireAuth)(event);
        logger_1.logger.info('Presign download request', {
            requestId,
            actor: auth,
            action: 'presignDownload'
        });
        const body = JSON.parse(event.body || '{}');
        const input = (0, validation_1.validateInput)(validation_1.presignDownloadSchema, body);
        let document = null;
        if (auth.roles.includes('Admin')) {
            const scanResult = await dynamodb_1.ddbDoc.send(new lib_dynamodb_1.ScanCommand({
                TableName: process.env.TABLE_NAME || 'dms-dev-documents',
                FilterExpression: 'document_id = :docId',
                ExpressionAttributeValues: {
                    ':docId': input.documentId
                },
                Limit: 1
            }));
            document = scanResult.Items?.[0];
        }
        else {
            const vendorId = auth.vendorId || 'default';
            const userId = auth.userId;
            document = await (0, dynamodb_1.getDocument)(vendorId, userId, input.documentId);
        }
        if (!document) {
            throw new errors_1.NotFoundError('Document not found');
        }
        (0, auth_1.assertAccess)(auth, { vendorId: document.vendor_id, userId: document.owner_user_id });
        const url = await (0, s3_1.generatePresignedDownloadUrl)(document.s3_key);
        logger_1.logger.info('Presigned download URL generated', {
            requestId,
            actor: auth,
            action: 'presignDownload',
            result: 'success',
            latency_ms: Date.now() - startTime
        });
        return {
            statusCode: 200,
            body: JSON.stringify({ url }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
            }
        };
    }
    catch (error) {
        logger_1.logger.error('Presign download failed', {
            requestId,
            action: 'presignDownload',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
