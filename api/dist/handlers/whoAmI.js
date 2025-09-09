"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../lib/auth");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
const handler = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        logger_1.logger.info('WhoAmI debug - event context', {
            requestId,
            authorizer: event.requestContext.authorizer,
            headers: event.headers
        });
        const auth = (0, auth_1.requireAuth)(event);
        logger_1.logger.info('Who am I request', {
            requestId,
            actor: auth,
            action: 'whoAmI'
        });
        const response = {
            userId: auth.userId,
            vendorId: auth.vendorId,
            roles: auth.roles,
            email: auth.email || null,
            username: auth.email?.split('@')[0] || auth.userId
        };
        logger_1.logger.info('Who am I success', {
            requestId,
            actor: auth,
            action: 'whoAmI',
            result: 'success',
            latency_ms: Date.now() - startTime
        });
        return (0, errors_1.createSuccessResponse)(response);
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
