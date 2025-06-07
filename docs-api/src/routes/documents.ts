import { Hono } from 'hono';
import { DocumentService } from '../services/document-service';
import { S3Service } from '../services/s3-service';
import { CreateDocumentRequest, CreateFolderRequest, ApiResponse } from '../types';
import { S3FolderItem, S3FolderListResponse } from '../types/folder';

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

// POST /documents/folders - OPTIMIZED: Create a new folder (stores in DynamoDB)
documents.post('/folders', async (c) => {
  try {
    const requestData = await c.req.json();

    // Handle both legacy and new request formats
    let data: CreateFolderRequest;

    if (requestData.folderPath && requestData.user_id) {
      // Legacy format: { folderPath: "A/B/NewFolder", user_id: "demo-user" }
      console.log('[LEGACY] Converting old folder creation format to new format');
      const folderPath = requestData.folderPath;
      const pathParts = folderPath.split('/');
      const folderName = pathParts.pop(); // Get the last part as folder name
      const parentPath = pathParts.length > 0 ? pathParts.join('/') : '';

      data = {
        user_id: requestData.user_id,
        folderName: folderName || '',
        parentPath: parentPath || undefined,
      };
    } else if (requestData.folderName && requestData.user_id) {
      // New format: { folderName: "NewFolder", user_id: "demo-user", parentFolderPath?: "A/B" }
      console.log('[OPTIMIZED] Using new folder creation format');
      data = {
        user_id: requestData.user_id,
        folderName: requestData.folderName,
        parentPath: requestData.parentFolderPath || undefined,
      };
    } else {
      return c.json<ApiResponse>({
        success: false,
        error: 'Either (folderPath and user_id) or (folderName and user_id) are required'
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

    console.log(`[OPTIMIZED] Creating folder: ${data.folderName} in path: ${data.parentPath || 'root'}`);

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
    console.error('Error creating folder:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to create folder'
    }, 500);
  }
});

// GET /documents/folders - OPTIMIZED: List folders and files using DynamoDB only
documents.get('/folders', async (c) => {
  try {
    const user_id = c.req.query('user_id');
    const folderPath = c.req.query('path') || '';

    if (!user_id) {
      return c.json<ApiResponse>({
        success: false,
        error: 'user_id is required'
      }, 400);
    }

    console.log(`[OPTIMIZED] Listing folder contents for user: ${user_id}, path: "${folderPath}"`);

    // Use the new optimized folder listing method (DynamoDB only)
    const folderContents = await documentService.listFolderContents(user_id, folderPath);

    console.log(`[OPTIMIZED] Found ${folderContents.folders.length} folders and ${folderContents.files.length} files`);

    return c.json<ApiResponse>({
      success: true,
      data: folderContents
    });
  } catch (error) {
    console.error('Error listing folder contents:', error);
    return c.json<ApiResponse>({
      success: false,
      error: `Failed to list folder contents: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// GET /documents/folders/:user_id - LEGACY: List folders for a user (S3-based - for backward compatibility)
documents.get('/folders/:user_id', async (c) => {
  try {
    const user_id = c.req.param('user_id');
    const folderPath = c.req.query('path') || '';

    console.log(`Listing folders for user: ${user_id}, path: ${folderPath}`);

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

    console.log(`S3 prefix: ${prefix}`);

    // List all objects under this prefix
    const objects = await s3Service.listObjects(prefix, 1000);
    console.log(`Found ${objects.length} objects in S3`);

    // Extract folders and files from the S3 objects
    const folders = new Set<string>();
    const files: any[] = [];

    objects.forEach(obj => {
      if (!obj.key) return;

      const keyAfterPrefix = obj.key.substring(prefix.length);
      if (!keyAfterPrefix) return;

      console.log(`Processing object: ${obj.key}, keyAfterPrefix: ${keyAfterPrefix}`);

      const pathParts = keyAfterPrefix.split('/').filter((part: string) => part !== ''); // Remove empty parts

      if (pathParts.length === 1) {
        // This is a file directly in the current folder
        if (!pathParts[0].startsWith('.folder_')) {
          console.log(`Adding file: ${pathParts[0]}`);
          files.push({
            name: pathParts[0],
            type: 'file',
            size: obj.size,
            lastModified: obj.lastModified,
            s3Key: obj.key
          });
        } else {
          console.log(`Skipping folder metadata file: ${pathParts[0]}`);
        }
      } else if (pathParts.length > 1) {
        // This indicates a subfolder - only add the first level folder
        const topLevelFolder = pathParts[0];
        console.log(`Adding folder: ${topLevelFolder} (from path: ${keyAfterPrefix})`);
        folders.add(topLevelFolder);
      }
    });

    const folderList: S3FolderItem[] = Array.from(folders).map(folderName => ({
      name: folderName,
      type: 'folder',
      path: folderPath ? `${folderPath}/${folderName}` : folderName
    }));

    console.log(`Returning ${folderList.length} folders and ${files.length} files`);

    return c.json<ApiResponse<S3FolderListResponse>>({
      success: true,
      data: {
        currentPath: folderPath,
        folders: folderList.sort((a, b) => a.name.localeCompare(b.name)),
        files: files.sort((a, b) => a.name.localeCompare(b.name))
      }
    });
  } catch (error) {
    console.error('Error listing folders:', error);
    return c.json<ApiResponse>({
      success: false,
      error: `Failed to list folders: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// GET /documents/:user_id/:file - Get a specific document
documents.get('/:user_id/:file', async (c) => {
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
    const { fileName, mimeType, user_id, fileSize, folderPath } = await c.req.json();

    if (!fileName || !mimeType || !user_id) {
      return c.json<ApiResponse>({
        success: false,
        error: 'fileName, mimeType, and user_id are required'
      }, 400);
    }

    const presignedUrls = await s3Service.generatePresignedUrls(fileName, mimeType, user_id, fileSize, folderPath);

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

// Document update functionality removed - edit functionality is no longer supported

// GET /documents/:user_id/:file/download - Get download URL for a document
documents.get('/:user_id/:file/download', async (c) => {
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
    console.error('Error deleting document:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to delete document'
    }, 500);
  }
});

export { documents };
