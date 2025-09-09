"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const uuid_1 = require("uuid");
const auth_1 = require("../lib/auth");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const dynamodb_1 = require("../lib/dynamodb");
const s3_1 = require("../lib/s3");
const audit_1 = require("../lib/audit");
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const auth = (0, auth_1.requireAuth)(event);
        logger_1.logger.info('Create document request', {
            requestId,
            actor: auth,
            action: 'createDocument'
        });
        const body = JSON.parse(event.body || '{}');
        const input = (0, validation_1.validateInput)(validation_1.createDocumentSchema, body);
        const vendorId = auth.vendorId || 'default';
        const userId = auth.userId;
        (0, auth_1.assertAccess)(auth, { vendorId, userId });
        const checksum = input.checksum || 'no-checksum';
        const existing = await (0, dynamodb_1.findDocumentByChecksum)(vendorId, userId, checksum);
        if (existing) {
            logger_1.logger.info('Returning existing document', {
                requestId,
                actor: auth,
                action: 'createDocument',
                resource: { type: 'document', id: existing.document_id },
                result: 'success',
                latency_ms: Date.now() - startTime
            });
            return {
                statusCode: 200,
                body: JSON.stringify({
                    documentId: existing.document_id,
                    version: existing.version,
                    s3Key: existing.s3_key
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
                }
            };
        }
        const documentId = (0, uuid_1.v4)();
        const version = 1;
        const s3Key = (0, s3_1.generateS3Key)(vendorId, userId, documentId, version, input.filename);
        const now = new Date().toISOString();
        const document = {
            pk: `TENANT#${vendorId}`,
            sk: `USER#${userId}#DOC#${documentId}`,
            document_id: documentId,
            name: input.filename,
            mime: input.contentType,
            size: input.size || 0,
            checksum: checksum,
            s3_key: s3Key,
            version,
            tags: input.tags || [],
            created_at: now,
            updated_at: now,
            owner_user_id: userId,
            vendor_id: vendorId
        };
        await (0, dynamodb_1.putDocument)(document);
        await (0, audit_1.auditLog)({
            actor: auth,
            action: 'document.create',
            resource: { type: 'document', id: documentId },
            result: 'success',
            details: { name: input.filename, size: input.size || 0 }
        });
        logger_1.logger.info('Document created successfully', {
            requestId,
            actor: auth,
            action: 'createDocument',
            resource: { type: 'document', id: documentId },
            result: 'success',
            latency_ms: Date.now() - startTime
        });
        return {
            statusCode: 201,
            body: JSON.stringify({
                documentId,
                version,
                s3Key
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
        logger_1.logger.error('Create document failed', {
            requestId,
            action: 'createDocument',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        if (error instanceof Error && error.message.includes('Validation failed')) {
            return (0, errors_1.createErrorResponse)(new errors_1.BadRequestError(error.message));
        }
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
