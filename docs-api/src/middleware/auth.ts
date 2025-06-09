import { Context, Next } from 'hono';
import { logger } from '../utils/logger';
import { AuthenticatedUser, CognitoUser, AuthContext, UserRole } from '../types/auth';

declare module 'hono' {
  interface ContextVariableMap {
    authContext: AuthContext;
  }
}

/**
 * Extract JWT claims from Authorization header (for direct JWT parsing)
 */
export function extractJWTClaims(authHeader: string): CognitoUser | null {
  try {
    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    // Decode JWT without verification (since we're assuming API Gateway or Cognito has already verified it)
    // In production, you should verify the signature, but for now we'll trust the token
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Basic validation - must have sub
    if (!payload.sub) {
      return null;
    }

    // Handle both ID tokens and Access tokens from Cognito
    // Access tokens have 'username' field, ID tokens have 'email' and 'cognito:username'
    let email = payload.email;
    let cognitoUsername = payload['cognito:username'];

    // For access tokens, we need to construct missing fields
    if (payload.token_use === 'access') {
      // Access tokens have username but not email or cognito:username
      // Use username as email if email is not present
      if (!email && payload.username) {
        email = payload.username;
        cognitoUsername = payload.username;
      }
    }

    // Ensure we have essential user information
    if (!email && !cognitoUsername && !payload.username) {
      logger.warn('JWT token missing essential user identification fields', {
        tokenUse: payload.token_use,
        hasSub: !!payload.sub,
        hasEmail: !!payload.email,
        hasUsername: !!payload.username,
        hasCognitoUsername: !!payload['cognito:username']
      });
      return null;
    }

    // Create a normalized user object
    const normalizedPayload: CognitoUser = {
      sub: payload.sub,
      email: email || payload.username || payload.sub, // Fallback chain
      'cognito:username': cognitoUsername || payload.username || email || payload.sub,
      'cognito:groups': payload['cognito:groups'] || [], // Access tokens typically don't have groups
      // Include other standard Cognito fields if present
      iss: payload.iss,
      aud: payload.aud || payload.client_id,
      token_use: payload.token_use,
      scope: payload.scope,
      auth_time: payload.auth_time,
      exp: payload.exp,
      iat: payload.iat,
      jti: payload.jti,
      username: payload.username
    };

    logger.debug('Successfully parsed JWT token', {
      tokenUse: payload.token_use,
      sub: payload.sub,
      email: normalizedPayload.email,
      username: normalizedPayload['cognito:username'],
      hasGroups: (normalizedPayload['cognito:groups']?.length || 0) > 0
    });

    return normalizedPayload;
  } catch (error) {
    logger.error('Error parsing JWT token:', error);
    return null;
  }
}

/**
 * Extract Cognito user information from API Gateway Lambda event
 */
export function extractCognitoUser(c: Context): AuthenticatedUser | null {
  try {
    // In Hono AWS Lambda adapter, the original event is available differently
    // Try to get the event from the context
    const event = c.env?.event || c.env;

    // Debug logging to see what's available
    logger.debug('Context env:', c.env);
    logger.debug('Event requestContext:', event?.requestContext);

    if (!event?.requestContext) {
      logger.warn('No requestContext found in event');
      return null;
    }

    let claims: CognitoUser | null = null;

    // For Cognito User Pool authorizer, claims are in different locations
    if (event.requestContext.authorizer) {
      // Check for JWT claims from Cognito User Pool authorizer
      if (event.requestContext.authorizer.jwt?.claims) {
        claims = event.requestContext.authorizer.jwt.claims as CognitoUser;
      }
      // Check for direct claims format
      else if (event.requestContext.authorizer.claims) {
        claims = event.requestContext.authorizer.claims as CognitoUser;
      }
      // Check for direct authorizer format (some configurations)
      else {
        claims = event.requestContext.authorizer as CognitoUser;
      }
    }

    if (!claims || !claims.sub) {
      logger.warn('No valid Cognito claims found in event');
      logger.debug('Available authorizer data:', event.requestContext.authorizer);
      return null;
    }

    // Extract user groups for role-based authorization
    const groups = claims['cognito:groups'] || [];
    const isAdmin = groups.includes(UserRole.ADMIN) || groups.includes('Administrators');

    return {
      userId: claims.sub,
      email: claims.email || null,
      username: claims['cognito:username'] || null,
      groups,
      isAdmin
    };
  } catch (error) {
    logger.error('Error extracting Cognito user:', error);
    return null;
  }
}

/**
 * Authentication middleware that extracts user context from Cognito JWT
 */
export async function authMiddleware(c: Context, next: Next) {
  let user = extractCognitoUser(c);

  // If no user found from API Gateway context, try parsing JWT directly
  if (!user) {
    const authHeader = c.req.header('Authorization');
    if (authHeader) {
      logger.debug('No Cognito context found, attempting direct JWT parsing');
      const claims = extractJWTClaims(authHeader);
      if (claims) {
        // Extract user groups for role-based authorization
        const groups = claims['cognito:groups'] || [];
        const isAdmin = groups.includes(UserRole.ADMIN) || groups.includes('Administrators');

        user = {
          userId: claims.sub,
          email: claims.email || null,
          username: claims['cognito:username'] || null,
          groups,
          isAdmin
        };
        logger.info('Successfully authenticated user via JWT parsing', { userId: user?.userId, email: user?.email });
      }
    }
  } else {
    logger.info('Successfully authenticated user via API Gateway context', { userId: user?.userId, email: user?.email });
  }

  if (!user) {
    logger.warn('Authentication failed - no valid user context found');
    return c.json({
      success: false,
      error: 'Unauthorized - Invalid or missing authentication'
    }, 401);
  }

  // Set auth context in Hono variables
  c.set('authContext', {
    user,
    isAuthenticated: true
  });

  await next();
}

/**
 * Optional authentication middleware (allows both authenticated and unauthenticated requests)
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  let user = extractCognitoUser(c);

  // If no user found from API Gateway context, try parsing JWT directly
  if (!user) {
    const authHeader = c.req.header('Authorization');
    if (authHeader) {
      logger.debug('No Cognito context found, attempting direct JWT parsing for optional auth');
      const claims = extractJWTClaims(authHeader);
      if (claims) {
        // Extract user groups for role-based authorization
        const groups = claims['cognito:groups'] || [];
        const isAdmin = groups.includes(UserRole.ADMIN) || groups.includes('Administrators');

        user = {
          userId: claims.sub,
          email: claims.email || null,
          username: claims['cognito:username'] || null,
          groups,
          isAdmin
        };
        logger.debug('Successfully authenticated user via JWT parsing in optional auth', { userId: user?.userId, email: user?.email });
      }
    }
  }

  c.set('authContext', {
    user: user || null,
    isAuthenticated: !!user
  });

  await next();
}

/**
 * Admin-only middleware
 */
export async function adminOnlyMiddleware(c: Context, next: Next) {
  const authContext = c.get('authContext');

  if (!authContext?.isAuthenticated || !authContext.user?.isAdmin) {
    return c.json({
      success: false,
      error: 'Forbidden - Admin access required'
    }, 403);
  }

  await next();
}

/**
 * User resource access middleware - ensures users can only access their own resources
 * This middleware validates that the user can access the resource specified by the :user_id route parameter
 */
export async function userResourceMiddleware(c: Context, next: Next) {
  const authContext = c.get('authContext');

  if (!authContext?.isAuthenticated || !authContext.user) {
    return c.json({
      success: false,
      error: 'Unauthorized'
    }, 401);
  }

  // Admin can access any user's resources
  if (authContext.user.isAdmin) {
    await next();
    return;
  }

  // Extract the user_id from the route parameter
  const targetUserId = c.req.param('user_id');

  // Debug logging removed for production

  // If no user_id in route, this middleware shouldn't be applied
  if (!targetUserId) {
    logger.warn('userResourceMiddleware applied to route without :user_id parameter', {
      path: c.req.path,
      method: c.req.method
    });
    await next();
    return;
  }

  // Regular users can only access their own resources
  if (targetUserId !== authContext.user.userId) {
    logger.warn('User attempted to access another user\'s resources', {
      currentUserId: authContext.user.userId,
      targetUserId: targetUserId,
      path: c.req.path,
      method: c.req.method
    });

    return c.json({
      success: false,
      error: 'Forbidden - You can only access your own resources'
    }, 403);
  }

  await next();
}

/**
 * Document access middleware - ensures users can only access their own documents
 * This middleware is for routes that include document paths with user IDs embedded in them
 */
export async function documentAccessMiddleware(c: Context, next: Next) {
  const authContext = c.get('authContext');

  if (!authContext?.isAuthenticated || !authContext.user) {
    return c.json({
      success: false,
      error: 'Unauthorized'
    }, 401);
  }

  // Admin can access any user's documents
  if (authContext.user.isAdmin) {
    await next();
    return;
  }

  // Try to extract user ID from the encoded document path
  let targetUserId: string | null = null;

  // First, try to get from route parameter (for standard routes)
  const userIdParam = c.req.param('user_id');
  const fileParam = c.req.param('file');

  logger.debug('documentAccessMiddleware params', {
    userIdParam,
    fileParam: fileParam ? decodeURIComponent(fileParam) : null,
    path: c.req.path,
    method: c.req.method
  });

  if (userIdParam) {
    // Check if userIdParam looks like a file path instead of a UUID
    // If it contains "protected/" then it's likely the entire file path
    if (userIdParam.includes('protected/')) {
      // Extract user ID from the path pattern: protected/{user_id}/...
      const pathMatch = userIdParam.match(/^protected\/([a-f0-9\-]{36})\//i);
      if (pathMatch) {
        targetUserId = pathMatch[1];
      }
    } else {
      // It's a proper user ID
      targetUserId = userIdParam;
    }
  } else {
    // Try to extract from document path in the file parameter
    if (fileParam) {
      const decodedPath = decodeURIComponent(fileParam);

      // Match pattern: protected/{user_id}/...
      const pathMatch = decodedPath.match(/^protected\/([a-f0-9\-]{36})\//i);
      if (pathMatch) {
        targetUserId = pathMatch[1];
      }
    }
  }

  logger.debug('Document access check', {
    currentUserId: authContext.user.userId,
    targetUserId: targetUserId,
    path: c.req.path,
    method: c.req.method,
    userIdParam,
    fileParam: fileParam ? decodeURIComponent(fileParam) : null
  });

  // If we couldn't extract a user ID, deny access for security
  if (!targetUserId) {
    logger.warn('Could not extract user ID from document path', {
      path: c.req.path,
      method: c.req.method,
      fileParam: c.req.param('file')
    });
    return c.json({
      success: false,
      error: 'Forbidden - Invalid document path'
    }, 403);
  }

  // Regular users can only access their own documents
  if (targetUserId !== authContext.user.userId) {
    logger.warn('User attempted to access another user\'s document', {
      currentUserId: authContext.user.userId,
      targetUserId: targetUserId,
      path: c.req.path,
      method: c.req.method
    });

    return c.json({
      success: false,
      error: 'Forbidden - You can only access your own documents'
    }, 403);
  }

  await next();
}

/**
 * Helper function to get current authenticated user
 */
export function getCurrentUser(c: Context): AuthenticatedUser | null {
  const authContext = c.get('authContext');
  return authContext?.user || null;
}

/**
 * Helper function to check if current user is admin
 */
export function isCurrentUserAdmin(c: Context): boolean {
  const user = getCurrentUser(c);
  return user?.isAdmin || false;
}
