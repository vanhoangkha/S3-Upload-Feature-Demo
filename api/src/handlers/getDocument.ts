import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth, assertAccess } from '../lib/auth';
import { validateInput, listDocumentsSchema } from '../lib/validation';
import { createErrorResponse, NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { getDocument, ddbDoc, Document } from '../lib/dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = event.requestContext.requestId;
  
  try {
    const auth = requireAuth(event);
    const documentId = event.pathParameters?.id;
    
    if (!documentId) {
      throw new NotFoundError('Document ID is required');
    }

    logger.info('Get document request', {
      requestId,
      actor: auth,
      action: 'getDocument',
      resource: { type: 'document', id: documentId }
    });

    const queryParams = event.queryStringParameters || {};
    const { includeDeleted } = validateInput(listDocumentsSchema, queryParams);

    // For non-admin users, we need to try different vendor/user combinations
    // In a real implementation, you might want to add a GSI to query by document_id
    let document = null;
    
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
      
      document = scanResult.Items?.[0] as Document;
    } else {
      // Try to get document assuming current user is the owner
      document = await getDocument(auth.vendorId, auth.userId, documentId);
      
      if (!document && auth.roles.includes('Vendor')) {
        // Vendor might need to search across all users in their vendor
        // This would require a more sophisticated query
        throw new NotFoundError('Vendor-wide document lookup not implemented');
      }
    }

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Check if document is deleted and includeDeleted is false
    if (document.deleted_at && !includeDeleted) {
      throw new NotFoundError('Document not found');
    }

    // Verify access
    assertAccess(auth, { 
      vendorId: document.vendor_id, 
      userId: document.owner_user_id 
    });

    logger.info('Document retrieved successfully', {
      requestId,
      actor: auth,
      action: 'getDocument',
      resource: { type: 'document', id: documentId },
      result: 'success',
      latency_ms: Date.now() - startTime
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        document
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
      }
    };

  } catch (error) {
    logger.error('Get document failed', {
      requestId,
      action: 'getDocument',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime
    });

    return createErrorResponse(error as Error);
  }
};
