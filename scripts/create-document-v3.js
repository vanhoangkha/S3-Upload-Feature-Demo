const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Simple UUID v4 generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        // Parse request body
        const body = JSON.parse(event.body);
        const { filename, contentType, tags = [], vendorId } = body;
        
        // Get user info from JWT claims
        const claims = event.requestContext.authorizer.claims;
        const userId = claims.sub;
        const userRoles = claims.roles ? claims.roles.split(',') : [];
        
        // Generate document ID
        const documentId = generateUUID();
        const now = new Date().toISOString();
        
        // Create document item matching existing schema
        const documentItem = {
            pk: 'TENANT#default',
            sk: `USER#${userId}#DOC#${documentId}`,
            document_id: documentId,
            name: filename,
            mime: contentType,
            tags,
            vendor_id: vendorId || 'default',
            owner_user_id: userId,
            created_at: now,
            updated_at: now,
            version: 1,
            size: 0,
            checksum: 'no-checksum',
            s3_key: `tenant/default/user/${userId}/${documentId}/v1/${filename}`
        };
        
        // Save to DynamoDB
        const command = new PutCommand({
            TableName: process.env.TABLE_NAME,
            Item: documentItem
        });
        
        await docClient.send(command);
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                id: documentId,
                document_id: documentId,
                name: filename,
                mime: contentType,
                tags,
                vendor_id: vendorId || 'default',
                owner_user_id: userId,
                created_at: now,
                version: 1
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: {
                    code: 500,
                    message: 'Internal server error'
                }
            })
        };
    }
};
