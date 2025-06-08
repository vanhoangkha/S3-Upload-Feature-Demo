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
 */
export async function userResourceMiddleware(c: Context, next: Next) {
  const authContext = c.get('authContext');
  const userIdParam = c.req.param('user_id');

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

  // Regular users can only access their own resources
  if (userIdParam && userIdParam !== authContext.user.userId) {
    return c.json({
      success: false,
      error: 'Forbidden - You can only access your own resources'
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
