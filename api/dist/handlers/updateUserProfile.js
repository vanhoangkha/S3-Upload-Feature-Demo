"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../lib/auth");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const security_1 = require("../lib/security");
const audit_1 = require("../lib/audit");
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const validatedEvent = (0, security_1.sanitizeEvent)(event);
        const auth = (0, auth_1.requireAuth)(validatedEvent);
        const body = (0, security_1.safeJsonParse)(validatedEvent.body);
        const { name, preferences } = body;
        const updatedProfile = {
            userId: auth.userId,
            vendorId: auth.vendorId,
            roles: auth.roles,
            email: auth.email,
            name: name || auth.email?.split('@')[0] || auth.userId,
            preferences: preferences || {},
            updatedAt: new Date().toISOString()
        };
        await (0, audit_1.auditLog)({
            actor: auth,
            action: 'user.profile_update',
            resource: { type: 'user', id: auth.userId },
            result: 'success',
            details: { name, preferences }
        });
        logger_1.logger.info('User profile updated', {
            requestId,
            actor: auth,
            action: 'updateUserProfile',
            result: 'success',
            latency_ms: Date.now() - startTime
        });
        return (0, security_1.createSafeResponse)(200, updatedProfile);
    }
    catch (error) {
        logger_1.logger.error('Update user profile failed', {
            requestId,
            action: 'updateUserProfile',
            result: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
