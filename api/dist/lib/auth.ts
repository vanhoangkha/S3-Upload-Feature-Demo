import { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from 'aws-lambda';
import { UnauthorizedError, ForbiddenError } from './errors';

export interface AuthContext {
  userId: string;
  vendorId: string;
  roles: string[];
  email?: string;
}

export const requireAuth = (event: APIGatewayProxyEvent | APIGatewayProxyEventV2): AuthContext => {
  // Extract JWT claims from API Gateway authorizer context
  let claims: any;
  
  // Debug logging
  console.log('Event version:', (event as any).version);
  console.log('RequestContext:', JSON.stringify((event as any).requestContext, null, 2));
  
  if ('version' in event && event.version === '2.0') {
    // API Gateway v2 format - JWT authorizer automatically validates token
    claims = (event.requestContext as any)?.authorizer?.jwt?.claims;
  } else {
    // API Gateway v1 format
    claims = (event.requestContext as any)?.authorizer?.claims;
  }
  
  console.log('Extracted claims:', JSON.stringify(claims, null, 2));
  
  if (!claims) {
    throw new UnauthorizedError('Missing JWT claims - token not validated by API Gateway');
  }
  
  // Parse Cognito groups
  let groups: string[] = [];
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
