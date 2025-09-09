import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Auth } from 'aws-amplify';
import { apiClient, UserInfo } from '../lib/api';

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      
      // First check Amplify auth state
      try {
        const { getCurrentUser, fetchAuthSession } = await import('aws-amplify/auth');
        const currentUser = await getCurrentUser();
        const session = await fetchAuthSession();
        
        if (session.tokens?.idToken) {
          const idToken = session.tokens.idToken.toString();
          setToken(idToken);
          localStorage.setItem('dms_token', idToken);
          apiClient.setToken(idToken);
          
          // Extract user info and roles from JWT
          const payload = JSON.parse(atob(idToken.split('.')[1]));
          const cognitoGroups = payload['cognito:groups'] || [];
          
          const userInfo = {
            userId: payload.sub,
            username: payload['cognito:username'] || payload.email?.split('@')[0],
            email: payload.email,
            vendorId: payload.vendor_id || payload['custom:vendor_id'] || '',
            roles: cognitoGroups
          };
          
          setUser(userInfo);
          return;
        }
      } catch (amplifyError) {
        console.log('No active Amplify session');
      }
      
      // Fallback: Check if we have a stored token
      const storedToken = localStorage.getItem('dms_token');
      if (storedToken) {
        setToken(storedToken);
        apiClient.setToken(storedToken);
        
        try {
          const userInfo = await apiClient.whoAmI();
          
          // Extract roles from JWT token for proper RBAC
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          const cognitoGroups = payload['cognito:groups'] || [];
          
          setUser({
            ...userInfo,
            roles: cognitoGroups
          });
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('dms_token');
          setToken(null);
          apiClient.clearToken();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string) => {
    try {
      setToken(newToken);
      localStorage.setItem('dms_token', newToken);
      apiClient.setToken(newToken);
      
      // Extract user info and roles from JWT token
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      const cognitoGroups = payload['cognito:groups'] || [];
      
      const userInfo = {
        userId: payload.sub,
        username: payload['cognito:username'] || payload.email?.split('@')[0],
        email: payload.email,
        vendorId: payload.vendor_id || payload['custom:vendor_id'] || '',
        roles: cognitoGroups
      };
      
      setUser(userInfo);
    } catch (error) {
      console.error('Login failed:', error);
      signOut();
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Amplify
      const { signOut: amplifySignOut } = await import('aws-amplify/auth');
      await amplifySignOut();
    } catch (error) {
      console.log('Amplify signout error:', error);
    }
    
    // Clear local state
    setUser(null);
    setToken(null);
    localStorage.removeItem('dms_token');
    apiClient.clearToken();
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    signOut,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
