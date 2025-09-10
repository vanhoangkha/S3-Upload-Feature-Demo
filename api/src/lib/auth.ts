import { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from 'aws-lambda';
import { UnauthorizedError, ForbiddenError } from './errors';

export interface AuthContext {
  userId: string;
  vendorId: string;
  roles: string[];
  email?: string;
}

export const requireAuth = (event: APIGatewayProxyEvent | APIGatewayProxyEventV2): AuthContext => {
  // Extract JWT claims from API Gateway JWT authorizer
  const claims = (event.requestContext as any)?.authorizer?.jwt?.claims;
  
  if (!claims?.sub) {
    throw new UnauthorizedError('Missing JWT claims');
  }
  
  // Parse roles from cognito:groups claim
  const groups = claims['cognito:groups']?.split(',') || [];
  
  return {
    userId: claims.sub,
    vendorId: claims['custom:vendor_id'] || '',
    roles: groups,
    email: claims.email || ''
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
