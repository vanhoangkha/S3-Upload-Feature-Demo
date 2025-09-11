import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getCurrentUser, signIn, signOut, signUp, confirmSignUp, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { useNavigate } from 'react-router-dom';
import { Spinner, Box } from '@cloudscape-design/components';
import { AuthContextType, AuthenticatedUser } from '../types/auth';
import { queryClient } from '../providers/QueryProvider';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
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
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearUserSession = useCallback(() => {
    setUser(null);
    // Clear all React Query cache data
    queryClient.clear();
    // Clear navigation history and redirect to login without any state
    navigate('/login', { replace: true, state: null });
    // Clear any potential browser history stack by replacing multiple times
    window.history.replaceState(null, '', '/login');
  }, [navigate]);

  useEffect(() => {
    checkAuthState();

    // Listen for authentication events
    const listener = Hub.listen('auth', ({ payload }) => {
      const { event } = payload;

      if (event === 'signedIn') {
        checkAuthState();
      }
      if (event === 'signedOut') {
        clearUserSession();
      }
    });

    return () => {
      listener();
    };
  }, [clearUserSession]);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();

      const authenticatedUser: AuthenticatedUser = {
        cognitoUser: {
          username: currentUser.username,
          email: currentUser.signInDetails?.loginId || '',
          sub: currentUser.userId,
          email_verified: true, // Amplify v6 doesn't expose this directly
          'cognito:groups': session.tokens?.idToken?.payload['cognito:groups'] as string[] || [],
          name: currentUser.signInDetails?.loginId,
          phone_number: undefined
        },
        idToken: session.tokens?.idToken?.toString() || '',
        refreshToken: '' // Refresh token is not directly accessible in Amplify v6
      };

      setUser(authenticatedUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (username: string, password: string): Promise<void> => {
    try {
      await signIn({ username, password });
      await checkAuthState();
    } catch (error) {
      throw error;
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
      clearUserSession();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const handleSignUp = async (username: string, password: string, email: string): Promise<void> => {
    try {
      await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email
          }
        }
      });
    } catch (error) {
      throw error;
    }
  };

  const handleConfirmSignUp = async (username: string, code: string): Promise<void> => {
    try {
      await confirmSignUp({ username, confirmationCode: code });
    } catch (error) {
      throw error;
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.cognitoUser['cognito:groups']?.includes('admin') || false;

  const value: AuthContextType = {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    isAuthenticated,
    isAdmin
  };

  if (loading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
