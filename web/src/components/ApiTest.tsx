import React, { useState } from 'react';
import { Button, Container, Header, SpaceBetween, Box, Alert, Input, FormField } from '@cloudscape-design/components';
import { apiClient } from '../lib/api';

export const ApiTest: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [token, setToken] = useState<string>('');

  const testApi = async (endpoint: string) => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      if (token) {
        apiClient.setToken(token);
      }
      
      let response;
      switch (endpoint) {
        case '/me':
          response = await apiClient.whoAmI();
          break;
        case '/files':
          response = await apiClient.listDocuments({});
          break;
        default:
          response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          response = await response.json();
      }
      setResult(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      header={
        <Header variant="h2" description="Test API endpoints with JWT token">
          API Testing
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        <FormField label="JWT Token" description="Paste your JWT access token here">
          <Input
            value={token}
            onChange={({ detail }) => setToken(detail.value)}
            placeholder="eyJraWQiOiJ4SVBzSnA2d2dTNXRweFBSUDRSVW5jT3lIc0MyMk..."
            type="password"
          />
        </FormField>

        <SpaceBetween direction="horizontal" size="s">
          <Button loading={loading} onClick={() => testApi('/me')}>
            Test /me
          </Button>
          <Button loading={loading} onClick={() => testApi('/files')}>
            Test /files
          </Button>
          <Button loading={loading} onClick={() => testApi('/health')}>
            Test /health
          </Button>
        </SpaceBetween>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {result && (
          <Box>
            <Box variant="h4">Response:</Box>
            <Box variant="code">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </Box>
          </Box>
        )}

        <Box>
          <Box variant="h4">Instructions:</Box>
          <Box variant="p">
            1. Run: <code>node test-api.js</code> in terminal to get JWT token<br/>
            2. Copy the access token from terminal output<br/>
            3. Paste it in the JWT Token field above<br/>
            4. Click test buttons to verify API endpoints
          </Box>
        </Box>
      </SpaceBetween>
    </Container>
  );
};
