import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth, assertAccess } from '../lib/auth';
import { validateInput, presignDownloadSchema } from '../lib/validation';
import { createErrorResponse, NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { generatePresignedDownloadUrl } from '../lib/s3';
import { getDocument, ddbDoc } from '../lib/dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
    
    // Get document first to get s3Key
    let document = null;
    
    if (auth.roles.includes('Admin')) {
      // Admin can access any document - scan DynamoDB to find it
      const scanResult = await ddbDoc.send(new ScanCommand({
        TableName: process.env.TABLE_NAME || 'dms-dev-documents',
        FilterExpression: 'document_id = :docId',
        ExpressionAttributeValues: {
          ':docId': input.documentId
        },
        Limit: 1
      }));
      
      document = scanResult.Items?.[0];
    } else {
      // Try to get document assuming current user is the owner
      const vendorId = auth.vendorId || 'default';
      const userId = auth.userId;
      document = await getDocument(vendorId, userId, input.documentId);
    }
    
    if (!document) {
      throw new NotFoundError('Document not found');
    }
    
    assertAccess(auth, { vendorId: document.vendor_id, userId: document.owner_user_id });

    const url = await generatePresignedDownloadUrl(document.s3_key);

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
