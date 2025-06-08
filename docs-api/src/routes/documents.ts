import { Hono } from 'hono';
import { DocumentService } from '../services/document-service';
import { S3Service } from '../services/s3-service';
import { CreateDocumentRequest, CreateFolderRequest, ApiResponse } from '../types';
import { S3FolderItem, S3FolderListResponse } from '../types/folder';
import { logger } from '../utils/logger';
import {
  authMiddleware,
  adminOnlyMiddleware,
  userResourceMiddleware,
  getCurrentUser,
  isCurrentUserAdmin
} from '../middleware/auth';

const documents = new Hono();
const documentService = new DocumentService();
const s3Service = new S3Service();

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

// POST /documents/folders - OPTIMIZED: Create a new folder (stores in DynamoDB)
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
    const folderNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!folderNameRegex.test(data.folderName)) {
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

// GET /documents/folders - OPTIMIZED: List folders and files using DynamoDB only
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

// GET /documents/folders/:user_id - LEGACY: List folders for a user (S3-based - for backward compatibility)
documents.get('/folders/:user_id', userResourceMiddleware, async (c) => {
  try {
    const user_id = c.req.param('user_id');
    const folderPath = c.req.query('path') || '';



    if (!user_id) {
      return c.json<ApiResponse>({
        success: false,
        error: 'user_id is required'
      }, 400);
    }

    // Build S3 prefix for the user's folder structure
    let prefix = `protected/${user_id}/`;
    if (folderPath && folderPath.trim()) {
      const normalizedPath = folderPath.trim().replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
      prefix += `${normalizedPath}/`;
    }



    // List all objects under this prefix
    const objects = await s3Service.listObjects(prefix, 1000);


    // Extract folders and files from the S3 objects
    const folders = new Set<string>();
    const files: any[] = [];

    objects.forEach(obj => {
      if (!obj.key) return;

      const keyAfterPrefix = obj.key.substring(prefix.length);
      if (!keyAfterPrefix) return;



      const pathParts = keyAfterPrefix.split('/').filter((part: string) => part !== ''); // Remove empty parts

      if (pathParts.length === 1) {
        // This is a file directly in the current folder
        if (!pathParts[0].startsWith('.folder_')) {

          files.push({
            name: pathParts[0],
            type: 'file',
            size: obj.size,
            lastModified: obj.lastModified,
            s3Key: obj.key
          });
        } else {

        }
      } else if (pathParts.length > 1) {
        // This indicates a subfolder - only add the first level folder
        const topLevelFolder = pathParts[0];

        folders.add(topLevelFolder);
      }
    });

    const folderList: S3FolderItem[] = Array.from(folders).map(folderName => ({
      name: folderName,
      type: 'folder',
      path: folderPath ? `${folderPath}/${folderName}` : folderName
    }));



    return c.json<ApiResponse<S3FolderListResponse>>({
      success: true,
      data: {
        currentPath: folderPath,
        folders: folderList.sort((a, b) => a.name.localeCompare(b.name)),
        files: files.sort((a, b) => a.name.localeCompare(b.name))
      }
    });
  } catch (error) {
    logger.error('Error listing folders:', error);
    return c.json<ApiResponse>({
      success: false,
      error: `Failed to list folders: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// GET /documents/:user_id/:file - Get a specific document
documents.get('/:user_id/:file', userResourceMiddleware, async (c) => {
  try {
    const user_id = c.req.param('user_id');
    const encodedFile = c.req.param('file');

    // URL decode the file parameter to handle S3 keys with forward slashes
    const file = decodeURIComponent(encodedFile);

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
    logger.error('Error getting document:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to get document'
    }, 500);
  }
});

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

// GET /documents/:user_id/:file/download - Get download URL for a document
documents.get('/:user_id/:file/download', userResourceMiddleware, async (c) => {
  try {
    const user_id = c.req.param('user_id');
    const encodedFile = c.req.param('file');

    // URL decode the file parameter to handle S3 keys with forward slashes
    const file = decodeURIComponent(encodedFile);

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
    logger.error('Error getting download URL:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to get download URL'
    }, 500);
  }
});

// DELETE /documents/:user_id/:file - Delete a document
documents.delete('/:user_id/:file', userResourceMiddleware, async (c) => {
  try {
    const user_id = c.req.param('user_id');
    const encodedFile = c.req.param('file');

    // URL decode the file parameter to handle S3 keys with forward slashes
    const file = decodeURIComponent(encodedFile);

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
    logger.error('Error deleting document:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to delete document'
    }, 500);
  }
});

export { documents };
