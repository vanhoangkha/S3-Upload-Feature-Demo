"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../lib/auth");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const security_1 = require("../lib/security");
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const validatedEvent = (0, security_1.sanitizeEvent)(event);
        const auth = (0, auth_1.requireAuth)(validatedEvent);
        logger_1.logger.info('Who am I request', {
            requestId,
            actor: auth,
            action: 'whoAmI'
        });
        const userInfo = {
            userId: auth.userId,
            vendorId: auth.vendorId,
            roles: auth.roles,
            email: auth.email || null,
            username: auth.email?.split('@')[0] || auth.userId,
            permissions: {
                canViewDocuments: true,
                canCreateDocuments: true,
                canManageUsers: auth.roles.includes('Admin'),
                canViewVendorData: auth.roles.includes('Admin') || auth.roles.includes('Vendor'),
                canViewAuditLogs: auth.roles.includes('Admin')
            },
            lastLogin: new Date().toISOString()
        };
        logger_1.logger.info('Who am I success', {
            requestId,
            actor: auth,
            action: 'whoAmI',
            result: 'success',
            latency_ms: Date.now() - startTime
        });
        return (0, security_1.createSafeResponse)(200, userInfo);
    }
    catch (error) {
        logger_1.logger.error('Who am I failed', {
            requestId,
            action: 'whoAmI',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
