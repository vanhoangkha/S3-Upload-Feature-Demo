"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event) => {
    console.log('PreTokenGeneration triggered');
    if (!event?.request?.userAttributes) {
        console.error('Invalid event structure');
        return event;
    }
    const { sub: userId, email } = event.request.userAttributes;
    const vendorId = event.request.userAttributes['custom:vendor_id'] || '';
    const userGroups = event.request.groupConfiguration?.groupsToOverride || [];
    event.response = {
        claimsOverrideDetails: {
            claimsToAddOrOverride: {
                vendor_id: vendorId,
                email: email || '',
                user_id: userId,
                'cognito:groups': userGroups.join(','),
                'custom:permissions': buildPermissions(userGroups, vendorId, userId).join(','),
                'custom:scope': getAccessScope(userGroups, vendorId, userId),
                'custom:document_access': getDocumentAccess(userGroups, vendorId, userId),
                'custom:user_access': getUserAccess(userGroups, vendorId),
                'custom:admin_access': getAdminAccess(userGroups)
            }
        }
    };
    console.log(`Token generated for user ${userId} with groups: ${userGroups.join(',')} and scope: ${getAccessScope(userGroups, vendorId, userId)}`);
    return event;
};
exports.handler = handler;
function buildPermissions(groups, vendorId, userId) {
    const permissions = [];
    if (groups.includes('Admin')) {
        permissions.push('admin:*', 'read:*', 'write:*', 'delete:*');
    }
    else if (groups.includes('Vendor')) {
        permissions.push(`vendor:${vendorId}`, `read:vendor:${vendorId}`, `write:vendor:${vendorId}`);
    }
    else if (groups.includes('User')) {
        permissions.push(`user:${userId}`, `read:user:${userId}`, `write:user:${userId}`);
    }
    return permissions;
}
function getAccessScope(groups, vendorId, userId) {
    if (groups.includes('Admin'))
        return 'global';
    if (groups.includes('Vendor'))
        return `vendor:${vendorId}`;
    if (groups.includes('User'))
        return `user:${userId}`;
    return 'none';
}
function getDocumentAccess(groups, vendorId, userId) {
    if (groups.includes('Admin'))
        return 'all';
    if (groups.includes('Vendor'))
        return vendorId;
    if (groups.includes('User'))
        return userId;
    return 'none';
}
function getUserAccess(groups, vendorId) {
    if (groups.includes('Admin'))
        return 'all';
    if (groups.includes('Vendor'))
        return vendorId;
    return 'self';
}
function getAdminAccess(groups) {
    return groups.includes('Admin') ? 'full' : 'none';
}
