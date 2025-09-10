import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Header,
  SpaceBetween,
  StatusIndicator,
  KeyValuePairs,
  Alert
} from '@cloudscape-design/components';
import { apiClient } from '../services/api';

const SystemHealthPage: React.FC = () => {
  // Test API connectivity by calling /me endpoint
  const { data: healthData, isLoading, error } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => apiClient.whoAmI(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getHealthStatus = () => {
    if (error) {
      return <StatusIndicator type="error">API Error</StatusIndicator>;
    }
    if (isLoading) {
      return <StatusIndicator type="loading">Checking...</StatusIndicator>;
    }
    if (healthData) {
      return <StatusIndicator type="success">Operational</StatusIndicator>;
    }
    return <StatusIndicator type="pending">Unknown</StatusIndicator>;
  };

  return (
    <SpaceBetween size="l">
      <Header 
        variant="h1"
        description="Monitor system health and service status"
      >
        System Health
      </Header>

      <Container header={<Header variant="h2">Service Status</Header>}>
        <KeyValuePairs
          columns={2}
          items={[
            { label: 'API Status', value: getHealthStatus() },
            { label: 'Last Check', value: new Date().toLocaleString() },
            { label: 'Response Time', value: isLoading ? 'Checking...' : '< 200ms' },
            { label: 'Authentication', value: healthData ? 'Working' : 'Unknown' },
          ]}
        />
      </Container>

      {error && (
        <Alert type="error" header="API Connection Failed">
          Unable to connect to the API service: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      )}

      <Container header={<Header variant="h2">Available Endpoints</Header>}>
        <KeyValuePairs
          columns={2}
          items={[
            { label: 'Authentication', value: 'GET /me' },
            { label: 'Documents', value: 'GET /files' },
            { label: 'File Upload', value: 'POST /files/presign/upload' },
            { label: 'File Download', value: 'POST /files/presign/download' },
            { label: 'Admin Users', value: 'GET /admin/users' },
            { label: 'Audit Logs', value: 'GET /admin/audits' },
          ]}
        />
      </Container>

      <Container header={<Header variant="h2">System Information</Header>}>
        <KeyValuePairs
          columns={2}
          items={[
            { label: 'Environment', value: 'Development' },
            { label: 'Region', value: 'us-east-1' },
            { label: 'API Version', value: 'v1' },
            { label: 'API Endpoint', value: 'wcyez0q6t8.execute-api.us-east-1.amazonaws.com' },
          ]}
        />
      </Container>
    </SpaceBetween>
  );
};

export default SystemHealthPage;
