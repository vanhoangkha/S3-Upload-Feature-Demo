import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Container, 
  Header, 
  Grid, 
  KeyValuePairs,
  StatusIndicator,
  SpaceBetween,
  Cards
} from '@cloudscape-design/components';
import { authService } from '../services/auth';
import { apiClient } from '../services/api';

const DashboardPage: React.FC = () => {
  const user = authService.getUser();
  
  // Use real API endpoints - backend handles role-based filtering
  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: () => apiClient.listDocuments(),
    enabled: !!user,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.listUsers(),
    enabled: user?.groups.includes('Admin') || user?.groups.includes('Vendor'),
  });

  const getQuickActions = () => {
    const actions = [
      {
        name: 'Upload Document',
        description: 'Add new files to your document library',
        href: '/documents',
        type: 'primary'
      },
      {
        name: 'View Documents',
        description: 'Browse and manage your documents',
        href: '/documents',
        type: 'normal'
      }
    ];

    if (user?.groups.includes('Admin') || user?.groups.includes('Vendor')) {
      actions.push({
        name: 'Manage Users',
        description: 'Add and manage team members',
        href: '/users',
        type: 'normal'
      });
    }

    if (user?.groups.includes('Vendor')) {
      actions.push({
        name: 'Vendor Dashboard',
        description: 'View vendor statistics and team overview',
        href: '/vendor',
        type: 'normal'
      });
    }

    if (user?.groups.includes('Admin')) {
      actions.push({
        name: 'View Audit Logs',
        description: 'Monitor system activity and security',
        href: '/audit',
        type: 'normal'
      });
    }

    return actions;
  };

  const getDocumentCount = () => {
    return documents?.items.length || 0;
  };

  const getUserCount = () => {
    if (user?.groups.includes('Admin') || user?.groups.includes('Vendor')) {
      return users?.users.length || 0;
    }
    return 1; // Just the current user
  };

  // Calculate storage from documents
  const getTotalStorage = () => {
    if (!documents?.items) return 0;
    return documents.items.reduce((total, doc) => total + doc.size, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <SpaceBetween size="l">
      <Header 
        variant="h1"
        description={`Welcome back, ${user?.username}`}
      >
        Dashboard
      </Header>

      <Grid
        gridDefinition={[
          { colspan: { default: 12, xs: 12, s: 6, m: 4 } },
          { colspan: { default: 12, xs: 12, s: 6, m: 4 } },
          { colspan: { default: 12, xs: 12, s: 12, m: 4 } },
        ]}
      >
        <Container header={<Header variant="h2">Documents</Header>}>
          <KeyValuePairs
            columns={1}
            items={[
              { label: 'Total Documents', value: getDocumentCount() },
              { label: 'Storage Used', value: formatFileSize(getTotalStorage()) },
              { label: 'Recent Activity', value: documents?.items.filter(doc => {
                const dayAgo = new Date();
                dayAgo.setDate(dayAgo.getDate() - 1);
                return new Date(doc.created_at) > dayAgo;
              }).length || 0 },
            ]}
          />
        </Container>

        <Container header={<Header variant="h2">Team</Header>}>
          <KeyValuePairs
            columns={1}
            items={[
              { label: 'Team Members', value: getUserCount() },
              { label: 'Your Role', value: user?.groups.join(', ') || 'User' },
              { label: 'Vendor ID', value: user?.vendorId || 'N/A' },
            ]}
          />
        </Container>

        <Container header={<Header variant="h2">Account</Header>}>
          <KeyValuePairs
            columns={1}
            items={[
              { label: 'Access Level', value: user?.scope || 'None' },
              { label: 'Document Access', value: user?.documentAccess || 'Standard' },
              { 
                label: 'Status', 
                value: <StatusIndicator type="success">Active</StatusIndicator> 
              },
            ]}
          />
        </Container>
      </Grid>

      <Container header={<Header variant="h2">Quick Actions</Header>}>
        <Cards
          cardDefinition={{
            header: (item) => item.name,
            sections: [
              {
                id: 'description',
                content: (item) => item.description,
              },
            ],
          }}
          cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }, { minWidth: 800, cards: 3 }]}
          items={getQuickActions()}
          onCardClick={({ detail }) => {
            window.location.href = detail.href;
          }}
        />
      </Container>
    </SpaceBetween>
  );
};

export default DashboardPage;
