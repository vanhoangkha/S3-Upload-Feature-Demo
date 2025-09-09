import React, { useEffect } from 'react';
import { Authenticator, Theme, ThemeProvider } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useNavigate } from 'react-router-dom';

const theme: Theme = {
  name: 'aws-dms-theme',
  tokens: {
    components: {
      authenticator: {
        router: {
          boxShadow: '0 0 16px rgba(0, 0, 0, 0.1)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '{colors.border.primary}',
        },
        form: {
          padding: '{space.xl}',
        },
      },
      button: {
        primary: {
          backgroundColor: '{colors.brand.primary.80}',
        },
      },
      fieldcontrol: {
        borderRadius: '{radii.small}',
      },
    },
  },
};

export const AmplifyLoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={theme}>
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <Authenticator
          signUpAttributes={['email']}
          socialProviders={['amazon', 'google']}
          components={{
            Header() {
              return (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <h1 style={{ color: '#232f3e', marginBottom: '0.5rem' }}>
                    Document Management System
                  </h1>
                  <p style={{ color: '#687078', margin: 0 }}>
                    Secure document management for your organization
                  </p>
                </div>
              );
            },
            Footer() {
              return (
                <div style={{ textAlign: 'center', padding: '1rem 0', fontSize: '0.875rem', color: '#687078' }}>
                  Powered by AWS Amplify
                </div>
              );
            },
          }}
          formFields={{
            signIn: {
              username: {
                placeholder: 'Enter your email or username',
                label: 'Email or Username',
              },
            },
            signUp: {
              email: {
                order: 1,
                placeholder: 'Enter your email address',
              },
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
          {({ signOut, user }) => {
            // User is authenticated, check roles and redirect
            if (user) {
              const groups = user?.signInUserSession?.idToken?.payload['cognito:groups'] || [];
              const roles = Array.isArray(groups) ? groups : [groups].filter(Boolean);
              
              console.log('User authenticated:', { 
                email: user.attributes?.email, 
                roles,
                userId: user.attributes?.sub 
              });
              
              // Store user info in localStorage for the app
              localStorage.setItem('userRoles', JSON.stringify(roles));
              localStorage.setItem('userId', user.attributes?.sub || '');
              localStorage.setItem('userEmail', user.attributes?.email || '');
              
              // Redirect to main app
              navigate('/');
              return null;
            }
            return null;
          }}
        </Authenticator>
      </div>
    </ThemeProvider>
  );
};
