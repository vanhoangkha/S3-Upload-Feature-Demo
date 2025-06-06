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

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await Auth.forgotPassword(username);
      setCodeSent(true);
      setSuccess('Verification code sent to your email');
    } catch (err) {
      console.error('Error requesting code:', err);
      setError(err.message || 'An error occurred while requesting the code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);

    try {
      await Auth.forgotPasswordSubmit(username, code, newPassword);
      setSuccess('Password reset successful');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successful. Please sign in with your new password.' } });
      }, 2000);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err.message || 'An error occurred while resetting your password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box padding="l" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Grid gridDefinition={[{ colspan: { default: 12, s: 8, m: 6, l: 4 } }]}>
        <Container
          header={
            <Header variant="h1" description={codeSent ? "Reset your password" : "Recover your account"}>
              Forgot Password
            </Header>
          }
        >
          {!codeSent ? (
            <form onSubmit={handleSendCode}>
              <SpaceBetween size="l">
                {error && <Alert type="error">{error}</Alert>}
                {success && <Alert type="success">{success}</Alert>}

                <FormField label="Username" controlId="username">
                  <Input
                    type="text"
                    id="username"
                    value={username}
                    onChange={({ detail }) => setUsername(detail.value)}
                    placeholder="Enter your username"
                    required
                  />
                </FormField>

                <Button
                  variant="primary"
                  formAction="submit"
                  loading={loading}
                  fullWidth
                >
                  Send verification code
                </Button>

                <Box textAlign="center">
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    Back to sign in
                  </Link>
                </Box>
              </SpaceBetween>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <SpaceBetween size="l">
                {error && <Alert type="error">{error}</Alert>}
                {success && <Alert type="success">{success}</Alert>}

                <FormField label="Verification Code" controlId="code">
                  <Input
                    type="text"
                    id="code"
                    value={code}
                    onChange={({ detail }) => setCode(detail.value)}
                    placeholder="Enter verification code"
                    required
                  />
                </FormField>

                <FormField label="New Password" controlId="newPassword">
                  <Input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={({ detail }) => setNewPassword(detail.value)}
                    placeholder="Create new password"
                    required
                  />
                </FormField>

                <FormField label="Confirm Password" controlId="confirmPassword">
                  <Input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={({ detail }) => setConfirmPassword(detail.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </FormField>

                <Button
                  variant="primary"
                  formAction="submit"
                  loading={loading}
                  fullWidth
                >
                  Reset password
                </Button>

                <Box textAlign="center">
                  <Button
                    variant="link"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await Auth.forgotPassword(username);
                        setError('');
                        setSuccess('Verification code resent to your email');
                        setLoading(false);
                      } catch (err) {
                        setError(err.message || 'Failed to resend code');
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    Resend code
                  </Button>
                </Box>
              </SpaceBetween>
            </form>
          )}
        </Container>
      </Grid>
    </Box>
  );
};

export default ForgotPassword;
