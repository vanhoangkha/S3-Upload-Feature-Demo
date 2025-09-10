"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const auth_1 = require("../lib/auth");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const audit_1 = require("../lib/audit");
const security_1 = require("../lib/security");
const cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const validatedEvent = (0, security_1.sanitizeEvent)(event);
        const auth = (0, auth_1.requireAdmin)(validatedEvent);
        const body = (0, security_1.safeJsonParse)(validatedEvent.body);
        const input = (0, validation_1.validateInput)(validation_1.createUserSchema, body);
        const validGroups = ['Admin', 'Vendor', 'User'];
        const invalidGroups = (input.groups || []).filter(g => !validGroups.includes(g));
        if (invalidGroups.length > 0) {
            throw new errors_1.BadRequestError(`Invalid groups: ${invalidGroups.join(', ')}`);
        }
        const createCommand = new client_cognito_identity_provider_1.AdminCreateUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: input.usernameOrEmail,
            UserAttributes: [
                { Name: 'email', Value: input.usernameOrEmail },
                { Name: 'email_verified', Value: 'true' },
                { Name: 'custom:vendor_id', Value: input.vendor_id }
            ],
            MessageAction: 'SUPPRESS'
        });
        await cognitoClient.send(createCommand);
        if (input.groups && input.groups.length > 0) {
            const groupCommands = input.groups.map(group => new client_cognito_identity_provider_1.AdminAddUserToGroupCommand({
                UserPoolId: USER_POOL_ID,
                Username: input.usernameOrEmail,
                GroupName: group
            }));
            await Promise.all(groupCommands.map(command => cognitoClient.send(command)));
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
        return (0, security_1.createSafeResponse)(201, {
            username: input.usernameOrEmail,
            vendor_id: input.vendor_id,
            groups: input.groups || ['User'],
            status: 'FORCE_CHANGE_PASSWORD',
            created: new Date().toISOString()
        });
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
