import { PutCommand, GetCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, config } from '../utils/aws-config';
import { logger } from '../utils/logger';
import { Document, CreateDocumentRequest, CreateFolderRequest, FolderListResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class DocumentService {
  async createDocument(data: CreateDocumentRequest & { s3Key: string; uploadedBy: string }): Promise<Document> {
    const now = new Date().toISOString();

    // Use the S3 key as the unique identifier to handle files with same names in different folders
    // This ensures that files with the same name in different folders get separate DynamoDB records
    const document: Document = {
      user_id: data.user_id,
      file: data.s3Key, // Use S3 key instead of just fileName to ensure uniqueness across folders
      id: uuidv4(),
      title: data.title,
      description: data.description,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      s3Key: data.s3Key,
      uploadedBy: data.uploadedBy,
      createdAt: now,
      updatedAt: now,
      bucket: config.documentStoreBucketName,
      itemType: 'file',
      folderPath: data.folderPath || '',
      isActive: true,
    };

    const command = new PutCommand({
      TableName: config.documentsTableName,
      Item: document,
    });

    await docClient.send(command);
    return document;
  }

  async createFolder(data: CreateFolderRequest): Promise<Document> {
    const now = new Date().toISOString();
    const folderPath = data.parentPath ? `${data.parentPath}/${data.folderName}` : data.folderName;

    // Create a folder record in DynamoDB
    const folderRecord: Document = {
      user_id: data.user_id,
      file: `__FOLDER__${folderPath}`, // Special prefix to identify folders
      id: uuidv4(),
      title: data.folderName,
      description: `Folder: ${data.folderName}`,
      fileSize: 0,
      mimeType: 'application/x-directory',
      s3Key: '', // Folders don't have S3 keys
      uploadedBy: data.user_id,
      createdAt: now,
      updatedAt: now,
      bucket: config.documentStoreBucketName,
      itemType: 'folder',
      folderPath: data.parentPath || '',
      isActive: true,
    };

    const command = new PutCommand({
      TableName: config.documentsTableName,
      Item: folderRecord,
    });

    await docClient.send(command);
    return folderRecord;
  }

  async listFolderContents(user_id: string, folderPath: string = ''): Promise<FolderListResponse> {
    // Query all items for the user that belong to the specified folder
    const command = new QueryCommand({
      TableName: config.documentsTableName,
      KeyConditionExpression: 'user_id = :user_id',
      FilterExpression: 'folderPath = :folderPath AND attribute_exists(isActive) AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':user_id': user_id,
        ':folderPath': folderPath,
        ':isActive': true,
      },
    });

    const result = await docClient.send(command);
    const items = (result.Items as Document[]) || [];

    // Separate folders and files
    const folders = items
      .filter(item => item.itemType === 'folder')
      .map(folder => ({
        name: folder.title,
        path: folder.file.replace('__FOLDER__', ''), // Remove folder prefix
        type: 'folder' as const,
      }));

    const files = items
      .filter(item => item.itemType === 'file')
      .map(file => ({
        name: file.title,
        path: file.s3Key,
        type: 'file' as const,
        document: file,
      }));

    return {
      currentPath: folderPath,
      folders: folders.sort((a, b) => a.name.localeCompare(b.name)),
      files: files.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  async getDocument(user_id: string, file: string): Promise<Document | null> {
    const command = new GetCommand({
      TableName: config.documentsTableName,
      Key: { user_id, file },
    });

    const result = await docClient.send(command);
    return result.Item as Document || null;
  }

  async getDocumentsByUserId(user_id: string, limit: number = 20, lastEvaluatedKey?: any): Promise<{ documents: Document[]; nextToken?: string }> {
    const command = new QueryCommand({
      TableName: config.documentsTableName,
      KeyConditionExpression: 'user_id = :user_id',
      FilterExpression: 'itemType = :itemType AND attribute_exists(isActive) AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':user_id': user_id,
        ':itemType': 'file',
        ':isActive': true,
      },
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const result = await docClient.send(command);

    return {
      documents: (result.Items as Document[]) || [],
      nextToken: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
    };
  }

  // Document update functionality removed - edit functionality is no longer supported

  async deleteDocument(user_id: string, file: string): Promise<boolean> {
    // Soft delete - mark as inactive instead of hard delete
    const now = new Date().toISOString();

    const command = new PutCommand({
      TableName: config.documentsTableName,
      Item: {
        user_id,
        file,
        isActive: false,
        updatedAt: now,
      },
      // Use ConditionExpression to ensure the item exists
      ConditionExpression: 'attribute_exists(user_id) AND attribute_exists(file)',
    });

    try {
      await docClient.send(command);
      return true;
    } catch (error) {
      logger.error('Error soft deleting document:', error);
      return false;
    }
  }

  async deleteFolder(user_id: string, folderPath: string): Promise<boolean> {
    try {
      // First, get all items in the folder (both subfolders and files)
      const command = new QueryCommand({
        TableName: config.documentsTableName,
        KeyConditionExpression: 'user_id = :user_id',
        FilterExpression: 'begins_with(folderPath, :folderPath) AND attribute_exists(isActive) AND isActive = :isActive',
        ExpressionAttributeValues: {
          ':user_id': user_id,
          ':folderPath': folderPath,
          ':isActive': true,
        },
      });

      const result = await docClient.send(command);
      const items = (result.Items as Document[]) || [];

      // Soft delete all items in the folder
      const now = new Date().toISOString();
      const deletePromises = items.map(item => {
        const deleteCommand = new PutCommand({
          TableName: config.documentsTableName,
          Item: {
            ...item,
            isActive: false,
            updatedAt: now,
          },
        });
        return docClient.send(deleteCommand);
      });

      // Also delete the folder itself
      const folderDeleteCommand = new PutCommand({
        TableName: config.documentsTableName,
        Item: {
          user_id,
          file: `__FOLDER__${folderPath}`,
          isActive: false,
          updatedAt: now,
        },
      });
      deletePromises.push(docClient.send(folderDeleteCommand));

      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      logger.error('Error deleting folder:', error);
      return false;
    }
  }

  async listAllDocuments(limit: number = 20, lastEvaluatedKey?: any): Promise<{ documents: Document[]; nextToken?: string }> {
    const command = new ScanCommand({
      TableName: config.documentsTableName,
      FilterExpression: 'itemType = :itemType AND attribute_exists(isActive) AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':itemType': 'file',
        ':isActive': true,
      },
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const result = await docClient.send(command);

    return {
      documents: (result.Items as Document[]) || [],
      nextToken: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
    };
  }
}
