"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const auth_1 = require("../lib/auth");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const auth = (0, auth_1.requireAdmin)(event);
        const queryParams = event.queryStringParameters || {};
        const { limit, nextToken } = (0, validation_1.validateInput)(validation_1.listUsersSchema, queryParams);
        const command = new client_cognito_identity_provider_1.ListUsersCommand({
            UserPoolId: USER_POOL_ID,
            Limit: limit,
            PaginationToken: nextToken
        });
        const response = await cognitoClient.send(command);
        const users = (response.Users || []).map(user => ({
            username: user.Username,
            status: user.UserStatus,
            email: user.Attributes?.find(attr => attr.Name === 'email')?.Value,
            vendor_id: user.Attributes?.find(attr => attr.Name === 'custom:vendor_id')?.Value,
            groups: []
        }));
        logger_1.logger.info('Users listed successfully', {
            requestId,
            actor: auth,
            action: 'adminListUsers',
            result: 'success',
            count: users.length,
            latency_ms: Date.now() - startTime
        });
        return {
            statusCode: 200,
            body: JSON.stringify({
                items: users,
                nextToken: response.PaginationToken
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
            }
        };
    }
    catch (error) {
        logger_1.logger.error('List users failed', {
            requestId,
            action: 'adminListUsers',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
