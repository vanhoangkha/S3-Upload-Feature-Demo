import { Hono } from 'hono';
import { DocumentService } from '../services/document-service';
import { S3Service } from '../services/s3-service';
import { CreateDocumentRequest, CreateFolderRequest, ApiResponse } from '../types';
import { logger } from '../utils/logger';
import {
  authMiddleware,
  getCurrentUser,
  isCurrentUserAdmin
} from '../middleware/auth';

const documents = new Hono();
const documentService = new DocumentService();
const s3Service = new S3Service();

// === UTILITY FUNCTIONS ===

/**
 * Extract user ID from S3 key
 * @param s3Key - S3 key in format: protected/{user_id}/...
 * @returns user_id or null if invalid format
 * @example extractUserIdFromS3Key("protected/123e4567-e89b-12d3-a456-426614174000/file.pdf") 
 * // returns "123e4567-e89b-12d3-a456-426614174000"
 */
function extractUserIdFromS3Key(s3Key: string): string | null {
  const pathMatch = s3Key.match(/^protected\/([a-f0-9\-]{36})\//i);
  return pathMatch ? pathMatch[1] : null;
}

/**
 * Check if current user can access documents for the specified user
 * @param c - Hono context containing authentication information
 * @param targetUserId - User ID being accessed
 * @returns true if access is allowed (admin or same user)
 */
function canAccessUserDocuments(c: any, targetUserId: string): boolean {
  const currentUser = getCurrentUser(c);
  if (!currentUser) return false;

  return isCurrentUserAdmin(c) || currentUser.userId === targetUserId;
}

/**
 * Validate folder name format
 * @param folderName - Name to validate
 * @returns true if valid (letters, numbers, spaces, hyphens, underscores only)
 * @example isValidFolderName("My Folder-123_Test") // returns true
 * @example isValidFolderName("My/Invalid\\Folder") // returns false
 */
function isValidFolderName(folderName: string): boolean {
  const folderNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
  return folderNameRegex.test(folderName);
}

// === DOCUMENT LISTING ENDPOINTS ===

// GET /documents - List all documents (admin endpoint) or user's documents
documents.get('/', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');
    const nextToken = c.req.query('nextToken');
    const user_id = c.req.query('user_id'); // Optional: filter by user

    const currentUser = getCurrentUser(c);
    const isAdmin = isCurrentUserAdmin(c);

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

    // If no user is authenticated, return empty results
    if (!currentUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Authentication required'
      }, 401);
    }

    if (user_id) {
      // Check if user can access the requested user's documents
      if (!isAdmin && user_id !== currentUser.userId) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Forbidden - You can only access your own documents'
        }, 403);
      }
      // Get documents for specific user
      result = await documentService.getDocumentsByUserId(user_id, limit, lastEvaluatedKey);
    } else if (isAdmin) {
      // Admin can get all documents
      result = await documentService.listAllDocuments(limit, lastEvaluatedKey);
    } else {
      // Regular user gets their own documents
      result = await documentService.getDocumentsByUserId(currentUser.userId, limit, lastEvaluatedKey);
    }

    return c.json<ApiResponse>({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error listing documents:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to list documents'
    }, 500);
  }
});

// === FOLDER MANAGEMENT ENDPOINTS ===

// POST /documents/folders - Create a new folder (stores in DynamoDB)
documents.post('/folders', authMiddleware, async (c) => {
  try {
    const requestData = await c.req.json();
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Authentication required'
      }, 401);
    }

    // Handle both legacy and new request formats
    let data: CreateFolderRequest;

    if (requestData.folderPath && requestData.user_id) {
      // Check if user can create folders for the specified user
      if (!isCurrentUserAdmin(c) && requestData.user_id !== currentUser.userId) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Forbidden - You can only create folders for yourself'
        }, 403);
      }

      // Legacy format: { folderPath: "A/B/NewFolder", user_id: "demo-user" }

      const folderPath = requestData.folderPath;
      const pathParts = folderPath.split('/');
      const folderName = pathParts.pop(); // Get the last part as folder name
      const parentPath = pathParts.length > 0 ? pathParts.join('/') : '';

      data = {
        user_id: requestData.user_id,
        folderName: folderName || '',
        parentPath: parentPath || undefined,
      };
    } else if (requestData.folderName) {
      // New format: { folderName: "NewFolder", parentFolderPath?: "A/B" }
      // Use current user's ID if not specified or verify permission
      const userId = requestData.user_id || currentUser.userId;

      if (!isCurrentUserAdmin(c) && userId !== currentUser.userId) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Forbidden - You can only create folders for yourself'
        }, 403);
      }


      data = {
        user_id: userId,
        folderName: requestData.folderName,
        parentPath: requestData.parentFolderPath || undefined,
      };
    } else {
      return c.json<ApiResponse>({
        success: false,
        error: 'folderName is required'
      }, 400);
    }

    if (!data.user_id || !data.folderName) {
      return c.json<ApiResponse>({
        success: false,
        error: 'user_id and folderName are required'
      }, 400);
    }

    // Validate folder name (no special characters except spaces, hyphens, underscores)
    if (!isValidFolderName(data.folderName)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Folder name can only contain letters, numbers, spaces, hyphens, and underscores'
      }, 400);
    }



    const folder = await documentService.createFolder(data);

    // Return format compatible with both legacy and new frontend code
    const folderPath = data.parentPath ? `${data.parentPath}/${data.folderName}` : data.folderName;

    return c.json<ApiResponse>({
      success: true,
      data: {
        id: folder.id,
        folderName: data.folderName,
        folderPath: folderPath,
        message: 'Folder created successfully'
      }
    }, 201);
  } catch (error) {
    logger.error('Error creating folder:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to create folder'
    }, 500);
  }
});

// GET /documents/folders - List folders and files using DynamoDB-first approach
documents.get('/folders', authMiddleware, async (c) => {
  try {
    const user_id = c.req.query('user_id');
    const folderPath = c.req.query('path') || '';
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Authentication required'
      }, 401);
    }

    // Determine which user's folder to list
    let targetUserId: string;
    if (user_id) {
      // Check if user can access the requested user's folders
      if (!isCurrentUserAdmin(c) && user_id !== currentUser.userId) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Forbidden - You can only access your own folders'
        }, 403);
      }
      targetUserId = user_id;
    } else {
      // Use current user's ID if not specified
      targetUserId = currentUser.userId;
    }



    // Use the new optimized folder listing method (DynamoDB only)
    const folderContents = await documentService.listFolderContents(targetUserId, folderPath);



    return c.json<ApiResponse>({
      success: true,
      data: folderContents
    });
  } catch (error) {
    logger.error('Error listing folder contents:', error);
    return c.json<ApiResponse>({
      success: false,
      error: `Failed to list folder contents: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// === DOCUMENT OPERATIONS (REST API - Modern request body-based) ===

// POST /documents/get - Get a specific document using s3Key in request body
documents.post('/get', authMiddleware, async (c) => {
  try {
    const { s3Key } = await c.req.json();

    if (!s3Key) {
      return c.json<ApiResponse>({
        success: false,
        error: 's3Key is required in request body'
      }, 400);
    }

    // Extract user_id from the S3 key (format: protected/{user_id}/...)
    const user_id = extractUserIdFromS3Key(s3Key);
    if (!user_id) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid S3 key format - must start with protected/{user_id}/'
      }, 400);
    }

    const currentUser = getCurrentUser(c);

    // Check if user can access this document
    if (!canAccessUserDocuments(c, user_id)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Access denied - you can only access your own documents'
      }, 403);
    }

    const document = await documentService.getDocument(user_id, s3Key);

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
    logger.error('Error getting document:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to get document'
    }, 500);
  }
});

// === FILE UPLOAD ENDPOINTS ===

// POST /documents/presigned-url - Generate presigned URLs for upload
documents.post('/presigned-url', authMiddleware, async (c) => {
  try {
    const { fileName, mimeType, user_id, fileSize, folderPath } = await c.req.json();
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Authentication required'
      }, 401);
    }

    if (!fileName || !mimeType) {
      return c.json<ApiResponse>({
        success: false,
        error: 'fileName and mimeType are required'
      }, 400);
    }

    // Determine which user the upload is for
    let targetUserId: string;
    if (user_id) {
      // Check if user can upload for the specified user
      if (!isCurrentUserAdmin(c) && user_id !== currentUser.userId) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Forbidden - You can only upload files for yourself'
        }, 403);
      }
      targetUserId = user_id;
    } else {
      // Use current user's ID if not specified
      targetUserId = currentUser.userId;
    }

    const presignedUrls = await s3Service.generatePresignedUrls(fileName, mimeType, targetUserId, fileSize, folderPath);

    return c.json<ApiResponse>({
      success: true,
      data: presignedUrls
    });
  } catch (error) {
    logger.error('Error generating presigned URLs:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to generate presigned URLs'
    }, 500);
  }
});

// POST /documents - Create a new document record after upload
documents.post('/', authMiddleware, async (c) => {
  try {
    const data: CreateDocumentRequest & { s3Key: string } = await c.req.json();
    const currentUser = getCurrentUser(c);

    if (!currentUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Authentication required'
      }, 401);
    }

    if (!data.title || !data.fileName || !data.s3Key || !data.mimeType || !data.fileSize) {
      return c.json<ApiResponse>({
        success: false,
        error: 'title, fileName, s3Key, mimeType, and fileSize are required'
      }, 400);
    }

    // Determine which user the document belongs to
    let targetUserId: string;
    if (data.user_id) {
      // Check if user can create documents for the specified user
      if (!isCurrentUserAdmin(c) && data.user_id !== currentUser.userId) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Forbidden - You can only create documents for yourself'
        }, 403);
      }
      targetUserId = data.user_id;
    } else {
      // Use current user's ID if not specified
      targetUserId = currentUser.userId;
    }

    // Check if the file actually exists in S3
    const exists = await s3Service.checkObjectExists(data.s3Key);

    if (!exists) {
      return c.json<ApiResponse>({
        success: false,
        error: 'File not found in S3. Please upload the file first.'
      }, 400);
    }

    const document = await documentService.createDocument({
      ...data,
      user_id: targetUserId,
      uploadedBy: currentUser.email || currentUser.username || currentUser.userId
    });

    return c.json<ApiResponse>({
      success: true,
      data: document
    }, 201);
  } catch (error) {
    logger.error('Error creating document:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to create document'
    }, 500);
  }
});

// Document update functionality removed - edit functionality is no longer supported

// POST /documents/download - Get download URL for a document using s3Key in request body
documents.post('/download', authMiddleware, async (c) => {
  try {
    const { s3Key } = await c.req.json();

    if (!s3Key) {
      return c.json<ApiResponse>({
        success: false,
        error: 's3Key is required in request body'
      }, 400);
    }

    // Extract user_id from the S3 key (format: protected/{user_id}/...)
    const user_id = extractUserIdFromS3Key(s3Key);
    if (!user_id) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid S3 key format - must start with protected/{user_id}/'
      }, 400);
    }

    const currentUser = getCurrentUser(c);

    // Check if user can access this document
    if (!canAccessUserDocuments(c, user_id)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Access denied - you can only download your own documents'
      }, 403);
    }

    // Get document from DynamoDB to verify it exists
    const document = await documentService.getDocument(user_id, s3Key);

    if (!document) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Document not found'
      }, 404);
    }

    // Generate presigned download URL
    const downloadUrl = await s3Service.getDownloadUrl(document.s3Key);

    return c.json<ApiResponse>({
      success: true,
      data: { downloadUrl }
    });
  } catch (error) {
    logger.error('Error getting download URL:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to get download URL'
    }, 500);
  }
});

// POST /documents/delete - Delete a document using s3Key in request body
documents.post('/delete', authMiddleware, async (c) => {
  try {
    const { s3Key } = await c.req.json();

    if (!s3Key) {
      return c.json<ApiResponse>({
        success: false,
        error: 's3Key is required in request body'
      }, 400);
    }

    // Extract user_id from the S3 key (format: protected/{user_id}/...)
    const user_id = extractUserIdFromS3Key(s3Key);
    if (!user_id) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid S3 key format - must start with protected/{user_id}/'
      }, 400);
    }

    const currentUser = getCurrentUser(c);

    // Check if user can delete this document
    if (!canAccessUserDocuments(c, user_id)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Access denied - you can only delete your own documents'
      }, 403);
    }

    const document = await documentService.getDocument(user_id, s3Key);

    if (!document) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Document not found'
      }, 404);
    }

    // Delete from S3
    await s3Service.deleteObject(document.s3Key);

    // Delete from DynamoDB
    await documentService.deleteDocument(user_id, s3Key);

    return c.json<ApiResponse>({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting document:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to delete document'
    }, 500);
  }
});

export { documents };
