import { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from 'aws-lambda';
import { UnauthorizedError, ForbiddenError } from './errors';

export interface AuthContext {
  userId: string;
  vendorId: string;
  roles: string[];
  email?: string;
}

export const requireAuth = (event: APIGatewayProxyEvent | APIGatewayProxyEventV2): AuthContext => {
  // Extract context from Lambda authorizer
  const authorizer = (event.requestContext as any)?.authorizer;
  
  if (!authorizer?.userId) {
    throw new UnauthorizedError('Missing authorization context');
  }
  
  // Parse roles from comma-separated string
  const roles = authorizer.roles ? authorizer.roles.split(',') : [];
  
  return {
    userId: authorizer.userId,
    vendorId: authorizer.vendorId || '',
    roles,
    email: authorizer.email || ''
  };
};

export const requireRole = (auth: AuthContext, requiredRoles: string[]): void => {
  const hasRole = requiredRoles.some(role => auth.roles.includes(role));
  if (!hasRole) {
    throw new ForbiddenError(`Required role: ${requiredRoles.join(' or ')}`);
  }
};

export const assertAccess = (auth: AuthContext, resource: { vendorId?: string; userId?: string }): void => {
  // Admin can access everything
  if (auth.roles.includes('Admin')) {
    return;
  }
  
  // Vendor can access their own vendor resources
  if (auth.roles.includes('Vendor') && resource.vendorId && auth.vendorId === resource.vendorId) {
    return;
  }
  
  // User can access their own resources
  if (resource.userId && auth.userId === resource.userId) {
    return;
  }
  
  throw new ForbiddenError('Access denied');
};

export const requireAdmin = (event: APIGatewayProxyEvent | APIGatewayProxyEventV2): AuthContext => {
  const auth = requireAuth(event);
  requireRole(auth, ['Admin']);
  return auth;
};
