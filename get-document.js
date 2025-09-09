const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        // Get document ID from path parameters
        const documentId = event.pathParameters?.id;
        if (!documentId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: {
                        code: 400,
                        message: 'Document ID is required'
                    }
                })
            };
        }
        
        // Get user info from JWT claims
        const claims = event.requestContext.authorizer.claims;
        const userId = claims.sub;
        
        // Query document using pk and sk
        const command = new GetCommand({
            TableName: process.env.TABLE_NAME,
            Key: {
                pk: 'TENANT#default',
                sk: `USER#${userId}#DOC#${documentId}`
            }
        });
        
        const result = await docClient.send(command);
        
        if (!result.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: {
                        code: 404,
                        message: 'Document not found'
                    }
                })
            };
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify(result.Item)
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
