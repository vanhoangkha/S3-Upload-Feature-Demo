import React, { useState, useEffect } from 'react';
import {
  ContentLayout,
  Header,
  SpaceBetween,
  Container,
  ColumnLayout,
  Box,
  Button,
  Cards,
  Badge,
  Icon
} from '@cloudscape-design/components';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, Document } from '../lib/api';

export const SimpleReviewPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    deleted: 0,
    totalSize: 0
  });
  const { user, token } = useAuth();

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.listDocuments();
      const docs = response.documents;
      setDocuments(docs);

      const active = docs.filter(d => !d.deleted_at).length;
      const deleted = docs.filter(d => d.deleted_at).length;
      const totalSize = docs.reduce((sum, d) => sum + d.size, 0);

      setStats({
        total: docs.length,
        active,
        deleted,
        totalSize
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const recentDocuments = documents
    .filter(d => !d.deleted_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button href="/drive" iconName="upload">Upload</Button>
              <Button variant="primary" href="/drive">Browse Files</Button>
            </SpaceBetween>
          }
        >
          Dashboard
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Welcome */}
        <Container>
          <SpaceBetween size="s">
            <Box variant="h2">Welcome back, {user?.email?.split('@')[0]}!</Box>
            <Box color="text-body-secondary">Manage your documents and monitor system activity</Box>
          </SpaceBetween>
        </Container>

        {/* Stats */}
        <Container>
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">
                <Icon name="folder" /> Total
              </Box>
              <Box variant="awsui-value-large">{stats.total}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">
                <Icon name="status-positive" /> Active
              </Box>
              <Box variant="awsui-value-large" color="text-status-success">
                {stats.active}
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">
                <Icon name="status-negative" /> Deleted
              </Box>
              <Box variant="awsui-value-large" color="text-status-error">
                {stats.deleted}
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">
                <Icon name="download" /> Storage
              </Box>
              <Box variant="awsui-value-large">
                {formatFileSize(stats.totalSize)}
              </Box>
            </div>
          </ColumnLayout>
        </Container>

        {/* Recent Files */}
        <Container 
          header={
            <Header 
              variant="h2"
              actions={<Button href="/drive" iconName="external">View All</Button>}
            >
              Recent Files
            </Header>
          }
        >
          {recentDocuments.length > 0 ? (
            <Cards
              cardDefinition={{
                header: (item: Document) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Icon name="file" />
                    <Box fontWeight="bold">{item.name}</Box>
                  </SpaceBetween>
                ),
                sections: [
                  {
                    id: 'info',
                    content: (item: Document) => (
                      <SpaceBetween direction="horizontal" size="s">
                        <Badge color="blue">{formatFileSize(item.size)}</Badge>
                        <Badge>{new Date(item.created_at).toLocaleDateString()}</Badge>
                      </SpaceBetween>
                    )
                  }
                ]
              }}
              items={recentDocuments}
              loading={loading}
              empty={
                <Box textAlign="center" padding="l">
                  <Icon name="folder" size="big" />
                  <Box variant="h3" padding={{ top: 's' }}>No files yet</Box>
                  <Box color="text-body-secondary">Upload your first document</Box>
                  <Button href="/drive" variant="primary" iconName="upload">
                    Upload Now
                  </Button>
                </Box>
              }
            />
          ) : (
            <Box textAlign="center" padding="l">
              <Icon name="folder" size="big" />
              <Box variant="h3" padding={{ top: 's' }}>No files yet</Box>
              <Box color="text-body-secondary" padding={{ bottom: 's' }}>
                Upload your first document to get started
              </Box>
              <Button href="/drive" variant="primary" iconName="upload">
                Upload Now
              </Button>
            </Box>
          )}
        </Container>

        {/* Quick Actions */}
        <Container header={<Header variant="h2">Quick Actions</Header>}>
          <SpaceBetween direction="horizontal" size="s">
            <Button variant="primary" href="/drive" iconName="upload">
              Upload
            </Button>
            <Button href="/drive" iconName="folder">
              Browse
            </Button>
            <Button href="/profile" iconName="user-profile">
              Profile
            </Button>
            {user?.roles?.includes('Admin') && (
              <Button href="/admin" iconName="settings">
                Admin
              </Button>
            )}
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
};
