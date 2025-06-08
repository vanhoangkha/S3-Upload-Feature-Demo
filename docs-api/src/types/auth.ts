// Authentication types for API Gateway Cognito authorizer context

export interface CognitoUser {
  sub: string; // User ID from Cognito
  email?: string; // Present in ID tokens, optional in access tokens
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  'cognito:username'?: string; // Present in ID tokens
  'cognito:groups'?: string[]; // Present in ID tokens, usually not in access tokens
  username?: string; // Present in access tokens
  iss?: string; // Issuer
  aud?: string; // Audience
  client_id?: string; // Client ID (in access tokens)
  token_use?: string; // 'id' or 'access'
  scope?: string; // Scopes for access tokens
  auth_time?: number;
  exp?: number;
  iat?: number;
  jti?: string; // JWT ID
  origin_jti?: string; // Original JWT ID
  event_id?: string; // Event ID
}

export interface AuthorizerContext {
  principalId: string;
  claims: CognitoUser;
  sourceIp: string;
  userAgent: string;
}

export interface APIGatewayProxyEventV2WithAuth {
  requestContext: {
    authorizer?: {
      jwt?: {
        claims: CognitoUser;
        scopes?: string[];
      };
    };
    http: {
      method: string;
      path: string;
      sourceIp: string;
      userAgent: string;
    };
  };
}

export interface AuthenticatedUser {
  userId: string; // Cognito sub
  email: string | null;
  username: string | null;
  groups: string[];
  isAdmin: boolean;
}

// User roles for authorization
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer'
}

export interface AuthContext {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
}
