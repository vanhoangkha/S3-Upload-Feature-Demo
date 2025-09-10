import { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from 'aws-lambda';
import { requireAuth, AuthContext } from './auth';
import { ForbiddenError } from './errors';

export type Role = 'Admin' | 'Vendor' | 'User';
export type Permission = 'read' | 'write' | 'delete' | 'admin';

// RBAC configuration
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Admin: ['read', 'write', 'delete', 'admin'],
  Vendor: ['read', 'write', 'delete'],
  User: ['read', 'write']
};

export const requirePermission = (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
  permission: Permission
): AuthContext => {
  const auth = requireAuth(event);
  
  // Check if user has required permission through their roles
  const hasPermission = auth.roles.some(role => 
    ROLE_PERMISSIONS[role as Role]?.includes(permission)
  );
  
  if (!hasPermission) {
    throw new ForbiddenError(`Required permission: ${permission}`);
  }
  
  return auth;
};

export const requireRole = (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
  ...roles: Role[]
): AuthContext => {
  const auth = requireAuth(event);
  
  const hasRole = roles.some(role => auth.roles.includes(role));
  if (!hasRole) {
    throw new ForbiddenError(`Required role: ${roles.join(' or ')}`);
  }
  
  return auth;
};

export const requireAdmin = (event: APIGatewayProxyEvent | APIGatewayProxyEventV2): AuthContext => {
  return requireRole(event, 'Admin');
};
