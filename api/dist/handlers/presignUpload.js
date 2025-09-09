"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const uuid_1 = require("uuid");
const auth_1 = require("../lib/auth");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const s3_1 = require("../lib/s3");
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const auth = (0, auth_1.requireAuth)(event);
        logger_1.logger.info('Presign upload request', {
            requestId,
            actor: auth,
            action: 'presignUpload'
        });
        const body = JSON.parse(event.body || '{}');
        const input = (0, validation_1.validateInput)(validation_1.presignUploadSchema, body);
        const vendorId = auth.vendorId || 'default';
        const userId = auth.userId;
        (0, auth_1.assertAccess)(auth, { vendorId, userId });
        const documentId = input.documentId || (0, uuid_1.v4)();
        const { url, key } = await (0, s3_1.generatePresignedUploadUrl)(vendorId, userId, documentId, input.version || 1, input.filename, input.contentType);
        logger_1.logger.info('Presigned upload URL generated', {
            requestId,
            actor: auth,
            action: 'presignUpload',
            resource: { type: 'document', id: documentId },
            result: 'success',
            latency_ms: Date.now() - startTime
        });
        return {
            statusCode: 200,
            body: JSON.stringify({
                url,
                key,
                documentId
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
        logger_1.logger.error('Presign upload failed', {
            requestId,
            action: 'presignUpload',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
