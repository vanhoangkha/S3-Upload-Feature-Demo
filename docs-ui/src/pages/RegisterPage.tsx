import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { RegisterFormData } from '../types/auth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, confirmSignUp } = useAuth();
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleChange = (field: keyof RegisterFormData, value: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      await signUp(formData.username, formData.password, formData.email);
      setVerificationSent(true);
    } catch (err: any) {
      console.error('Error signing up:', err);
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await confirmSignUp(formData.username, verificationCode);
      navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
    } catch (err: any) {
      console.error('Error confirming sign up:', err);
      setError(err.message || 'An error occurred during verification');
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
              <Header variant="h1" description={verificationSent ? "Verify your account" : "Create a new account"}>
                Document Management System
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
                          await signUp(formData.username, formData.password, formData.email);
                          setError('');
                          setLoading(false);
                          alert('Verification code resent successfully');
                        } catch (err: any) {
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
    </div>
  );
};
