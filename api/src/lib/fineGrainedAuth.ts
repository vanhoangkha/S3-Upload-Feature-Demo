import { APIGatewayProxyEvent } from 'aws-lambda';

export interface AuthContext {
  userId: string;
  email: string;
  vendorId: string;
  groups: string[];
  permissions: string[];
  resourceAccess: {
    documents: { scope: string; filter: string };
    users: { scope: string; filter: string };
    admin: { scope: string; actions: string[] };
  };
}

export interface AuthorizationRequest {
  action: string;
  resource: string;
  resourceId?: string;
  context?: Record<string, any>;
}

export class FineGrainedAuthorizer {
  static extractAuthContext(event: APIGatewayProxyEvent): AuthContext | null {
    try {
      const authHeader = event.headers.Authorization || event.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }

      const token = authHeader.substring(7);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      const permissions = payload.permissions ? JSON.parse(payload.permissions) : [];
      const resourceAccess = payload.resource_access ? JSON.parse(payload.resource_access) : {};
      const groups = payload['cognito:groups'] ? payload['cognito:groups'].split(',') : [];

      return {
        userId: payload.sub || payload.user_id,
        email: payload.email || '',
        vendorId: payload.vendor_id || payload['custom:vendor_id'] || '',
        groups,
        permissions,
        resourceAccess
      };
    } catch (error) {
      console.error('Failed to extract auth context:', error);
      return null;
    }
  }

  static authorize(authContext: AuthContext, request: AuthorizationRequest): boolean {
    const { action, resource, resourceId, context } = request;
    
    // Check direct permission
    if (authContext.permissions.includes(`${action}:${resource}`)) {
      return true;
    }

    // Check resource-specific permissions
    if (resourceId) {
      const resourcePermission = `${action}:${resource}:${resourceId}`;
      if (authContext.permissions.includes(resourcePermission)) {
        return true;
      }
    }

    // Check scoped permissions based on resource access
    return this.checkScopedAccess(authContext, request);
  }

  private static checkScopedAccess(authContext: AuthContext, request: AuthorizationRequest): boolean {
    const { action, resource, resourceId, context } = request;

    switch (resource) {
      case 'documents':
        return this.checkDocumentAccess(authContext, action, resourceId, context);
      case 'users':
        return this.checkUserAccess(authContext, action, resourceId, context);
      case 'admin':
        return this.checkAdminAccess(authContext, action);
      default:
        return false;
    }
  }

  private static checkDocumentAccess(
    authContext: AuthContext, 
    action: string, 
    documentId?: string, 
    context?: Record<string, any>
  ): boolean {
    const { scope, filter } = authContext.resourceAccess.documents || { scope: 'none', filter: '' };

    switch (scope) {
      case 'all':
        return ['read', 'create', 'update', 'delete'].includes(action);
      
      case 'vendor':
        // Check if document belongs to user's vendor
        if (context?.document?.vendorId === filter) {
          return ['read', 'create', 'update', 'delete'].includes(action);
        }
        return false;
      
      case 'user':
        // Check if document belongs to user
        if (context?.document?.ownerId === filter) {
          return ['read', 'create', 'update', 'delete'].includes(action);
        }
        return false;
      
      default:
        return false;
    }
  }

  private static checkUserAccess(
    authContext: AuthContext, 
    action: string, 
    userId?: string, 
    context?: Record<string, any>
  ): boolean {
    const { scope, filter } = authContext.resourceAccess.users || { scope: 'none', filter: '' };

    switch (scope) {
      case 'all':
        return ['read', 'create', 'update', 'delete'].includes(action);
      
      case 'vendor':
        // Check if user belongs to same vendor
        if (context?.user?.vendorId === filter) {
          return ['read', 'create', 'update'].includes(action);
        }
        return false;
      
      default:
        return action === 'read' && userId === authContext.userId; // Can read own profile
    }
  }

  private static checkAdminAccess(authContext: AuthContext, action: string): boolean {
    const { scope, actions } = authContext.resourceAccess.admin || { scope: 'none', actions: [] };
    
    return scope === 'full' && actions.includes(action);
  }

  // Helper method for common authorization patterns
  static requirePermission(permission: string) {
    return (authContext: AuthContext) => {
      return authContext.permissions.includes(permission);
    };
  }

  static requireRole(role: string) {
    return (authContext: AuthContext) => {
      return authContext.groups.includes(role);
    };
  }

  static requireAnyRole(roles: string[]) {
    return (authContext: AuthContext) => {
      return roles.some(role => authContext.groups.includes(role));
    };
  }

  // Resource ownership checks
  static isDocumentOwner(documentOwnerId: string) {
    return (authContext: AuthContext) => {
      return authContext.userId === documentOwnerId;
    };
  }

  static isSameVendor(resourceVendorId: string) {
    return (authContext: AuthContext) => {
      return authContext.vendorId === resourceVendorId;
    };
  }
}

// Middleware function for Lambda handlers
export function withFineGrainedAuth(
  handler: (event: APIGatewayProxyEvent, authContext: AuthContext) => Promise<any>
) {
  return async (event: APIGatewayProxyEvent) => {
    const authContext = FineGrainedAuthorizer.extractAuthContext(event);
    
    if (!authContext) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    return handler(event, authContext);
  };
}

// Authorization decorator for specific permissions
export function requiresAuthorization(request: AuthorizationRequest) {
  return function(
    handler: (event: APIGatewayProxyEvent, authContext: AuthContext) => Promise<any>
  ) {
    return withFineGrainedAuth(async (event: APIGatewayProxyEvent, authContext: AuthContext) => {
      const authorized = FineGrainedAuthorizer.authorize(authContext, request);
      
      if (!authorized) {
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Forbidden' }),
        };
      }

      return handler(event, authContext);
    });
  };
}
