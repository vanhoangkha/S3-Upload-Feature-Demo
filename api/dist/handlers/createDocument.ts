import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, assertAccess } from '../lib/auth';
import { validateInput, createDocumentSchema } from '../lib/validation';
import { createErrorResponse, BadRequestError } from '../lib/errors';
import { logger } from '../lib/logger';
import { putDocument, findDocumentByChecksum, Document } from '../lib/dynamodb';
import { generateS3Key } from '../lib/s3';
import { auditLog } from '../lib/audit';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
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
    
    assertAccess(auth, { vendorId: input.vendorId, userId: input.userId });

    // Check for existing document with same checksum and owner (idempotency)
    const existing = await findDocumentByChecksum(input.vendorId, input.userId, input.checksum);
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
    const s3Key = generateS3Key(input.vendorId, input.userId, documentId, version, input.name);
    const now = new Date().toISOString();

    const document: Document = {
      pk: `TENANT#${input.vendorId}`,
      sk: `USER#${input.userId}#DOC#${documentId}`,
      document_id: documentId,
      name: input.name,
      mime: input.mime,
      size: input.size,
      checksum: input.checksum,
      s3_key: s3Key,
      version,
      tags: input.tags || [],
      created_at: now,
      updated_at: now,
      owner_user_id: input.userId,
      vendor_id: input.vendorId
    };

    await putDocument(document);

    // Audit log
    await auditLog({
      actor: auth,
      action: 'document.create',
      resource: { type: 'document', id: documentId },
      result: 'success',
      details: { name: input.name, size: input.size }
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
