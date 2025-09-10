import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Header,
  Table,
  Box,
  Badge,
  StatusIndicator,
  SpaceBetween
} from '@cloudscape-design/components';
import { apiClient } from '../services/api';

const AuditPage: React.FC = () => {
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => apiClient.getAuditLogs(),
  });

  const getActionBadge = (action: string) => {
    if (action.includes('create')) return <Badge color="green">{action}</Badge>;
    if (action.includes('update')) return <Badge color="blue">{action}</Badge>;
    if (action.includes('delete')) return <Badge color="red">{action}</Badge>;
    if (action.includes('read') || action.includes('list')) return <Badge color="grey">{action}</Badge>;
    return <Badge>{action}</Badge>;
  };

  const getResultIndicator = (result: string) => {
    switch (result) {
      case 'success':
        return <StatusIndicator type="success">Success</StatusIndicator>;
      case 'error':
        return <StatusIndicator type="error">Error</StatusIndicator>;
      case 'denied':
        return <StatusIndicator type="error">Access Denied</StatusIndicator>;
      default:
        return <StatusIndicator type="pending">{result}</StatusIndicator>;
    }
  };

  return (
    <SpaceBetween size="l">
      <Header 
        variant="h1" 
        description="System audit logs and activity monitoring"
      >
        Audit Logs
      </Header>

      <Container>
        <Table
          columnDefinitions={[
            {
              id: 'timestamp',
              header: 'Timestamp',
              cell: (item: any) => new Date(item.timestamp).toLocaleString(),
              sortingField: 'timestamp',
            },
            {
              id: 'actor',
              header: 'User',
              cell: (item: any) => item.actor?.email || item.actor?.userId || 'Unknown',
            },
            {
              id: 'action',
              header: 'Action',
              cell: (item: any) => getActionBadge(item.action),
            },
            {
              id: 'resource',
              header: 'Resource',
              cell: (item: any) => item.resource || 'N/A',
            },
            {
              id: 'result',
              header: 'Result',
              cell: (item: any) => getResultIndicator(item.result || 'success'),
            },
            {
              id: 'details',
              header: 'Details',
              cell: (item: any) => item.details || item.message || 'N/A',
            },
          ]}
          items={auditData?.logs || []}
          loading={isLoading}
          trackBy="timestamp"
          sortingDescending
          empty={
            <Box textAlign="center" color="inherit">
              <b>No audit logs</b>
              <Box variant="p" color="inherit">
                No audit logs to display.
              </Box>
            </Box>
          }
        />
      </Container>
    </SpaceBetween>
  );
};

export default AuditPage;
