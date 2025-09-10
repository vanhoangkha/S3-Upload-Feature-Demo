import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Header, Spinner, Alert, Box, SpaceBetween } from '@cloudscape-design/components';
import { authService } from '../services/auth';

interface CallbackPageProps {
  onSuccess: () => void;
}

const CallbackPage: React.FC<CallbackPageProps> = ({ onSuccess }) => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(`Authentication failed: ${errorParam}`);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        await authService.handleCallback(code);
        onSuccess();
        navigate('/', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [searchParams, onSuccess, navigate]);

  return (
    <Box padding="xxl" minHeight="100vh">
      <Container>
        <SpaceBetween size="l">
          <Header variant="h1">Signing you in...</Header>
          {error ? (
            <Alert type="error" header="Authentication Error">
              {error}
            </Alert>
          ) : (
            <Box textAlign="center">
              <SpaceBetween size="m">
                <Spinner size="large" />
                <Box variant="p">
                  Please wait while we complete your sign-in...
                </Box>
              </SpaceBetween>
            </Box>
          )}
        </SpaceBetween>
      </Container>
    </Box>
  );
};

export default CallbackPage;
