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

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await Auth.forgotPassword(username);
      setCodeSent(true);
    } catch (error) {
      console.error('Error sending code:', error);
      setError(error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await Auth.forgotPasswordSubmit(username, code, newPassword);
      navigate('/login');
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
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
        header={<Header variant="h1">Reset Password</Header>}
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={navigateToLogin} variant="link">Back to Sign In</Button>
          </SpaceBetween>
        }
      >
        {!codeSent ? (
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="primary" onClick={handleSendCode} loading={loading}>Send Code</Button>
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
          </Form>
        ) : (
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="primary" onClick={handleResetPassword} loading={loading}>Reset Password</Button>
              </SpaceBetween>
            }
          >
            {error && <Alert type="error">{error}</Alert>}
            <Alert type="info">
              A verification code has been sent to your email. Please enter the code and your new password below.
            </Alert>
            <FormField label="Verification Code" controlId="code">
              <Input
                type="text"
                value={code}
                onChange={({ detail }) => setCode(detail.value)}
              />
            </FormField>
            <FormField label="New Password" controlId="newPassword">
              <Input
                type="password"
                value={newPassword}
                onChange={({ detail }) => setNewPassword(detail.value)}
              />
            </FormField>
            <FormField label="Confirm New Password" controlId="confirmPassword">
              <Input
                type="password"
                value={confirmPassword}
                onChange={({ detail }) => setConfirmPassword(detail.value)}
              />
            </FormField>
          </Form>
        )}
      </Container>
    </Box>
  );
};

export default ForgotPassword;
