import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Form,
  FormField,
  Input,
  SpaceBetween,
  Alert,
  Link,
  Icon,
  Grid
} from '@cloudscape-design/components';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CustomLoginProps {
  onToggleMode?: () => void;
  showHostedUIOption?: boolean;
}

export const CustomLogin: React.FC<CustomLoginProps> = ({ 
  onToggleMode, 
  showHostedUIOption = true 
}) => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signIn(credentials.username, credentials.password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHostedUILogin = () => {
    // Import AuthService dynamically to avoid circular imports
    import('../lib/auth').then(({ AuthService }) => {
      window.location.href = AuthService.getHostedUIUrl('login');
    });
  };

  return (
    <Box 
      minHeight="100vh" 
      display="flex"
      alignItems="center"
      justifyContent="center"
      backgroundColor="background-layout-main"
      padding="l"
    >
      <Container>
        <Grid gridDefinition={[{ 
          colspan: { default: 12, xs: 10, s: 8, m: 6, l: 4 }, 
          offset: { default: 0, xs: 1, s: 2, m: 3, l: 4 } 
        }]}>
          <Box>
            {/* Brand Header */}
            <Box textAlign="center" margin={{ bottom: 'xl' }}>
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                margin={{ bottom: 'm' }}
              >
                <Box 
                  padding="s"
                  backgroundColor="background-container-content"
                  borderRadius="50%"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  margin={{ right: 's' }}
                >
                  <Icon name="folder" size="large" />
                </Box>
                <Box variant="h1" color="text-heading">
                  DMS
                </Box>
              </Box>
              <Box variant="h3" color="text-body-secondary" margin={{ bottom: 'xs' }}>
                Document Management System
              </Box>
              <Box variant="p" color="text-body-secondary" fontSize="body-s">
                Secure • Scalable • Simple
              </Box>
            </Box>

            {/* Login Card */}
            <Container>
              <SpaceBetween direction="vertical" size="l">
                <Box textAlign="center">
                  <Box variant="h2" margin={{ bottom: 'xs' }}>
                    Welcome back
                  </Box>
                  <Box variant="p" color="text-body-secondary" fontSize="body-s">
                    Sign in to access your documents
                  </Box>
                </Box>

                {error && (
                  <Alert 
                    type="error" 
                    dismissible 
                    onDismiss={() => setError('')}
                    header="Sign in failed"
                  >
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSignIn}>
                  <SpaceBetween direction="vertical" size="m">
                    <FormField 
                      label="Email or Username"
                      stretch
                    >
                      <Input
                        value={credentials.username}
                        onChange={({ detail }) => 
                          setCredentials(prev => ({ ...prev, username: detail.value }))
                        }
                        placeholder="Enter your email or username"
                        type="email"
                        autoComplete="username"
                        disabled={isLoading}
                      />
                    </FormField>

                    <FormField 
                      label="Password"
                      stretch
                    >
                      <Input
                        value={credentials.password}
                        onChange={({ detail }) => 
                          setCredentials(prev => ({ ...prev, password: detail.value }))
                        }
                        placeholder="Enter your password"
                        type="password"
                        autoComplete="current-password"
                        disabled={isLoading}
                      />
                    </FormField>

                    <Button 
                      variant="primary" 
                      loading={isLoading}
                      onClick={handleSignIn}
                      disabled={!credentials.username || !credentials.password}
                      fullWidth
                      size="large"
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </SpaceBetween>
                </Form>

                {showHostedUIOption && (
                  <>
                    {/* Divider */}
                    <Box textAlign="center">
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center"
                      >
                        <Box 
                          backgroundColor="border-divider-default" 
                          height="1px" 
                          width="100%" 
                        />
                        <Box 
                          variant="small" 
                          color="text-body-secondary" 
                          margin={{ horizontal: 'm' }}
                          backgroundColor="background-container-content"
                          padding={{ horizontal: 's' }}
                        >
                          or
                        </Box>
                        <Box 
                          backgroundColor="border-divider-default" 
                          height="1px" 
                          width="100%" 
                        />
                      </Box>
                    </Box>

                    {/* Alternative Options */}
                    <SpaceBetween direction="vertical" size="s">
                      <Button 
                        variant="normal" 
                        onClick={handleHostedUILogin}
                        fullWidth
                        iconName="external"
                        disabled={isLoading}
                      >
                        Continue with AWS Cognito
                      </Button>
                      
                      {onToggleMode && (
                        <Button 
                          variant="link" 
                          onClick={onToggleMode}
                          fullWidth
                          disabled={isLoading}
                        >
                          Try Amplify UI Experience
                        </Button>
                      )}
                    </SpaceBetween>
                  </>
                )}

                {/* Footer Links */}
                <Box textAlign="center">
                  <SpaceBetween direction="horizontal" size="m" alignItems="center">
                    <Link 
                      onFollow={() => navigate('/auth/request-access')}
                      fontSize="body-s"
                    >
                      Request access
                    </Link>
                    <Box color="text-body-secondary" fontSize="body-s">•</Box>
                    <Link 
                      onFollow={() => navigate('/auth/forgot-password')}
                      fontSize="body-s"
                    >
                      Forgot password?
                    </Link>
                  </SpaceBetween>
                </Box>
              </SpaceBetween>
            </Container>

            {/* Trust Indicators */}
            <Box margin={{ top: 'xl' }} textAlign="center">
              <Box variant="small" color="text-body-secondary" margin={{ bottom: 's' }}>
                Trusted by organizations worldwide
              </Box>
              <SpaceBetween direction="horizontal" size="l" alignItems="center">
                <Box display="flex" alignItems="center" justifyContent="center">
                  <Icon name="security" />
                  <Box variant="small" margin={{ left: 'xs' }} color="text-body-secondary">
                    Enterprise Security
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="center">
                  <Icon name="user-profile" />
                  <Box variant="small" margin={{ left: 'xs' }} color="text-body-secondary">
                    Role-Based Access
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="center">
                  <Icon name="status-positive" />
                  <Box variant="small" margin={{ left: 'xs' }} color="text-body-secondary">
                    Audit Trail
                  </Box>
                </Box>
              </SpaceBetween>
            </Box>
          </Box>
        </Grid>
      </Container>
    </Box>
  );
};
