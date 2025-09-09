import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ContentLayout,
  Header,
  SpaceBetween,
  Container,
  Table,
  Button,
  Alert,
  Box,
  StatusIndicator,
  Badge
} from '@cloudscape-design/components';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, Document } from '../lib/api';

export const DocumentVersionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (token && id) {
      apiClient.setToken(token);
      loadDocumentAndVersions();
    }
  }, [token, id]);

  const loadDocumentAndVersions = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const doc = await apiClient.getDocument(id);
      setDocument(doc);
      
      // For now, create mock versions since we don't have version API yet
      setVersions([
        {
          version: 1,
          created_at: doc.created_at,
          size: doc.size,
          checksum: 'abc123',
          created_by: doc.owner_user_id,
          is_current: true
        }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVersion = async (version: any) => {
    if (!document) return;
    
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

  if (!id) {
    return (
      <ContentLayout>
        <Alert type="error">Document ID is required</Alert>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description={document ? `Versions for ${document.name}` : 'Loading...'}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => navigate('/drive')}>
                Back to Documents
              </Button>
              {document && (
                <Button
                  variant="primary"
                  onClick={() => handleDownloadVersion(versions[0])}
                  disabled={!document || !!document.deleted_at}
                >
                  Download Current
                </Button>
              )}
            </SpaceBetween>
          }
        >
          Document Versions
        </Header>
      }
    >
      <SpaceBetween size="l">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Document Info */}
        {document && (
          <Container header={<Header variant="h2">Document Information</Header>}>
            <SpaceBetween direction="vertical" size="s">
              <Box>
                <Box variant="awsui-key-label">Name</Box>
                <Box>{document.name}</Box>
              </Box>
              <Box>
                <Box variant="awsui-key-label">Type</Box>
                <Box>{document.mime}</Box>
              </Box>
              <Box>
                <Box variant="awsui-key-label">Size</Box>
                <Box>{formatFileSize(document.size)}</Box>
              </Box>
              <Box>
                <Box variant="awsui-key-label">Created</Box>
                <Box>{new Date(document.created_at).toLocaleString()}</Box>
              </Box>
              <Box>
                <Box variant="awsui-key-label">Status</Box>
                <Box>
                  {document.deleted_at ? (
                    <StatusIndicator type="error">Deleted</StatusIndicator>
                  ) : (
                    <StatusIndicator type="success">Active</StatusIndicator>
                  )}
                </Box>
              </Box>
              <Box>
                <Box variant="awsui-key-label">Tags</Box>
                <SpaceBetween direction="horizontal" size="xs">
                  {document.tags?.map(tag => (
                    <Badge key={tag} color="blue">{tag}</Badge>
                  ))}
                </SpaceBetween>
              </Box>
            </SpaceBetween>
          </Container>
        )}

        {/* Version History */}
        <Container header={<Header variant="h2">Version History</Header>}>
          <Table
            columnDefinitions={[
              {
                id: 'version',
                header: 'Version',
                cell: (item: any) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Box>v{item.version}</Box>
                    {item.is_current && <Badge color="green">Current</Badge>}
                  </SpaceBetween>
                )
              },
              {
                id: 'created',
                header: 'Created',
                cell: (item: any) => new Date(item.created_at).toLocaleString()
              },
              {
                id: 'size',
                header: 'Size',
                cell: (item: any) => formatFileSize(item.size)
              },
              {
                id: 'checksum',
                header: 'Checksum',
                cell: (item: any) => (
                  <Box fontSize="body-s" fontFamily="monospace">
                    {item.checksum}
                  </Box>
                )
              },
              {
                id: 'created_by',
                header: 'Created By',
                cell: (item: any) => item.created_by
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (item: any) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      size="small"
                      onClick={() => handleDownloadVersion(item)}
                      disabled={document?.deleted_at}
                    >
                      Download
                    </Button>
                    {!item.is_current && (
                      <Button
                        size="small"
                        disabled={true}
                      >
                        Restore
                      </Button>
                    )}
                  </SpaceBetween>
                )
              }
            ]}
            items={versions}
            loading={loading}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No versions</b>
                <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                  No version history available for this document.
                </Box>
              </Box>
            }
          />
        </Container>

        {/* Version Actions */}
        <Container header={<Header variant="h2">Version Actions</Header>}>
          <Alert type="info">
            <strong>Note:</strong> Document versioning is not yet implemented in the backend API. 
            This page shows the current document as version 1. Future versions will be tracked here.
          </Alert>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
};
