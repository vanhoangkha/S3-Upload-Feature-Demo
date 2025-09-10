import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Header,
  Grid,
  KeyValuePairs,
  SpaceBetween,
  StatusIndicator,
  Table,
  Badge,
  Box,
  Button
} from '@cloudscape-design/components';
import { authService } from '../services/auth';
import { apiClient } from '../services/api';

const VendorDashboardPage: React.FC = () => {
  const user = authService.getUser();

  // Use real endpoints - vendor filtering happens on backend
  const { data: vendorUsers } = useQuery({
    queryKey: ['vendor-users'],
    queryFn: () => apiClient.listUsers(), // Backend filters by vendor
    enabled: user?.groups.includes('Vendor'),
  });

  const { data: vendorDocuments } = useQuery({
    queryKey: ['vendor-documents'],
    queryFn: () => apiClient.listDocuments(), // Backend filters by vendor
    enabled: user?.groups.includes('Vendor'),
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate stats from actual data
  const totalDocuments = vendorDocuments?.items.length || 0;
  const totalUsers = vendorUsers?.users.length || 0;
  const totalStorage = vendorDocuments?.items.reduce((sum, doc) => sum + doc.size, 0) || 0;
  const recentDocuments = vendorDocuments?.items.filter(doc => {
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    return new Date(doc.created_at) > dayAgo;
  }).length || 0;

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description={`Vendor dashboard for ${user?.vendorId}`}
      >
        Vendor Dashboard
      </Header>

      <Grid
        gridDefinition={[
          { colspan: { default: 12, xs: 12, s: 6, m: 4 } },
          { colspan: { default: 12, xs: 12, s: 6, m: 4 } },
          { colspan: { default: 12, xs: 12, s: 12, m: 4 } },
        ]}
      >
        <Container header={<Header variant="h2">Statistics</Header>}>
          <KeyValuePairs
            columns={1}
            items={[
              { label: 'Total Documents', value: totalDocuments },
              { label: 'Total Users', value: totalUsers },
              { label: 'Storage Used', value: formatFileSize(totalStorage) },
              { label: 'Recent Activity', value: `${recentDocuments} documents today` },
            ]}
          />
        </Container>

        <Container header={<Header variant="h2">Status</Header>}>
          <KeyValuePairs
            columns={1}
            items={[
              { label: 'Vendor ID', value: user?.vendorId || 'N/A' },
              { label: 'Access Level', value: 'Vendor' },
              { 
                label: 'Status', 
                value: <StatusIndicator type="success">Active</StatusIndicator> 
              },
              { label: 'Document Access', value: user?.documentAccess || 'Vendor Scope' },
            ]}
          />
        </Container>

        <Container header={<Header variant="h2">Quick Actions</Header>}>
          <SpaceBetween size="s">
            <Box>
              <Button onClick={() => window.location.href = '/documents'}>
                Manage Documents
              </Button>
            </Box>
            <Box>
              <Button onClick={() => window.location.href = '/users'}>
                Manage Users
              </Button>
            </Box>
          </SpaceBetween>
        </Container>
      </Grid>

      <Container header={<Header variant="h2">Recent Documents</Header>}>
        <Table
          columnDefinitions={[
            {
              id: 'name',
              header: 'Name',
              cell: (item: any) => item.name,
            },
            {
              id: 'size',
              header: 'Size',
              cell: (item: any) => formatFileSize(item.size),
            },
            {
              id: 'owner',
              header: 'Owner',
              cell: (item: any) => item.owner_user_id,
            },
            {
              id: 'created',
              header: 'Created',
              cell: (item: any) => new Date(item.created_at).toLocaleDateString(),
            },
          ]}
          items={vendorDocuments?.items.slice(0, 5) || []}
          trackBy="document_id"
          empty={
            <Box textAlign="center" color="inherit">
              <b>No recent documents</b>
              <Box variant="p" color="inherit">
                No recent documents to display.
              </Box>
            </Box>
          }
        />
      </Container>

      <Container header={<Header variant="h2">Team Members</Header>}>
        <Table
          columnDefinitions={[
            {
              id: 'username',
              header: 'Username',
              cell: (item: any) => item.username,
            },
            {
              id: 'email',
              header: 'Email',
              cell: (item: any) => item.email,
            },
            {
              id: 'groups',
              header: 'Roles',
              cell: (item: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  {item.groups.map((group: string) => (
                    <Badge key={group} color={group === 'Vendor' ? 'blue' : 'grey'}>
                      {group}
                    </Badge>
                  ))}
                </SpaceBetween>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (item: any) => (
                <StatusIndicator type={item.status === 'CONFIRMED' ? 'success' : 'pending'}>
                  {item.status}
                </StatusIndicator>
              ),
            },
          ]}
          items={vendorUsers?.users || []}
          trackBy="username"
          empty={
            <Box textAlign="center" color="inherit">
              <b>No team members</b>
              <Box variant="p" color="inherit">
                No team members to display.
              </Box>
            </Box>
          }
        />
      </Container>
    </SpaceBetween>
  );
};

export default VendorDashboardPage;
