import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Auth } from 'aws-amplify';
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

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await Auth.signIn(username, password);
      navigate('/');
    } catch (err) {
      console.error('Error signing in:', err);
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box padding="l" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Grid gridDefinition={[{ colspan: { default: 12, s: 8, m: 6, l: 4 } }]}>
        <Container
          header={
            <Header variant="h1" description="Sign in to your account">
              S3 Upload Demo
            </Header>
          }
        >
          <form onSubmit={handleSubmit}>
            <SpaceBetween size="l">
              {error && <Alert type="error">{error}</Alert>}

              <FormField label="Username" controlId="username">
                <Input
                  type="text"
                  id="username"
                  value={username}
                  onChange={({ detail }) => setUsername(detail.value)}
                  autoComplete="username"
                  placeholder="Enter your username"
                  required
                />
              </FormField>

              <FormField label="Password" controlId="password">
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={({ detail }) => setPassword(detail.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
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
  );
};

export default Login;
