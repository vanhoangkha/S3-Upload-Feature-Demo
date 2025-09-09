import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth, assertAccess } from '../lib/auth';
import { createErrorResponse, NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { getDocument } from '../lib/dynamodb';
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { listObjectVersions } from '../lib/s3';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAuth(event);
    const documentId = event.pathParameters?.id;
    
    if (!documentId) {
      throw new NotFoundError('Document ID is required');
    }

    // Get document to verify ownership and get S3 key pattern
    const document = await getDocument(auth.vendorId, auth.userId, documentId);
    if (!document) {
      throw new NotFoundError('Document not found');
    }

    assertAccess(auth, { 
      vendorId: document.vendor_id, 
      userId: document.owner_user_id 
    });

    const versions = await listObjectVersions(
      document.vendor_id,
      document.owner_user_id,
      documentId
    );

    logger.info('Document versions listed successfully', {
      requestId,
      actor: auth,
      action: 'listVersions',
      resource: { type: 'document', id: documentId },
      result: 'success',
      count: versions.length,
      latency_ms: Date.now() - startTime
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ versions }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
      }
    };

  } catch (error) {
    logger.error('List versions failed', {
      requestId,
      action: 'listVersions',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
