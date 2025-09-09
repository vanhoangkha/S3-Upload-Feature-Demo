import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn } from 'aws-amplify/auth';
import {
  Container,
  Header,
  SpaceBetween,
  Form,
  FormField,
  Input,
  Button,
  Alert,
  Box,
  Icon,
  Grid
} from '@cloudscape-design/components';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password: password
      });

      if (isSignedIn) {
        // Get the current user session to extract the ID token
        const { getCurrentUser } = await import('aws-amplify/auth');
        const user = await getCurrentUser();
        
        // Get the JWT token from the session
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        
        if (idToken) {
          await login(idToken);
        } else {
          throw new Error('Failed to get authentication token');
        }
      } else if (nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        // Handle new password required
        const { confirmSignIn } = await import('aws-amplify/auth');
        const result = await confirmSignIn({
          challengeResponse: password
        });
        
        if (result.isSignedIn) {
          const { fetchAuthSession } = await import('aws-amplify/auth');
          const session = await fetchAuthSession();
          const idToken = session.tokens?.idToken?.toString();
          
          if (idToken) {
            await login(idToken);
          }
        }
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid
      gridDefinition={[
        { colspan: { default: 12, xs: 10, s: 8, m: 6, l: 4 }, offset: { default: 0, xs: 1, s: 2, m: 3, l: 4 } }
      ]}
    >
      <Container>
        <SpaceBetween size="l">
          <Box textAlign="center">
            <SpaceBetween size="s">
              <Icon name="folder" size="big" />
              <Header variant="h1">DMS Portal</Header>
              <Box color="text-body-secondary">Document Management System</Box>
            </SpaceBetween>
          </Box>

          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Form
              actions={
                <Button
                  variant="primary"
                  loading={loading}
                  formAction="submit"
                  fullWidth
                >
                  Sign In
                </Button>
              }
            >
              <SpaceBetween direction="vertical" size="l">
                <FormField label="Email">
                  <Input
                    value={email}
                    onChange={({ detail }) => setEmail(detail.value)}
                    type="email"
                    placeholder="Enter your email"
                    required
                  />
                </FormField>

                <FormField label="Password">
                  <Input
                    value={password}
                    onChange={({ detail }) => setPassword(detail.value)}
                    type="password"
                    placeholder="Enter your password"
                    required
                  />
                </FormField>
              </SpaceBetween>
            </Form>
          </form>

          <Alert type="info">
            <strong>Test Accounts:</strong><br />
            Admin: admin@example.com / AdminReal123!<br />
            User: testuser123@example.com / TestUser123!
          </Alert>
        </SpaceBetween>
      </Container>
    </Grid>
  );
};
