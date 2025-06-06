import React, { createContext, useState, useEffect, useContext } from 'react';
import { Auth } from 'aws-amplify';
import { Box, Spinner } from '@cloudscape-design/components';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    
    const listener = Hub.listen('auth', ({ payload }) => {
      const { event } = payload;
      
      if (event === 'signIn') {
        checkUser();
      }
      if (event === 'signOut') {
        setUser(null);
      }
    });
    
    return () => {
      listener();
    };
  }, []);

  const checkUser = async () => {
    try {
      const userData = await Auth.currentAuthenticatedUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username, password) => {
    try {
      const user = await Auth.signIn(username, password);
      setUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await Auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    signIn,
    signOut,
    loading
  };

  if (loading) {
    return (
      <Box
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
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

export default AuthProvider;
