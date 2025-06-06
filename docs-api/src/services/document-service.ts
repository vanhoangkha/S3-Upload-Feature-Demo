import { PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, config } from '../utils/aws-config';
import { Document, CreateDocumentRequest, UpdateDocumentRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class DocumentService {
  async createDocument(data: CreateDocumentRequest & { s3Key: string; uploadedBy: string }): Promise<Document> {
    const now = new Date().toISOString();
    const document: Document = {
      user_id: data.user_id,
      file: data.fileName,
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

  async updateDocument(user_id: string, file: string, data: UpdateDocumentRequest): Promise<Document | null> {
    const updateExpression: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};

    if (data.title) {
      updateExpression.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = data.title;
    }

    if (data.description !== undefined) {
      updateExpression.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = data.description;
    }

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpression.length === 1) { // Only updatedAt
      throw new Error('No fields to update');
    }

    const command = new UpdateCommand({
      TableName: config.documentsTableName,
      Key: { user_id, file },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);
    return result.Attributes as Document || null;
  }

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
