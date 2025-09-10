"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.assertAccess = exports.requireRole = exports.requireAuth = void 0;
const errors_1 = require("./errors");
const requireAuth = (event) => {
    const authorizer = event.requestContext?.authorizer;
    if (!authorizer?.userId) {
        throw new errors_1.UnauthorizedError('Missing authorization context');
    }
    const roles = authorizer.roles ? authorizer.roles.split(',') : [];
    return {
        userId: authorizer.userId,
        vendorId: authorizer.vendorId || '',
        roles,
        email: authorizer.email || ''
    };
};
exports.requireAuth = requireAuth;
const requireRole = (auth, requiredRoles) => {
    const hasRole = requiredRoles.some(role => auth.roles.includes(role));
    if (!hasRole) {
        throw new errors_1.ForbiddenError(`Required role: ${requiredRoles.join(' or ')}`);
    }
};
exports.requireRole = requireRole;
const assertAccess = (auth, resource) => {
    if (auth.roles.includes('Admin')) {
        return;
    }
    if (auth.roles.includes('Vendor') && resource.vendorId && auth.vendorId === resource.vendorId) {
        return;
    }
    if (resource.userId && auth.userId === resource.userId) {
        return;
    }
    throw new errors_1.ForbiddenError('Access denied');
};
exports.assertAccess = assertAccess;
const requireAdmin = (event) => {
    const auth = (0, exports.requireAuth)(event);
    (0, exports.requireRole)(auth, ['Admin']);
    return auth;
};
exports.requireAdmin = requireAdmin;
