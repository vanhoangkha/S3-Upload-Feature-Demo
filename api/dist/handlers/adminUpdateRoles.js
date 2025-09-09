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
        const userId = event.pathParameters?.id;
        if (!userId) {
            throw new errors_1.NotFoundError('User ID is required');
        }
        const body = JSON.parse(event.body || '{}');
        const input = (0, validation_1.validateInput)(validation_1.updateRolesSchema, body);
        if (input.vendor_id) {
            const updateCommand = new client_cognito_identity_provider_1.AdminUpdateUserAttributesCommand({
                UserPoolId: USER_POOL_ID,
                Username: userId,
                UserAttributes: [
                    { Name: 'custom:vendor_id', Value: input.vendor_id }
                ]
            });
            await cognitoClient.send(updateCommand);
        }
        const listGroupsCommand = new client_cognito_identity_provider_1.AdminListGroupsForUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: userId
        });
        const currentGroups = await cognitoClient.send(listGroupsCommand);
        for (const group of currentGroups.Groups || []) {
            const removeCommand = new client_cognito_identity_provider_1.AdminRemoveUserFromGroupCommand({
                UserPoolId: USER_POOL_ID,
                Username: userId,
                GroupName: group.GroupName
            });
            await cognitoClient.send(removeCommand);
        }
        for (const group of input.groups) {
            const addCommand = new client_cognito_identity_provider_1.AdminAddUserToGroupCommand({
                UserPoolId: USER_POOL_ID,
                Username: userId,
                GroupName: group
            });
            await cognitoClient.send(addCommand);
        }
        const signOutCommand = new client_cognito_identity_provider_1.AdminUserGlobalSignOutCommand({
            UserPoolId: USER_POOL_ID,
            Username: userId
        });
        await cognitoClient.send(signOutCommand);
        await (0, audit_1.auditLog)({
            actor: auth,
            action: 'user.role_change',
            resource: { type: 'user', id: userId },
            result: 'success',
            details: {
                vendor_id: input.vendor_id,
                old_groups: currentGroups.Groups?.map(g => g.GroupName),
                new_groups: input.groups
            }
        });
        logger_1.logger.info('User roles updated successfully', {
            requestId,
            actor: auth,
            action: 'adminUpdateRoles',
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
        logger_1.logger.error('Update roles failed', {
            requestId,
            action: 'adminUpdateRoles',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
