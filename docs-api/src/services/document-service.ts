import { PutCommand, GetCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, config } from '../utils/aws-config';
import { Document, CreateDocumentRequest } from '../types';
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
    };

    const command = new PutCommand({
      TableName: config.documentsTableName,
      Item: document,
    });

    await docClient.send(command);
    return document;
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
      ExpressionAttributeValues: {
        ':user_id': user_id,
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
    const command = new DeleteCommand({
      TableName: config.documentsTableName,
      Key: { user_id, file },
    });

    await docClient.send(command);
    return true;
  }

  async listAllDocuments(limit: number = 20, lastEvaluatedKey?: any): Promise<{ documents: Document[]; nextToken?: string }> {
    const command = new ScanCommand({
      TableName: config.documentsTableName,
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
