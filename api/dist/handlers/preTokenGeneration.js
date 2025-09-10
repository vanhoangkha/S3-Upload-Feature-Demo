"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event) => {
    console.log('PreTokenGeneration triggered', JSON.stringify(event, null, 2));
    try {
        if (!event?.request?.userAttributes) {
            console.error('Invalid event structure - missing userAttributes');
            return event;
        }
        const { sub: userId, email } = event.request.userAttributes;
        const vendorId = event.request.userAttributes['custom:vendor_id'] || '';
        let userGroups = event.request.groupConfiguration?.groupsToOverride || [];
        const identities = event.request.userAttributes['identities'];
        if (identities) {
            const externalRole = event.request.userAttributes['custom:role'] || event.request.userAttributes['role'];
            if (externalRole) {
                userGroups = mapExternalRole(externalRole);
            }
        }
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
    }
    catch (error) {
        console.error('PreTokenGeneration error:', error);
        return event;
    }
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
function mapExternalRole(externalRole) {
    const roleMapping = {
        'admin': ['Admin'],
        'administrator': ['Admin'],
        'vendor': ['Vendor'],
        'supplier': ['Vendor'],
        'user': ['User'],
        'employee': ['User']
    };
    return roleMapping[externalRole?.toLowerCase()] || ['User'];
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
