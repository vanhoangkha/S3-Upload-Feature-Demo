"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const auth_1 = require("../lib/auth");
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
        const auth = (0, auth_1.requireAuth)(validatedEvent);
        (0, auth_1.requireRole)(auth, ['Vendor', 'Admin']);
        const queryParams = validatedEvent.queryStringParameters || {};
        const { limit, nextToken } = (0, validation_1.validateInput)(validation_1.listUsersSchema, queryParams);
        const command = new client_cognito_identity_provider_1.ListUsersCommand({
            UserPoolId: USER_POOL_ID,
            Limit: limit,
            PaginationToken: nextToken,
            Filter: `custom:vendor_id = "${auth.vendorId}"`
        });
        const response = await cognitoClient.send(command);
        const users = (response.Users || []).map(user => ({
            username: user.Username,
            status: user.UserStatus,
            email: user.Attributes?.find(attr => attr.Name === 'email')?.Value,
            vendor_id: user.Attributes?.find(attr => attr.Name === 'custom:vendor_id')?.Value,
            created: user.UserCreateDate?.toISOString(),
            lastModified: user.UserLastModifiedDate?.toISOString()
        }));
        logger_1.logger.info('Vendor users retrieved', {
            requestId,
            actor: auth,
            action: 'getVendorUsers',
            result: 'success',
            count: users.length,
            latency_ms: Date.now() - startTime
        });
        return (0, security_1.createSafeResponse)(200, {
            users,
            total: users.length,
            nextToken: response.PaginationToken
        });
    }
    catch (error) {
        logger_1.logger.error('Get vendor users failed', {
            requestId,
            action: 'getVendorUsers',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
