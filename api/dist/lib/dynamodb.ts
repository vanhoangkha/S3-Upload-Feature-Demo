import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  QueryCommand, 
  ScanCommand,
  UpdateCommand,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
export const ddbDoc = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'dms-dev-documents';
const AUDIT_TABLE = process.env.AUDIT_TABLE || 'dms-dev-role-audits';

export interface Document {
  pk: string; // TENANT#{vendor_id}
  sk: string; // USER#{owner_user_id}#DOC#{document_id}
  document_id: string;
  name: string;
  mime: string;
  size: number;
  checksum: string;
  s3_key: string;
  version: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  owner_user_id: string;
  vendor_id: string;
}

export interface AuditRecord {
  pk: string; // AUDIT#{timestamp}
  sk: string; // USER#{user_id}#ACTION#{action}
  timestamp: string;
  actor: {
    userId: string;
    vendorId: string;
    roles: string[];
  };
  action: string;
  resource: {
    type: string;
    id: string;
  };
  result: 'success' | 'error';
  details?: any;
}

export const createDocumentKey = (vendorId: string, userId: string, documentId: string) => ({
  pk: `TENANT#${vendorId}`,
  sk: `USER#${userId}#DOC#${documentId}`
});

export const getDocument = async (vendorId: string, userId: string, documentId: string): Promise<Document | null> => {
  const result = await ddbDoc.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: createDocumentKey(vendorId, userId, documentId)
  }));
  
  return result.Item as Document || null;
};

export const putDocument = async (doc: Document): Promise<void> => {
  await ddbDoc.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: doc
  }));
};

export const updateDocument = async (
  vendorId: string, 
  userId: string, 
  documentId: string, 
  updates: Partial<Document>
): Promise<Document> => {
  const updateExpression = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (key !== 'pk' && key !== 'sk' && key !== 'document_id') {
      updateExpression.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  }

  // Always update updated_at
  updateExpression.push('#updated_at = :updated_at');
  expressionAttributeNames['#updated_at'] = 'updated_at';
  expressionAttributeValues[':updated_at'] = new Date().toISOString();

  const result = await ddbDoc.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: createDocumentKey(vendorId, userId, documentId),
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  }));

  return result.Attributes as Document;
};

export const queryDocumentsByUser = async (
  userId: string, 
  limit: number = 20, 
  exclusiveStartKey?: any,
  includeDeleted: boolean = false
) => {
  let filterExpression = undefined;
  let expressionAttributeNames = undefined;

  if (!includeDeleted) {
    filterExpression = 'attribute_not_exists(deleted_at)';
  }

  const result = await ddbDoc.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'owner_user_id = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    FilterExpression: filterExpression,
    Limit: limit,
    ExclusiveStartKey: exclusiveStartKey,
    ScanIndexForward: false // newest first
  }));

  return {
    items: result.Items as Document[],
    lastEvaluatedKey: result.LastEvaluatedKey
  };
};

export const queryDocumentsByVendor = async (
  vendorId: string,
  limit: number = 20,
  exclusiveStartKey?: any,
  includeDeleted: boolean = false
) => {
  let filterExpression = undefined;

  if (!includeDeleted) {
    filterExpression = 'attribute_not_exists(deleted_at)';
  }

  const result = await ddbDoc.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI2',
    KeyConditionExpression: 'vendor_id = :vendorId',
    ExpressionAttributeValues: {
      ':vendorId': vendorId
    },
    FilterExpression: filterExpression,
    Limit: limit,
    ExclusiveStartKey: exclusiveStartKey,
    ScanIndexForward: false // newest first
  }));

  return {
    items: result.Items as Document[],
    lastEvaluatedKey: result.LastEvaluatedKey
  };
};

export const findDocumentByChecksum = async (
  vendorId: string,
  userId: string,
  checksum: string
): Promise<Document | null> => {
  // Query by vendor and user, then filter by checksum
  const result = await ddbDoc.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': `TENANT#${vendorId}`,
      ':skPrefix': `USER#${userId}#DOC#`,
      ':checksum': checksum
    },
    FilterExpression: 'checksum = :checksum AND attribute_not_exists(deleted_at)'
  }));

  return result.Items?.[0] as Document || null;
};

export const putAuditRecord = async (record: AuditRecord): Promise<void> => {
  await ddbDoc.send(new PutCommand({
    TableName: AUDIT_TABLE,
    Item: record
  }));
};

export const queryAuditRecords = async (
  startDate?: string,
  endDate?: string,
  actor?: string,
  action?: string,
  limit: number = 50
) => {
  // Use scan instead of query for audit records since we don't have a proper GSI
  const result = await ddbDoc.send(new ScanCommand({
    TableName: AUDIT_TABLE,
    FilterExpression: 'begins_with(pk, :prefix)',
    ExpressionAttributeValues: {
      ':prefix': 'AUDIT#'
    },
    Limit: limit
  }));

  return {
    items: result.Items as AuditRecord[],
    lastEvaluatedKey: result.LastEvaluatedKey
  };
};
