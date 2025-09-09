import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, assertAccess } from '../lib/auth';
import { validateInput, createDocumentSchema } from '../lib/validation';
import { createErrorResponse, BadRequestError } from '../lib/errors';
import { logger } from '../lib/logger';
import { putDocument, findDocumentByChecksum, Document } from '../lib/dynamodb';
import { generateS3Key } from '../lib/s3';
import { auditLog } from '../lib/audit';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAuth(event);
    
    logger.info('Create document request', {
      requestId,
      actor: auth,
      action: 'createDocument'
    });

    const body = JSON.parse(event.body || '{}');
    const input = validateInput(createDocumentSchema, body);
    
    // Use auth context for vendorId and userId
    const vendorId = auth.vendorId || 'default';
    const userId = auth.userId;
    
    assertAccess(auth, { vendorId, userId });

    // Check for existing document with same checksum and owner (idempotency)
    const checksum = input.checksum || 'no-checksum';
    const existing = await findDocumentByChecksum(vendorId, userId, checksum);
    if (existing) {
      logger.info('Returning existing document', {
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

    const documentId = uuidv4();
    const version = 1;
    const s3Key = generateS3Key(vendorId, userId, documentId, version, input.filename);
    const now = new Date().toISOString();

    const document: Document = {
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

    await putDocument(document);

    // Audit log
    await auditLog({
      actor: auth,
      action: 'document.create',
      resource: { type: 'document', id: documentId },
      result: 'success',
      details: { name: input.filename, size: input.size || 0 }
    });

    logger.info('Document created successfully', {
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

  } catch (error) {
    logger.error('Create document failed', {
      requestId,
      action: 'createDocument',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    if (error instanceof Error && error.message.includes('Validation failed')) {
      return createErrorResponse(new BadRequestError(error.message));
    }

    return createErrorResponse(error as Error);
  }
};
