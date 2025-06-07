import { Hono } from 'hono';
import { DocumentService } from '../services/document-service';
import { S3Service } from '../services/s3-service';
import { CreateDocumentRequest, UpdateDocumentRequest, ApiResponse } from '../types';

const documents = new Hono();
const documentService = new DocumentService();
const s3Service = new S3Service();

// GET /documents - List all documents (admin endpoint) or user's documents
documents.get('/', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');
    const nextToken = c.req.query('nextToken');
    const user_id = c.req.query('user_id'); // Optional: filter by user

    let lastEvaluatedKey;
    if (nextToken) {
      try {
        lastEvaluatedKey = JSON.parse(nextToken);
      } catch (e) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Invalid nextToken format'
        }, 400);
      }
    }

    let result;
    if (user_id) {
      // Get documents for specific user
      result = await documentService.getDocumentsByUserId(user_id, limit, lastEvaluatedKey);
    } else {
      // Get all documents (admin view)
      result = await documentService.listAllDocuments(limit, lastEvaluatedKey);
    }

    return c.json<ApiResponse>({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to list documents'
    }, 500);
  }
});

// GET /documents/:user_id/:file - Get a specific document
documents.get('/:user_id/:file', async (c) => {
  try {
    const user_id = c.req.param('user_id');
    const file = c.req.param('file');
    const document = await documentService.getDocument(user_id, file);

    if (!document) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Document not found'
      }, 404);
    }

    return c.json<ApiResponse>({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error getting document:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to get document'
    }, 500);
  }
});

// POST /documents/presigned-url - Generate presigned URLs for upload
documents.post('/presigned-url', async (c) => {
  try {
    const { fileName, mimeType, user_id, fileSize } = await c.req.json();

    if (!fileName || !mimeType || !user_id) {
      return c.json<ApiResponse>({
        success: false,
        error: 'fileName, mimeType, and user_id are required'
      }, 400);
    }

    const presignedUrls = await s3Service.generatePresignedUrls(fileName, mimeType, user_id, fileSize);

    return c.json<ApiResponse>({
      success: true,
      data: presignedUrls
    });
  } catch (error) {
    console.error('Error generating presigned URLs:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to generate presigned URLs'
    }, 500);
  }
});

// POST /documents - Create a new document record after upload
documents.post('/', async (c) => {
  try {
    const data: CreateDocumentRequest & { s3Key: string } = await c.req.json();

    if (!data.title || !data.fileName || !data.s3Key || !data.mimeType || !data.user_id || !data.fileSize) {
      return c.json<ApiResponse>({
        success: false,
        error: 'title, fileName, s3Key, mimeType, user_id, and fileSize are required'
      }, 400);
    }

    // Check if the file actually exists in S3
    const exists = await s3Service.checkObjectExists(data.s3Key);

    if (!exists) {
      return c.json<ApiResponse>({
        success: false,
        error: 'File not found in S3. Please upload the file first.'
      }, 400);
    }

    const uploadedBy = data.user_id; // For now, use user_id as uploadedBy
    const document = await documentService.createDocument({
      ...data,
      uploadedBy
    });

    return c.json<ApiResponse>({
      success: true,
      data: document
    }, 201);
  } catch (error) {
    console.error('Error creating document:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to create document'
    }, 500);
  }
});

// PUT /documents/:user_id/:file - Update a document
documents.put('/:user_id/:file', async (c) => {
  try {
    const user_id = c.req.param('user_id');
    const file = c.req.param('file');
    const data: UpdateDocumentRequest = await c.req.json();

    const document = await documentService.updateDocument(user_id, file, data);

    if (!document) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Document not found'
      }, 404);
    }

    return c.json<ApiResponse>({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to update document'
    }, 500);
  }
});

// GET /documents/:user_id/:file/download - Get download URL for a document
documents.get('/:user_id/:file/download', async (c) => {
  try {
    const user_id = c.req.param('user_id');
    const file = c.req.param('file');
    const document = await documentService.getDocument(user_id, file);

    if (!document) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Document not found'
      }, 404);
    }

    const downloadUrl = await s3Service.getDownloadUrl(document.s3Key);

    return c.json<ApiResponse>({
      success: true,
      data: { downloadUrl }
    });
  } catch (error) {
    console.error('Error getting download URL:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to get download URL'
    }, 500);
  }
});

// DELETE /documents/:user_id/:file - Delete a document
documents.delete('/:user_id/:file', async (c) => {
  try {
    const user_id = c.req.param('user_id');
    const file = c.req.param('file');
    const document = await documentService.getDocument(user_id, file);

    if (!document) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Document not found'
      }, 404);
    }

    // Delete from S3
    await s3Service.deleteObject(document.s3Key);

    // Delete from DynamoDB
    await documentService.deleteDocument(user_id, file);

    return c.json<ApiResponse>({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to delete document'
    }, 500);
  }
});

export { documents };
