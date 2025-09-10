"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const rbac_1 = require("../lib/rbac");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const security_1 = require("../lib/security");
const cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const validatedEvent = (0, security_1.sanitizeEvent)(event);
        const auth = (0, rbac_1.requireAdmin)(validatedEvent);
        const queryParams = validatedEvent.queryStringParameters || {};
        const { limit, nextToken } = (0, validation_1.validateInput)(validation_1.listUsersSchema, queryParams);
        const command = new client_cognito_identity_provider_1.ListUsersCommand({
            UserPoolId: USER_POOL_ID,
            Limit: limit,
            PaginationToken: nextToken
        });
        const response = await cognitoClient.send(command);
        const usersWithGroups = await Promise.all((response.Users || []).map(async (user) => {
            try {
                const groupsCommand = new client_cognito_identity_provider_1.AdminListGroupsForUserCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: user.Username
                });
                const groupsResponse = await cognitoClient.send(groupsCommand);
                return {
                    username: user.Username,
                    status: user.UserStatus,
                    email: user.Attributes?.find(attr => attr.Name === 'email')?.Value,
                    vendor_id: user.Attributes?.find(attr => attr.Name === 'custom:vendor_id')?.Value,
                    groups: groupsResponse.Groups?.map(g => g.GroupName) || [],
                    created: user.UserCreateDate?.toISOString(),
                    lastModified: user.UserLastModifiedDate?.toISOString()
                };
            }
            catch (error) {
                return {
                    username: user.Username,
                    status: user.UserStatus,
                    email: user.Attributes?.find(attr => attr.Name === 'email')?.Value,
                    vendor_id: user.Attributes?.find(attr => attr.Name === 'custom:vendor_id')?.Value,
                    groups: [],
                    created: user.UserCreateDate?.toISOString(),
                    lastModified: user.UserLastModifiedDate?.toISOString()
                };
            }
        }));
        logger_1.logger.info('Users listed successfully', {
            requestId,
            actor: auth,
            action: 'adminListUsers',
            result: 'success',
            count: usersWithGroups.length,
            latency_ms: Date.now() - startTime
        });
        return (0, security_1.createSafeResponse)(200, {
            items: usersWithGroups,
            nextToken: response.PaginationToken
        });
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
