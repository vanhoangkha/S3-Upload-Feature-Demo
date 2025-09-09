import React, { useState, useEffect } from 'react';
import {
  ContentLayout,
  Header,
  SpaceBetween,
  Container,
  Table,
  Button,
  Alert,
  Box,
  Badge,
  StatusIndicator,
  Tabs,
  ColumnLayout
} from '@cloudscape-design/components';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, Document, User } from '../lib/api';

export const VendorPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('documents');
  const { user, token, hasAnyRole } = useAuth();

  useEffect(() => {
    if (token && hasAnyRole(['Admin', 'Vendor'])) {
      apiClient.setToken(token);
      loadData();
    }
  }, [token, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'documents') {
        const response = await apiClient.listDocuments();
        setDocuments(response.documents);
      } else if (activeTab === 'users') {
        const response = await apiClient.listUsers();
        // Filter users by vendor if not admin
        const filteredUsers = user?.roles?.includes('Admin') 
          ? response.users 
          : response.users?.filter(u => u.vendor_id === user?.vendorId);
        setUsers(filteredUsers || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const { url } = await apiClient.getDownloadUrl(document.document_id);
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!hasAnyRole(['Admin', 'Vendor'])) {
    return (
      <ContentLayout>
        <Alert type="error">
          Access denied. Vendor or Admin role required.
        </Alert>
      </ContentLayout>
    );
  }

  const vendorDocuments = documents.filter(doc => 
    user?.roles?.includes('Admin') || doc.owner_user_id === user?.userId
  );

  const stats = {
    totalDocuments: vendorDocuments.length,
    activeDocuments: vendorDocuments.filter(d => !d.deleted_at).length,
    totalUsers: users.length,
    totalSize: vendorDocuments.reduce((sum, d) => sum + d.size, 0)
  };

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Manage vendor documents and users"
        >
          Vendor Dashboard
        </Header>
      }
    >
      <SpaceBetween size="l">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Overview */}
        <Container header={<Header variant="h2">Overview</Header>}>
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Total Documents</Box>
              <Box variant="awsui-value-large">{stats.totalDocuments}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Active Documents</Box>
              <Box variant="awsui-value-large" color="text-status-success">
                {stats.activeDocuments}
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Total Users</Box>
              <Box variant="awsui-value-large">{stats.totalUsers}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Storage Used</Box>
              <Box variant="awsui-value-large">
                {formatFileSize(stats.totalSize)}
              </Box>
            </div>
          </ColumnLayout>
        </Container>

        {/* Tabs */}
        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'documents',
              label: 'Documents',
              content: (
                <Container>
                  <Table
                    columnDefinitions={[
                      {
                        id: 'name',
                        header: 'Name',
                        cell: (item: Document) => item.name
                      },
                      {
                        id: 'owner',
                        header: 'Owner',
                        cell: (item: Document) => item.owner_user_id
                      },
                      {
                        id: 'size',
                        header: 'Size',
                        cell: (item: Document) => formatFileSize(item.size)
                      },
                      {
                        id: 'type',
                        header: 'Type',
                        cell: (item: Document) => item.mime
                      },
                      {
                        id: 'created',
                        header: 'Created',
                        cell: (item: Document) => new Date(item.created_at).toLocaleDateString()
                      },
                      {
                        id: 'status',
                        header: 'Status',
                        cell: (item: Document) => (
                          item.deleted_at ? 
                            <StatusIndicator type="error">Deleted</StatusIndicator> :
                            <StatusIndicator type="success">Active</StatusIndicator>
                        )
                      },
                      {
                        id: 'actions',
                        header: 'Actions',
                        cell: (item: Document) => (
                          <Button
                            size="small"
                            onClick={() => handleDownload(item)}
                            disabled={!!item.deleted_at}
                          >
                            Download
                          </Button>
                        )
                      }
                    ]}
                    items={vendorDocuments}
                    loading={loading}
                    empty={
                      <Box textAlign="center" color="inherit">
                        <b>No documents</b>
                        <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                          No documents found for this vendor.
                        </Box>
                      </Box>
                    }
                  />
                </Container>
              )
            },
            {
              id: 'users',
              label: 'Users',
              content: (
                <Container>
                  <Table
                    columnDefinitions={[
                      {
                        id: 'username',
                        header: 'Username',
                        cell: (item: User) => item.username
                      },
                      {
                        id: 'email',
                        header: 'Email',
                        cell: (item: User) => item.email
                      },
                      {
                        id: 'vendor',
                        header: 'Vendor',
                        cell: (item: User) => item.vendor_id
                      },
                      {
                        id: 'roles',
                        header: 'Roles',
                        cell: (item: User) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            {item.groups?.map(role => (
                              <Badge key={role} color="blue">{role}</Badge>
                            ))}
                          </SpaceBetween>
                        )
                      },
                      {
                        id: 'status',
                        header: 'Status',
                        cell: (item: User) => (
                          <StatusIndicator type={item.status === 'CONFIRMED' ? 'success' : 'pending'}>
                            {item.status}
                          </StatusIndicator>
                        )
                      }
                    ]}
                    items={users}
                    loading={loading}
                    empty={
                      <Box textAlign="center" color="inherit">
                        <b>No users</b>
                        <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                          No users found for this vendor.
                        </Box>
                      </Box>
                    }
                  />
                </Container>
              )
            }
          ]}
        />
      </SpaceBetween>
    </ContentLayout>
  );
};
