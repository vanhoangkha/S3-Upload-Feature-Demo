import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { requireAuth, assertAccess } from '../lib/auth';
import { validateInput, presignDownloadSchema } from '../lib/validation';
import { createErrorResponse } from '../lib/errors';
import { logger } from '../lib/logger';
import { generatePresignedDownloadUrl } from '../lib/s3';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAuth(event);
    
    logger.info('Presign download request', {
      requestId,
      actor: auth,
      action: 'presignDownload'
    });

    const body = JSON.parse(event.body || '{}');
    const input = validateInput(presignDownloadSchema, body);
    
    assertAccess(auth, { vendorId: input.vendorId, userId: input.userId });

    const url = await generatePresignedDownloadUrl(input.s3Key);

    logger.info('Presigned download URL generated', {
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

  } catch (error) {
    logger.error('Presign download failed', {
      requestId,
      action: 'presignDownload',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
