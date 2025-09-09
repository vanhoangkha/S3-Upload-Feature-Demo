"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const auth_1 = require("../lib/auth");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const audit_1 = require("../lib/audit");
const cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const auth = (0, auth_1.requireAdmin)(event);
        const userId = event.pathParameters?.id;
        if (!userId) {
            throw new errors_1.NotFoundError('User ID is required');
        }
        const command = new client_cognito_identity_provider_1.AdminUserGlobalSignOutCommand({
            UserPoolId: USER_POOL_ID,
            Username: userId
        });
        await cognitoClient.send(command);
        await (0, audit_1.auditLog)({
            actor: auth,
            action: 'user.signout',
            resource: { type: 'user', id: userId },
            result: 'success'
        });
        logger_1.logger.info('User signed out successfully', {
            requestId,
            actor: auth,
            action: 'adminSignOut',
            resource: { type: 'user', id: userId },
            result: 'success',
            latency_ms: Date.now() - startTime
        });
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
            }
        };
    }
    catch (error) {
        logger_1.logger.error('Sign out user failed', {
            requestId,
            action: 'adminSignOut',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
