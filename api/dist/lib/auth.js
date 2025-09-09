"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.assertAccess = exports.requireRole = exports.requireAuth = void 0;
const errors_1 = require("./errors");
const requireAuth = (event) => {
    let claims;
    console.log('Event version:', event.version);
    console.log('RequestContext:', JSON.stringify(event.requestContext, null, 2));
    if ('version' in event && event.version === '2.0') {
        claims = event.requestContext?.authorizer?.jwt?.claims;
    }
    else {
        claims = event.requestContext?.authorizer?.claims;
    }
    console.log('Extracted claims:', JSON.stringify(claims, null, 2));
    if (!claims) {
        throw new errors_1.UnauthorizedError('Missing JWT claims - token not validated by API Gateway');
    }
    let groups = [];
    if (claims['cognito:groups']) {
        groups = Array.isArray(claims['cognito:groups'])
            ? claims['cognito:groups']
            : [claims['cognito:groups']];
    }
    return {
        userId: claims.sub,
        vendorId: claims.vendor_id || claims['custom:vendor_id'] || '',
        roles: groups,
        email: claims.email
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
