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

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await Auth.signUp({
        username,
        password,
        attributes: {
          email
        }
      });
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await Auth.confirmSignUp(username, confirmationCode);
      navigate('/login');
    } catch (error) {
      console.error('Error confirming sign up:', error);
      setError(error.message || 'Failed to confirm registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  return (
    <Box padding="l" textAlign="center">
      <Container
        header={<Header variant="h1">Create an Account</Header>}
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={navigateToLogin} variant="link">Already have an account? Sign in</Button>
          </SpaceBetween>
        }
      >
        {!showConfirmation ? (
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="primary" onClick={handleRegister} loading={loading}>Register</Button>
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
            <FormField label="Email" controlId="email">
              <Input
                type="email"
                value={email}
                onChange={({ detail }) => setEmail(detail.value)}
              />
            </FormField>
            <FormField label="Password" controlId="password">
              <Input
                type="password"
                value={password}
                onChange={({ detail }) => setPassword(detail.value)}
              />
            </FormField>
            <FormField label="Confirm Password" controlId="confirmPassword">
              <Input
                type="password"
                value={confirmPassword}
                onChange={({ detail }) => setConfirmPassword(detail.value)}
              />
            </FormField>
          </Form>
        ) : (
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="primary" onClick={handleConfirmation} loading={loading}>Confirm</Button>
              </SpaceBetween>
            }
          >
            {error && <Alert type="error">{error}</Alert>}
            <Alert type="info">
              A confirmation code has been sent to your email. Please enter the code below to complete registration.
            </Alert>
            <FormField label="Confirmation Code" controlId="confirmationCode">
              <Input
                type="text"
                value={confirmationCode}
                onChange={({ detail }) => setConfirmationCode(detail.value)}
              />
            </FormField>
          </Form>
        )}
      </Container>
    </Box>
  );
};

export default Register;
