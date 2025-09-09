import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth, assertAccess } from '../lib/auth';
import { createErrorResponse, NotFoundError, BadRequestError } from '../lib/errors';
import { logger } from '../lib/logger';
import { getDocument, updateDocument, ddbDoc } from '../lib/dynamodb';
import { auditLog } from '../lib/audit';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAuth(event);
    const documentId = event.pathParameters?.id;
    
    if (!documentId) {
      throw new NotFoundError('Document ID is required');
    }

    // Get existing document including deleted ones
    const existingDoc = await getDocument(auth.vendorId, auth.userId, documentId);
    if (!existingDoc) {
      throw new NotFoundError('Document not found');
    }

    if (!existingDoc.deleted_at) {
      throw new BadRequestError('Document is not deleted');
    }

    assertAccess(auth, { 
      vendorId: existingDoc.vendor_id, 
      userId: existingDoc.owner_user_id 
    });

    // Remove deleted_at to restore
    const restoredDoc = await updateDocument(
      existingDoc.vendor_id,
      existingDoc.owner_user_id,
      documentId,
      { deleted_at: undefined }
    );

    await auditLog({
      actor: auth,
      action: 'document.restore',
      resource: { type: 'document', id: documentId },
      result: 'success',
      details: { name: existingDoc.name }
    });

    logger.info('Document restored successfully', {
      requestId,
      actor: auth,
      action: 'restoreDocument',
      resource: { type: 'document', id: documentId },
      result: 'success',
      latency_ms: Date.now() - startTime
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ document: restoredDoc }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
      }
    };

  } catch (error) {
    logger.error('Restore document failed', {
      requestId,
      action: 'restoreDocument',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
