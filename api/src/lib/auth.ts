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
  
  if ('version' in event && event.version === '2.0') {
    // API Gateway v2 format - JWT authorizer automatically validates token
    claims = (event.requestContext as any)?.authorizer?.jwt?.claims;
  } else {
    // API Gateway v1 format
    claims = (event.requestContext as any)?.authorizer?.claims;
  }
  
  if (!claims) {
    throw new UnauthorizedError('Missing JWT claims - token not validated by API Gateway');
  }
  
  // Parse Cognito groups - handle both array and string formats
  let groups: string[] = [];
  if (claims['cognito:groups']) {
    const groupsValue = claims['cognito:groups'];
    if (Array.isArray(groupsValue)) {
      groups = groupsValue;
    } else if (typeof groupsValue === 'string') {
      // Handle string format like "[Admin]" or "Admin"
      if (groupsValue.startsWith('[') && groupsValue.endsWith(']')) {
        // Parse JSON-like string "[Admin]" -> ["Admin"]
        try {
          groups = JSON.parse(groupsValue);
        } catch {
          // If JSON parse fails, extract content between brackets
          groups = [groupsValue.slice(1, -1)];
        }
      } else {
        groups = [groupsValue];
      }
    }
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
