import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { requireAuth, assertAccess } from '../lib/auth';
import { createErrorResponse, NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { getDocument, updateDocument } from '../lib/dynamodb';
import { auditLog } from '../lib/audit';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAuth(event);
    const documentId = event.pathParameters?.id;
    
    if (!documentId) {
      throw new NotFoundError('Document ID is required');
    }

    // Get existing document to verify ownership
    const existingDoc = await getDocument(auth.vendorId, auth.userId, documentId);
    if (!existingDoc) {
      throw new NotFoundError('Document not found');
    }

    // Check if already deleted (idempotent)
    if (existingDoc.deleted_at) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
        }
      };
    }

    assertAccess(auth, { 
      vendorId: existingDoc.vendor_id, 
      userId: existingDoc.owner_user_id 
    });

    // Soft delete
    await updateDocument(
      existingDoc.vendor_id,
      existingDoc.owner_user_id,
      documentId,
      { deleted_at: new Date().toISOString() }
    );

    await auditLog({
      actor: auth,
      action: 'document.delete',
      resource: { type: 'document', id: documentId },
      result: 'success',
      details: { name: existingDoc.name }
    });

    logger.info('Document deleted successfully', {
      requestId,
      actor: auth,
      action: 'deleteDocument',
      resource: { type: 'document', id: documentId },
      result: 'success',
      latency_ms: Date.now() - startTime
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
      }
    };

  } catch (error) {
    logger.error('Delete document failed', {
      requestId,
      action: 'deleteDocument',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
