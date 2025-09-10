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
        const profile = {
            userId: auth.userId,
            vendorId: auth.vendorId,
            roles: auth.roles,
            email: auth.email,
            username: auth.email?.split('@')[0] || auth.userId,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        logger_1.logger.info('User profile retrieved', {
            requestId,
            actor: auth,
            action: 'getUserProfile',
            result: 'success',
            latency_ms: Date.now() - startTime
        });
        return (0, security_1.createSafeResponse)(200, profile);
    }
    catch (error) {
        logger_1.logger.error('Get user profile failed', {
            requestId,
            action: 'getUserProfile',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
