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

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      await Auth.signUp({
        username: formData.username,
        password: formData.password,
        attributes: {
          email: formData.email,
        },
      });
      
      setVerificationSent(true);
    } catch (err) {
      console.error('Error signing up:', err);
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await Auth.confirmSignUp(formData.username, verificationCode);
      navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
    } catch (err) {
      console.error('Error confirming sign up:', err);
      setError(err.message || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box padding="l" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Grid gridDefinition={[{ colspan: { default: 12, s: 8, m: 6, l: 4 } }]}>
        <Container
          header={
            <Header variant="h1" description={verificationSent ? "Verify your account" : "Create a new account"}>
              S3 Upload Demo
            </Header>
          }
        >
          {!verificationSent ? (
            <form onSubmit={handleSubmit}>
              <SpaceBetween size="l">
                {error && <Alert type="error">{error}</Alert>}

                <FormField label="Username" controlId="username">
                  <Input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={({ detail }) => handleChange('username', detail.value)}
                    autoComplete="username"
                    placeholder="Choose a username"
                    required
                  />
                </FormField>

                <FormField label="Email" controlId="email">
                  <Input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={({ detail }) => handleChange('email', detail.value)}
                    autoComplete="email"
                    placeholder="Enter your email"
                    required
                  />
                </FormField>

                <FormField label="Password" controlId="password">
                  <Input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={({ detail }) => handleChange('password', detail.value)}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    required
                  />
                </FormField>

                <FormField label="Confirm Password" controlId="confirmPassword">
                  <Input
                    type="password"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={({ detail }) => handleChange('confirmPassword', detail.value)}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    required
                  />
                </FormField>

                <Button
                  variant="primary"
                  formAction="submit"
                  loading={loading}
                  fullWidth
                >
                  Sign up
                </Button>

                <Box textAlign="center">
                  Already have an account?{' '}
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    Sign in
                  </Link>
                </Box>
              </SpaceBetween>
            </form>
          ) : (
            <form onSubmit={handleVerification}>
              <SpaceBetween size="l">
                {error && <Alert type="error">{error}</Alert>}
                
                <Alert type="info">
                  A verification code has been sent to your email address. Please enter the code below to verify your account.
                </Alert>

                <FormField label="Verification Code" controlId="verificationCode">
                  <Input
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={({ detail }) => setVerificationCode(detail.value)}
                    placeholder="Enter verification code"
                    required
                  />
                </FormField>

                <Button
                  variant="primary"
                  formAction="submit"
                  loading={loading}
                  fullWidth
                >
                  Verify
                </Button>

                <Box textAlign="center">
                  <Button
                    variant="link"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await Auth.resendSignUp(formData.username);
                        setError('');
                        setLoading(false);
                        alert('Verification code resent successfully');
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

export default Register;
