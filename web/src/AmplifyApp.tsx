import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator, ThemeProvider, View, Flex } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { dmsTheme } from './theme/amplify-theme';
import { AmplifyAuthProvider } from './components/AmplifyAuthProvider';
import { AmplifyNavigation } from './components/AmplifyNavigation';
import { AmplifyDrivePage } from './pages/AmplifyDrivePage';
import { AmplifyUserProfilePage } from './pages/AmplifyUserProfilePage';
import { AmplifyAdminPage } from './pages/AmplifyAdminPage';

function AmplifyApp() {
  return (
    <ThemeProvider theme={dmsTheme}>
      <Authenticator
        signUpAttributes={['email']}
        components={{
          Header() {
            return (
              <View textAlign="center" padding="large">
                <h1 style={{ color: '#232f3e', marginBottom: '0.5rem' }}>
                  Document Management System
                </h1>
                <p style={{ color: '#687078', margin: 0 }}>
                  Secure document management powered by AWS Amplify
                </p>
              </View>
            );
          },
        }}
        formFields={{
          signUp: {
            'custom:vendor_id': {
              order: 2,
              placeholder: 'Enter your organization ID',
              label: 'Organization ID',
              required: true,
            },
            'custom:roles': {
              order: 3,
              placeholder: 'User',
              label: 'Role',
              defaultValue: 'User',
            },
          },
        }}
      >
        {({ signOut, user }) => (
          <AmplifyAuthProvider>
            <Router>
              <Flex direction="row" height="100vh">
                <AmplifyNavigation signOut={signOut} />
                <View flex="1" backgroundColor="background.secondary">
                  <Routes>
                    <Route path="/" element={<Navigate to="/drive" replace />} />
                    <Route path="/drive" element={<AmplifyDrivePage />} />
                    <Route path="/profile" element={<AmplifyUserProfilePage />} />
                    <Route path="/admin" element={<AmplifyAdminPage />} />
                    <Route path="/vendor" element={<AmplifyDrivePage />} />
                    <Route path="/audit" element={<div>Audit Page - Coming Soon</div>} />
                  </Routes>
                </View>
              </Flex>
            </Router>
          </AmplifyAuthProvider>
        )}
      </Authenticator>
    </ThemeProvider>
  );
}

export default AmplifyApp;
