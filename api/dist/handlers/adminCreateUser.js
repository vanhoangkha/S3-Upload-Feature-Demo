"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const auth_1 = require("../lib/auth");
const validation_1 = require("../lib/validation");
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
        const body = JSON.parse(event.body || '{}');
        const input = (0, validation_1.validateInput)(validation_1.createUserSchema, body);
        const createCommand = new client_cognito_identity_provider_1.AdminCreateUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: input.usernameOrEmail,
            UserAttributes: [
                { Name: 'email', Value: input.usernameOrEmail },
                { Name: 'custom:vendor_id', Value: input.vendor_id }
            ],
            MessageAction: 'SUPPRESS'
        });
        const createResponse = await cognitoClient.send(createCommand);
        if (input.groups) {
            for (const group of input.groups) {
                const groupCommand = new client_cognito_identity_provider_1.AdminAddUserToGroupCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: input.usernameOrEmail,
                    GroupName: group
                });
                await cognitoClient.send(groupCommand);
            }
        }
        await (0, audit_1.auditLog)({
            actor: auth,
            action: 'user.create',
            resource: { type: 'user', id: input.usernameOrEmail },
            result: 'success',
            details: { vendor_id: input.vendor_id, groups: input.groups }
        });
        logger_1.logger.info('User created successfully', {
            requestId,
            actor: auth,
            action: 'adminCreateUser',
            resource: { type: 'user', id: input.usernameOrEmail },
            result: 'success',
            latency_ms: Date.now() - startTime
        });
        return {
            statusCode: 201,
            body: JSON.stringify({
                username: input.usernameOrEmail,
                vendor_id: input.vendor_id,
                groups: input.groups
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
        logger_1.logger.error('Create user failed', {
            requestId,
            action: 'adminCreateUser',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
