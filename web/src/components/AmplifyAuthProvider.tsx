import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, AuthUser, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { apiClient, UserInfo } from '../lib/api';

interface AmplifyAuthContextType {
  user: AuthUser | null;
  userInfo: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AmplifyAuthContext = createContext<AmplifyAuthContextType | undefined>(undefined);

export const AmplifyAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth events
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          checkAuthState();
          break;
        case 'signedOut':
          setUser(null);
          setUserInfo(null);
          apiClient.clearToken();
          break;
      }
    });

    return unsubscribe;
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Get JWT token and set it in API client
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      
      if (idToken) {
        apiClient.setToken(idToken);
        
        // Fetch user info from API
        try {
          const info = await apiClient.whoAmI();
          setUserInfo(info);
        } catch (error) {
          console.error('Failed to fetch user info:', error);
        }
      }
    } catch (error) {
      setUser(null);
      setUserInfo(null);
      apiClient.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setUserInfo(null);
      apiClient.clearToken();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const hasRole = (role: string): boolean => {
    return userInfo?.roles?.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const value: AmplifyAuthContextType = {
    user,
    userInfo,
    isLoading,
    isAuthenticated: !!user,
    signOut: handleSignOut,
    hasRole,
    hasAnyRole
  };

  return (
    <AmplifyAuthContext.Provider value={value}>
      {children}
    </AmplifyAuthContext.Provider>
  );
};

export const useAmplifyAuth = (): AmplifyAuthContextType => {
  const context = useContext(AmplifyAuthContext);
  if (context === undefined) {
    throw new Error('useAmplifyAuth must be used within an AmplifyAuthProvider');
  }
  return context;
};
