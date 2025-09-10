import React from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  KeyValuePairs,
  Alert,
  ExpandableSection,
  Box
} from '@cloudscape-design/components';
import { authService } from '../services/auth';

const DebugPage: React.FC = () => {
  const user = authService.getUser();
  const token = authService.getToken();

  const parseJWT = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      return null;
    }
  };

  const jwtPayload = token ? parseJWT(token) : null;

  return (
    <SpaceBetween size="l">
      <Header 
        variant="h1"
        description="Debug JWT tokens and authentication information"
      >
        Debug Information
      </Header>

      <Alert type="warning" header="Development Only">
        This page is for development and debugging purposes only. Do not use in production.
      </Alert>

      <Container header={<Header variant="h2">Current User</Header>}>
        <KeyValuePairs
          columns={2}
          items={[
            { label: 'User ID', value: user?.userId || 'N/A' },
            { label: 'Username', value: user?.username || 'N/A' },
            { label: 'Email', value: user?.email || 'N/A' },
            { label: 'Vendor ID', value: user?.vendorId || 'N/A' },
            { label: 'Groups', value: user?.groups.join(', ') || 'None' },
            { label: 'Permissions', value: user?.permissions.join(', ') || 'None' },
            { label: 'Scope', value: user?.scope || 'N/A' },
            { label: 'Document Access', value: user?.documentAccess || 'N/A' },
          ]}
        />
      </Container>

      <Container header={<Header variant="h2">JWT Token Information</Header>}>
        {jwtPayload ? (
          <ExpandableSection headerText="JWT Payload" variant="container">
            <Box>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '16px', 
                borderRadius: '4px', 
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {JSON.stringify(jwtPayload, null, 2)}
              </pre>
            </Box>
          </ExpandableSection>
        ) : (
          <Alert type="error">No valid JWT token found</Alert>
        )}
      </Container>

      <Container header={<Header variant="h2">API Endpoints</Header>}>
        <KeyValuePairs
          columns={1}
          items={[
            { label: 'Base URL', value: 'https://wcyez0q6t8.execute-api.us-east-1.amazonaws.com/v1' },
            { label: 'Available Routes', value: 'GET /me, GET /files, POST /files, GET /admin/users, GET /admin/audits' },
            { label: 'Authentication', value: 'JWT Bearer Token' },
            { label: 'Authorization', value: 'Custom Lambda Authorizer' },
          ]}
        />
      </Container>

      <Container header={<Header variant="h2">Token Details</Header>}>
        {token && (
          <KeyValuePairs
            columns={2}
            items={[
              { label: 'Token Length', value: token.length },
              { label: 'Token Type', value: 'JWT' },
              { label: 'Issued At', value: jwtPayload?.iat ? new Date(jwtPayload.iat * 1000).toLocaleString() : 'N/A' },
              { label: 'Expires At', value: jwtPayload?.exp ? new Date(jwtPayload.exp * 1000).toLocaleString() : 'N/A' },
              { label: 'Issuer', value: jwtPayload?.iss || 'N/A' },
              { label: 'Audience', value: jwtPayload?.aud || 'N/A' },
            ]}
          />
        )}
      </Container>
    </SpaceBetween>
  );
};

export default DebugPage;
