// Authentication types for the docs-ui application

export interface CognitoUser {
  username: string;
  email: string;
  sub: string; // Cognito user ID
  email_verified: boolean;
  'cognito:groups'?: string[];
  name?: string;
  phone_number?: string;
}

export interface AuthenticatedUser {
  cognitoUser: CognitoUser;
  idToken: string;
  refreshToken: string;
}

export interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (username: string, password: string, email: string) => Promise<void>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormData {
  username: string;
  newPassword?: string;
  confirmPassword?: string;
  verificationCode?: string;
}
