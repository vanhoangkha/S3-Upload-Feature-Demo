import { Context, Next } from 'hono';
import { logger } from '../utils/logger';
import { CognitoUser, UserRole, AuthenticatedUser } from '../types/auth';

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthenticatedUser | null;
  }
}

// =============================================================================
// Cognito User Extraction Logic
// =============================================================================

/**
 * Check if user is admin based on Cognito groups
 */
function isUserAdmin(claims: CognitoUser): boolean {
  const groups = claims['cognito:groups'] || [];
  return groups.includes(UserRole.ADMIN) || groups.includes('admin');
}

/**
 * Extract comprehensive user information from Cognito JWT claims
 */
function createUserFromClaims(claims: CognitoUser): AuthenticatedUser {
  return {
    userId: claims.sub,
    email: claims.email || null,
    username: claims['cognito:username'] || claims.username || null,
    groups: claims['cognito:groups'] || [],
    isAdmin: isUserAdmin(claims)
  };
}

/**
 * Extract user information from API Gateway Cognito authorizer context
 */
function extractUserFromEvent(c: Context): AuthenticatedUser | null {
  try {
    // Get the Lambda event from Hono context
    const event = c.env?.event;
    if (!event) {
      logger.debug('No event found in context');
      return null;
    }

    // Extract claims from API Gateway authorizer context
    const requestContext = event.requestContext;
    let claims: CognitoUser | null = null;

    // API Gateway v2 with JWT authorizer
    if (requestContext?.authorizer?.jwt?.claims) {
      claims = requestContext.authorizer.jwt.claims as CognitoUser;
      logger.debug('Found JWT claims in authorizer context');
    }
    // API Gateway v1 with Cognito User Pool authorizer
    else if (requestContext?.authorizer?.claims) {
      claims = requestContext.authorizer.claims as CognitoUser;
      logger.debug('Found claims in authorizer context');
    }
    // Lambda authorizer context
    else if (requestContext?.authorizer && requestContext.authorizer.sub) {
      claims = requestContext.authorizer as CognitoUser;
      logger.debug('Found direct authorizer claims');
    }

    if (!claims?.sub) {
      logger.debug('No valid claims found in event context');
      return null;
    }

    const user = createUserFromClaims(claims);
    logger.debug('Successfully extracted user from event', {
      userId: user.userId,
      email: user.email,
      groups: user.groups,
      isAdmin: user.isAdmin
    });

    return user;
  } catch (error) {
    logger.error('Error extracting user from event:', error);
    return null;
  }
}

/**
 * Fallback: Extract user from Authorization header JWT token
 * This should rarely be needed when using Cognito authorizer
 */
function extractUserFromJWT(c: Context): AuthenticatedUser | null {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const parts = token.split('.');

    if (parts.length !== 3) {
      logger.debug('Invalid JWT token format');
      return null;
    }

    // Decode JWT payload (no verification - this is just for fallback)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    if (!payload.sub) {
      logger.debug('No sub claim in JWT token');
      return null;
    }

    const user = createUserFromClaims(payload as CognitoUser);
    logger.debug('Successfully extracted user from JWT token', {
      userId: user.userId,
      email: user.email,
      groups: user.groups,
      isAdmin: user.isAdmin
    });

    return user;
  } catch (error) {
    logger.debug('Failed to parse JWT token:', error);
    return null;
  }
}

/**
 * Main user extraction function - tries event context first, then JWT fallback
 */
function extractUser(c: Context): AuthenticatedUser | null {
  // Primary: Extract from API Gateway event context (Cognito authorizer)
  const userFromEvent = extractUserFromEvent(c);
  if (userFromEvent) {
    return userFromEvent;
  }

  // Fallback: Extract from Authorization header
  const userFromJWT = extractUserFromJWT(c);
  if (userFromJWT) {
    logger.debug('Using JWT fallback for user extraction');
    return userFromJWT;
  }

  return null;
}

// =============================================================================
// Middleware Functions
// =============================================================================

/**
 * Authentication middleware - extracts user info and sets context
 */
export async function authMiddleware(c: Context, next: Next) {
  const user = extractUser(c);
  c.set('user', user);

  if (user) {
    logger.debug('User authenticated', {
      userId: user.userId,
      email: user.email,
      groups: user.groups,
      isAdmin: user.isAdmin
    });
  }

  await next();
}

/**
 * Admin-only middleware - requires admin privileges
 */
export async function adminOnlyMiddleware(c: Context, next: Next) {
  const user = c.get('user');

  if (!user) {
    logger.warn('Authentication failed - no valid user found');
    return c.json({
      success: false,
      error: 'Unauthorized - Authentication required'
    }, 401);
  }

  if (!user.isAdmin) {
    logger.warn('Access denied - admin privileges required', {
      userId: user.userId,
      email: user.email,
      groups: user.groups,
      isAdmin: user.isAdmin
    });
    return c.json({
      success: false,
      error: 'Forbidden - Admin privileges required'
    }, 403);
  }

  logger.debug('Admin access granted', {
    userId: user.userId,
    email: user.email
  });

  await next();
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get current authenticated user
 */
export function getCurrentUser(c: Context): AuthenticatedUser | null {
  return c.get('user') || null;
}

/**
 * Check if current user is admin
 */
export function isCurrentUserAdmin(c: Context): boolean {
  const user = getCurrentUser(c);
  return user?.isAdmin || false;
}

/**
 * Get current user ID
 */
export function getCurrentUserId(c: Context): string | null {
  const user = getCurrentUser(c);
  return user?.userId || null;
}

/**
 * Get current user email
 */
export function getCurrentUserEmail(c: Context): string | null {
  const user = getCurrentUser(c);
  return user?.email || null;
}

/**
 * Get current user groups
 */
export function getCurrentUserGroups(c: Context): string[] {
  const user = getCurrentUser(c);
  return user?.groups || [];
}

/**
 * Check if current user belongs to a specific group
 */
export function isUserInGroup(c: Context, groupName: string): boolean {
  const groups = getCurrentUserGroups(c);
  return groups.includes(groupName);
}

/**
 * Require authentication - throws error if not authenticated
 */
export function requireAuth(c: Context): AuthenticatedUser {
  const user = getCurrentUser(c);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Require admin privileges - throws error if not admin
 */
export function requireAdmin(c: Context): AuthenticatedUser {
  const user = requireAuth(c);
  if (!user.isAdmin) {
    throw new Error('Admin privileges required');
  }
  return user;
}
