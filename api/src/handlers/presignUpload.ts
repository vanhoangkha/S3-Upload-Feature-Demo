import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, assertAccess } from '../lib/auth';
import { validateInput, presignUploadSchema } from '../lib/validation';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';
import { generatePresignedUploadUrl } from '../lib/s3';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAuth(event);
    
    logger.info('Presign upload request', {
      requestId,
      actor: auth,
      action: 'presignUpload'
    });

    const body = JSON.parse(event.body || '{}');
    const input = validateInput(presignUploadSchema, body);
    
    // Use auth context for vendorId and userId
    const vendorId = auth.vendorId || 'default';
    const userId = auth.userId;
    
    assertAccess(auth, { vendorId, userId });

    // Generate document ID if not provided
    const documentId = input.documentId || uuidv4();

    const { url, key } = await generatePresignedUploadUrl(
      vendorId,
      userId,
      documentId,
      input.version || 1,
      input.filename,
      input.contentType
    );

    logger.info('Presigned upload URL generated', {
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

  } catch (error) {
    logger.error('Presign upload failed', {
      requestId,
      action: 'presignUpload',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
