import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Header,
  SpaceBetween,
  Form,
  FormField,
  Input,
  Button,
  Box,
  Alert
} from '@cloudscape-design/components';
import { Auth } from 'aws-amplify';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await Auth.signIn(username, password);
      navigate('/');
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigate('/register');
  };

  const navigateToForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <Box padding="l" textAlign="center">
      <Container
        header={<Header variant="h1">S3 Upload Feature Demo</Header>}
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={navigateToRegister}>Create account</Button>
            <Button onClick={navigateToForgotPassword} variant="link">Forgot password?</Button>
          </SpaceBetween>
        }
      >
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="primary" onClick={handleLogin} loading={loading}>Sign in</Button>
            </SpaceBetween>
          }
        >
          {error && <Alert type="error">{error}</Alert>}
          <FormField label="Username" controlId="username">
            <Input
              type="text"
              value={username}
              onChange={({ detail }) => setUsername(detail.value)}
            />
          </FormField>
          <FormField label="Password" controlId="password">
            <Input
              type="password"
              value={password}
              onChange={({ detail }) => setPassword(detail.value)}
            />
          </FormField>
        </Form>
      </Container>
    </Box>
  );
};

export default Login;
