// RBAC utility following AWS Cognito User Groups pattern
// Based on: https://repost.aws/questions/QUpYtLZR5wQVqOSWI4BcblQQ/rbac-for-api-gateway-endpoints-using-cognito-user-groups

export interface RBACPermissions {
  // Document permissions
  canViewDocuments: boolean;
  canCreateDocuments: boolean;
  canEditDocuments: boolean;
  canDeleteDocuments: boolean;
  
  // Admin permissions
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  canManageSystem: boolean;
  
  // Vendor permissions
  canViewVendorData: boolean;
  canManageVendorUsers: boolean;
}

export const getRBACPermissions = (roles: string[], vendorId?: string): RBACPermissions => {
  const isAdmin = roles.includes('Admin');
  const isVendor = roles.includes('Vendor');
  const isUser = roles.includes('User');

  return {
    // Document permissions - all authenticated users can view/create
    canViewDocuments: isAdmin || isVendor || isUser,
    canCreateDocuments: isAdmin || isVendor || isUser,
    canEditDocuments: isAdmin || isVendor || isUser,
    canDeleteDocuments: isAdmin || isVendor || isUser,
    
    // Admin-only permissions
    canManageUsers: isAdmin,
    canViewAuditLogs: isAdmin,
    canManageSystem: isAdmin,
    
    // Vendor permissions (can manage their own vendor data)
    canViewVendorData: isAdmin || (isVendor && !!vendorId),
    canManageVendorUsers: isAdmin || (isVendor && !!vendorId),
  };
};

export const hasPermission = (
  roles: string[], 
  permission: keyof RBACPermissions, 
  vendorId?: string
): boolean => {
  const permissions = getRBACPermissions(roles, vendorId);
  return permissions[permission];
};

// Route-based permissions mapping
export const routePermissions: Record<string, keyof RBACPermissions> = {
  '/admin': 'canManageUsers',
  '/admin/users': 'canManageUsers',
  '/audit': 'canViewAuditLogs',
  '/vendor': 'canViewVendorData',
  '/drive': 'canViewDocuments',
  '/': 'canViewDocuments',
};

export const canAccessRoute = (
  path: string, 
  roles: string[], 
  vendorId?: string
): boolean => {
  const requiredPermission = routePermissions[path];
  if (!requiredPermission) {
    // If no specific permission required, allow access for authenticated users
    return roles.length > 0;
  }
  
  return hasPermission(roles, requiredPermission, vendorId);
};

// JWT token utilities for extracting Cognito Groups
export const extractRolesFromToken = (token: string): string[] => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['cognito:groups'] || [];
  } catch (error) {
    console.error('Failed to extract roles from token:', error);
    return [];
  }
};

export const extractVendorIdFromToken = (token: string): string => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.vendor_id || payload['custom:vendor_id'] || '';
  } catch (error) {
    console.error('Failed to extract vendor ID from token:', error);
    return '';
  }
};
