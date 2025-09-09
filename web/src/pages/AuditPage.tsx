import React, { useState, useEffect } from 'react';
import {
  ContentLayout,
  Header,
  SpaceBetween,
  Container,
  Table,
  Alert,
  Box,
  Badge,
  StatusIndicator,
  Pagination
} from '@cloudscape-design/components';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';

interface AuditLog {
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
}

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { token, hasRole } = useAuth();

  const pageSize = 20;

  useEffect(() => {
    if (token && hasRole('Admin')) {
      apiClient.setToken(token);
      loadAuditLogs();
    }
  }, [token, currentPage]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAuditLogs({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      });
      setLogs(response.logs || []);
      setTotalPages(Math.ceil((response.logs?.length || 0) / pageSize));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('create')) return 'green';
    if (action.includes('update')) return 'blue';
    if (action.includes('delete')) return 'red';
    if (action.includes('login') || action.includes('auth')) return 'grey';
    return 'blue';
  };

  if (!hasRole('Admin')) {
    return (
      <ContentLayout>
        <Alert type="error">
          Access denied. Admin role required to view audit logs.
        </Alert>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="View system audit logs and user activities"
        >
          Audit Logs
        </Header>
      }
    >
      <SpaceBetween size="l">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            columnDefinitions={[
              {
                id: 'timestamp',
                header: 'Timestamp',
                cell: (item: AuditLog) => new Date(item.timestamp).toLocaleString(),
                sortingField: 'timestamp'
              },
              {
                id: 'actor',
                header: 'User',
                cell: (item: AuditLog) => item.actor
              },
              {
                id: 'action',
                header: 'Action',
                cell: (item: AuditLog) => (
                  <Badge color={getActionBadgeColor(item.action)}>
                    {item.action}
                  </Badge>
                )
              },
              {
                id: 'resource',
                header: 'Resource',
                cell: (item: AuditLog) => item.resource
              },
              {
                id: 'details',
                header: 'Details',
                cell: (item: AuditLog) => (
                  <Box fontSize="body-s">
                    {typeof item.details === 'string' 
                      ? item.details 
                      : JSON.stringify(item.details).substring(0, 100) + '...'
                    }
                  </Box>
                )
              },
              {
                id: 'ip',
                header: 'IP Address',
                cell: (item: AuditLog) => item.ip_address || '-'
              }
            ]}
            items={logs}
            loading={loading}
            sortingDisabled
            empty={
              <Box textAlign="center" color="inherit">
                <b>No audit logs</b>
                <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                  System activities will appear here.
                </Box>
              </Box>
            }
            pagination={
              <Pagination
                currentPageIndex={currentPage}
                pagesCount={totalPages}
                onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
              />
            }
          />
        </Container>

        {/* Summary Stats */}
        <Container header={<Header variant="h2">Activity Summary</Header>}>
          <SpaceBetween direction="horizontal" size="l">
            <Box>
              <Box variant="awsui-key-label">Total Events</Box>
              <Box variant="awsui-value-large">{logs.length}</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Unique Users</Box>
              <Box variant="awsui-value-large">
                {new Set(logs.map(log => log.actor)).size}
              </Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Actions Today</Box>
              <Box variant="awsui-value-large">
                {logs.filter(log => 
                  new Date(log.timestamp).toDateString() === new Date().toDateString()
                ).length}
              </Box>
            </Box>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
};
