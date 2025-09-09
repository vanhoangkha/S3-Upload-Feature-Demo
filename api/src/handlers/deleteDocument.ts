import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth, assertAccess } from '../lib/auth';
import { createErrorResponse, NotFoundError } from '../lib/errors';
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

    // Get existing document to verify ownership
    let existingDoc = null;
    
    if (auth.roles.includes("Admin")) {
      const scanResult = await ddbDoc.send(new ScanCommand({
        TableName: process.env.TABLE_NAME || "dms-dev-documents",
        FilterExpression: "document_id = :docId",
        ExpressionAttributeValues: {
          ":docId": documentId
        },
        Limit: 1
      }));
      
      existingDoc = scanResult.Items?.[0];
    } else {
      existingDoc = await getDocument(auth.vendorId, auth.userId, documentId);
    }
    
    
    // Skip the original getDocument call
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
