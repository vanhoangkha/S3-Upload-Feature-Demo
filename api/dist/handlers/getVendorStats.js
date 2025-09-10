"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const auth_1 = require("../lib/auth");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const dynamodb_1 = require("../lib/dynamodb");
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
        const documents = await (0, dynamodb_1.queryDocumentsByVendor)(auth.vendorId, 1000);
        const totalDocuments = documents.items.length;
        const storageUsed = documents.items.reduce((total, doc) => total + (doc.size || 0), 0);
        const usersCommand = new client_cognito_identity_provider_1.ListUsersCommand({
            UserPoolId: USER_POOL_ID,
            Filter: `custom:vendor_id = "${auth.vendorId}"`
        });
        const usersResponse = await cognitoClient.send(usersCommand);
        const totalUsers = usersResponse.Users?.length || 0;
        const stats = {
            totalDocuments,
            totalUsers,
            storageUsed,
            averageDocumentSize: totalDocuments > 0 ? Math.round(storageUsed / totalDocuments) : 0,
            lastUpdated: new Date().toISOString()
        };
        logger_1.logger.info('Vendor stats retrieved', {
            requestId,
            actor: auth,
            action: 'getVendorStats',
            result: 'success',
            stats,
            latency_ms: Date.now() - startTime
        });
        return (0, security_1.createSafeResponse)(200, stats);
    }
    catch (error) {
        logger_1.logger.error('Get vendor stats failed', {
            requestId,
            action: 'getVendorStats',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
