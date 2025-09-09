"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryAuditRecords = exports.putAuditRecord = exports.findDocumentByChecksum = exports.queryDocumentsByVendor = exports.queryDocumentsByUser = exports.updateDocument = exports.putDocument = exports.getDocument = exports.createDocumentKey = exports.ddbDoc = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({ region: 'us-east-1' });
exports.ddbDoc = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || 'dms-dev-documents';
const AUDIT_TABLE = process.env.AUDIT_TABLE || 'dms-dev-role-audits';
const createDocumentKey = (vendorId, userId, documentId) => ({
    pk: `TENANT#${vendorId}`,
    sk: `USER#${userId}#DOC#${documentId}`
});
exports.createDocumentKey = createDocumentKey;
const getDocument = async (vendorId, userId, documentId) => {
    const result = await exports.ddbDoc.send(new lib_dynamodb_1.GetCommand({
        TableName: TABLE_NAME,
        Key: (0, exports.createDocumentKey)(vendorId, userId, documentId)
    }));
    return result.Item || null;
};
exports.getDocument = getDocument;
const putDocument = async (doc) => {
    await exports.ddbDoc.send(new lib_dynamodb_1.PutCommand({
        TableName: TABLE_NAME,
        Item: doc
    }));
};
exports.putDocument = putDocument;
const updateDocument = async (vendorId, userId, documentId, updates) => {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    for (const [key, value] of Object.entries(updates)) {
        if (key !== 'pk' && key !== 'sk' && key !== 'document_id') {
            updateExpression.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:${key}`] = value;
        }
    }
    updateExpression.push('#updated_at = :updated_at');
    expressionAttributeNames['#updated_at'] = 'updated_at';
    expressionAttributeValues[':updated_at'] = new Date().toISOString();
    const result = await exports.ddbDoc.send(new lib_dynamodb_1.UpdateCommand({
        TableName: TABLE_NAME,
        Key: (0, exports.createDocumentKey)(vendorId, userId, documentId),
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
    }));
    return result.Attributes;
};
exports.updateDocument = updateDocument;
const queryDocumentsByUser = async (userId, limit = 20, exclusiveStartKey, includeDeleted = false) => {
    let filterExpression = undefined;
    let expressionAttributeNames = undefined;
    if (!includeDeleted) {
        filterExpression = 'attribute_not_exists(deleted_at)';
    }
    const result = await exports.ddbDoc.send(new lib_dynamodb_1.QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'owner_user_id = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
        FilterExpression: filterExpression,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
        ScanIndexForward: false
    }));
    return {
        items: result.Items,
        lastEvaluatedKey: result.LastEvaluatedKey
    };
};
exports.queryDocumentsByUser = queryDocumentsByUser;
const queryDocumentsByVendor = async (vendorId, limit = 20, exclusiveStartKey, includeDeleted = false) => {
    let filterExpression = undefined;
    if (!includeDeleted) {
        filterExpression = 'attribute_not_exists(deleted_at)';
    }
    const result = await exports.ddbDoc.send(new lib_dynamodb_1.QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI2',
        KeyConditionExpression: 'vendor_id = :vendorId',
        ExpressionAttributeValues: {
            ':vendorId': vendorId
        },
        FilterExpression: filterExpression,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
        ScanIndexForward: false
    }));
    return {
        items: result.Items,
        lastEvaluatedKey: result.LastEvaluatedKey
    };
};
exports.queryDocumentsByVendor = queryDocumentsByVendor;
const findDocumentByChecksum = async (vendorId, userId, checksum) => {
    const result = await exports.ddbDoc.send(new lib_dynamodb_1.QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
        ExpressionAttributeValues: {
            ':pk': `TENANT#${vendorId}`,
            ':skPrefix': `USER#${userId}#DOC#`,
            ':checksum': checksum
        },
        FilterExpression: 'checksum = :checksum AND attribute_not_exists(deleted_at)'
    }));
    return result.Items?.[0] || null;
};
exports.findDocumentByChecksum = findDocumentByChecksum;
const putAuditRecord = async (record) => {
    await exports.ddbDoc.send(new lib_dynamodb_1.PutCommand({
        TableName: AUDIT_TABLE,
        Item: record
    }));
};
exports.putAuditRecord = putAuditRecord;
const queryAuditRecords = async (startDate, endDate, actor, action, limit = 50) => {
    const result = await exports.ddbDoc.send(new lib_dynamodb_1.ScanCommand({
        TableName: AUDIT_TABLE,
        FilterExpression: 'begins_with(pk, :prefix)',
        ExpressionAttributeValues: {
            ':prefix': 'AUDIT#'
        },
        Limit: limit
    }));
    return {
        items: result.Items,
        lastEvaluatedKey: result.LastEvaluatedKey
    };
};
exports.queryAuditRecords = queryAuditRecords;
