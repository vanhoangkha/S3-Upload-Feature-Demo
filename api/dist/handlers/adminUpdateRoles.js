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
        const userId = validatedEvent.pathParameters?.id;
        if (!userId) {
            throw new errors_1.NotFoundError('User ID is required');
        }
        const body = (0, security_1.safeJsonParse)(validatedEvent.body);
        const input = (0, validation_1.validateInput)(validation_1.updateRolesSchema, body);
        const validGroups = ['Admin', 'Vendor', 'User'];
        const invalidGroups = input.groups.filter(g => !validGroups.includes(g));
        if (invalidGroups.length > 0) {
            throw new errors_1.BadRequestError(`Invalid groups: ${invalidGroups.join(', ')}`);
        }
        const currentGroups = await cognitoClient.send(new client_cognito_identity_provider_1.AdminListGroupsForUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: userId
        }));
        try {
            if (input.vendor_id) {
                await cognitoClient.send(new client_cognito_identity_provider_1.AdminUpdateUserAttributesCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: userId,
                    UserAttributes: [
                        { Name: 'custom:vendor_id', Value: input.vendor_id }
                    ]
                }));
            }
            for (const group of currentGroups.Groups || []) {
                await cognitoClient.send(new client_cognito_identity_provider_1.AdminRemoveUserFromGroupCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: userId,
                    GroupName: group.GroupName
                }));
            }
            for (const group of input.groups) {
                await cognitoClient.send(new client_cognito_identity_provider_1.AdminAddUserToGroupCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: userId,
                    GroupName: group
                }));
            }
        }
        catch (error) {
            for (const group of currentGroups.Groups || []) {
                try {
                    await cognitoClient.send(new client_cognito_identity_provider_1.AdminAddUserToGroupCommand({
                        UserPoolId: USER_POOL_ID,
                        Username: userId,
                        GroupName: group.GroupName
                    }));
                }
                catch (rollbackError) {
                    logger_1.logger.error('Rollback failed', { userId, group: group.GroupName, error: rollbackError });
                }
            }
            throw error;
        }
        await cognitoClient.send(new client_cognito_identity_provider_1.AdminUserGlobalSignOutCommand({
            UserPoolId: USER_POOL_ID,
            Username: userId
        }));
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
        return (0, security_1.createSafeResponse)(200, {
            success: true,
            userId,
            newGroups: input.groups,
            updatedAt: new Date().toISOString()
        });
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
