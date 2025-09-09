import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth, assertAccess } from '../lib/auth';
import { validateInput, updateDocumentSchema } from '../lib/validation';
import { createErrorResponse, NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { getDocument, updateDocument, ddbDoc } from '../lib/dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
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

    const body = JSON.parse(event.body || '{}');
    const updates = validateInput(updateDocumentSchema, body);

    // Get existing document to verify ownership
    let existingDoc = null;
    
    if (auth.roles.includes('Admin')) {
      // Admin can access any document - scan DynamoDB to find it
      const scanResult = await ddbDoc.send(new ScanCommand({
        TableName: process.env.TABLE_NAME || 'dms-dev-documents',
        FilterExpression: 'document_id = :docId',
        ExpressionAttributeValues: {
          ':docId': documentId
        },
        Limit: 1
      }));
      
      existingDoc = scanResult.Items?.[0];
    } else {
      existingDoc = await getDocument(auth.vendorId, auth.userId, documentId);
    }
    
    if (!existingDoc || existingDoc.deleted_at) {
      throw new NotFoundError('Document not found');
    }

    assertAccess(auth, { 
      vendorId: existingDoc.vendor_id, 
      userId: existingDoc.owner_user_id 
    });

    const updatedDoc = await updateDocument(
      existingDoc.vendor_id,
      existingDoc.owner_user_id,
      documentId,
      updates
    );

    await auditLog({
      actor: auth,
      action: 'document.update',
      resource: { type: 'document', id: documentId },
      result: 'success',
      details: updates
    });

    logger.info('Document updated successfully', {
      requestId,
      actor: auth,
      action: 'updateDocument',
      resource: { type: 'document', id: documentId },
      result: 'success',
      latency_ms: Date.now() - startTime
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ document: updatedDoc }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
      }
    };

  } catch (error) {
    logger.error('Update document failed', {
      requestId,
      action: 'updateDocument',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
