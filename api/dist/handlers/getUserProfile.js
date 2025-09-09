"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../lib/auth");
const errors_1 = require("../lib/errors");
const handler = async (event) => {
    try {
        const auth = (0, auth_1.requireAuth)(event);
        return (0, errors_1.createSuccessResponse)({
            userId: auth.userId,
            vendorId: auth.vendorId,
            roles: auth.roles,
            email: auth.email,
            message: 'User profile endpoint - implementation pending'
        });
    }
    catch (error) {
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
