import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Container,
  Header,
  SpaceBetween,
  FormField,
  Input,
  Button,
  Box,
  Alert,
  Grid
} from '@cloudscape-design/components';
import { useAuth } from '../components/AuthProvider';
import { LoginFormData } from '../types/auth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(formData.username, formData.password);
      // Always navigate to the default route after login for security
      // Don't redirect to previous routes to prevent session hijacking
      navigate('/', { replace: true, state: null });
    } catch (err: any) {
      console.error('Error signing in:', err);
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box padding="l">
        <Grid gridDefinition={[{ colspan: { default: 12, s: 8, m: 6, l: 4 } }]}>
          <Container
            header={
              <Header variant="h1" description="Sign in to your account">
                Document Management System
              </Header>
            }
          >
            <form onSubmit={handleSubmit}>
              <SpaceBetween size="l">
                {error && <Alert type="error">{error}</Alert>}

                {location.state?.message && (
                  <Alert type="success">{location.state.message}</Alert>
                )}

                <FormField label="Username" controlId="username">
                  <Input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={({ detail }) => handleChange('username', detail.value)}
                    autoComplete="username"
                    placeholder="Enter your username"
                  />
                </FormField>

                <FormField label="Password" controlId="password">
                  <Input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={({ detail }) => handleChange('password', detail.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                </FormField>

                <Box textAlign="right">
                  <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  variant="primary"
                  formAction="submit"
                  loading={loading}
                  fullWidth
                >
                  Sign in
                </Button>

                <Box textAlign="center">
                  Don't have an account?{' '}
                  <Link to="/register" style={{ textDecoration: 'none' }}>
                    Sign up
                  </Link>
                </Box>
              </SpaceBetween>
            </form>
          </Container>
        </Grid>
      </Box>
    </div>
  );
};
