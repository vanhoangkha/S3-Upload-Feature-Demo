import React, { useState, useEffect } from 'react';
import {
  ContentLayout,
  Header,
  SpaceBetween,
  Container,
  ColumnLayout,
  Box,
  Badge,
  StatusIndicator,
  Button,
  Alert,
  Table
} from '@cloudscape-design/components';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, Document } from '../lib/api';

export const UserProfilePage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token, signOut } = useAuth();

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
      loadUserDocuments();
    }
  }, [token]);

  const loadUserDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.listDocuments();
      setDocuments(response.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const userDocuments = documents.filter(doc => doc.owner_user_id === user?.userId);
  const activeDocuments = userDocuments.filter(doc => !doc.deleted_at);
  const totalSize = userDocuments.reduce((sum, doc) => sum + doc.size, 0);

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="View and manage your profile information"
          actions={
            <Button onClick={handleSignOut}>
              Sign Out
            </Button>
          }
        >
          User Profile
        </Header>
      }
    >
      <SpaceBetween size="l">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* User Information */}
        <Container header={<Header variant="h2">Profile Information</Header>}>
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">User ID</Box>
              <Box variant="awsui-value-large">{user?.userId}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Email</Box>
              <Box variant="awsui-value-large">{user?.email}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Username</Box>
              <Box variant="awsui-value-large">{user?.username}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Vendor ID</Box>
              <Box variant="awsui-value-large">{user?.vendorId || 'default'}</Box>
            </div>
          </ColumnLayout>
        </Container>

        {/* User Roles */}
        <Container header={<Header variant="h2">Roles & Permissions</Header>}>
          <SpaceBetween direction="horizontal" size="xs">
            {user?.roles && user.roles.length > 0 ? (
              user.roles.map(role => (
                <Badge key={role} color="blue">{role}</Badge>
              ))
            ) : (
              <Badge color="grey">User</Badge>
            )}
          </SpaceBetween>
        </Container>

        {/* Document Statistics */}
        <Container header={<Header variant="h2">Document Statistics</Header>}>
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Total Documents</Box>
              <Box variant="awsui-value-large">{userDocuments.length}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Active Documents</Box>
              <Box variant="awsui-value-large" color="text-status-success">
                {activeDocuments.length}
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Deleted Documents</Box>
              <Box variant="awsui-value-large" color="text-status-error">
                {userDocuments.length - activeDocuments.length}
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Total Storage</Box>
              <Box variant="awsui-value-large">
                {formatFileSize(totalSize)}
              </Box>
            </div>
          </ColumnLayout>
        </Container>

        {/* Recent Activity */}
        <Container 
          header={
            <Header 
              variant="h2"
              actions={
                <Button href="/drive">View All Documents</Button>
              }
            >
              Recent Documents
            </Header>
          }
        >
          <Table
            columnDefinitions={[
              {
                id: 'name',
                header: 'Name',
                cell: (item: Document) => item.name
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
              }
            ]}
            items={userDocuments.slice(0, 5)}
            loading={loading}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No documents</b>
                <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                  Upload your first document to get started.
                </Box>
              </Box>
            }
          />
        </Container>

        {/* Account Actions */}
        <Container header={<Header variant="h2">Account Actions</Header>}>
          <SpaceBetween direction="horizontal" size="xs">
            <Button href="/drive">
              Manage Documents
            </Button>
            <Button onClick={handleSignOut}>
              Sign Out
            </Button>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
};
