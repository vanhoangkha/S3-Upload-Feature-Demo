import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Header,
  Table,
  Button,
  SpaceBetween,
  Box,
  Badge,
  ButtonDropdown,
  BreadcrumbGroup
} from '@cloudscape-design/components';
import { apiClient, DocumentVersion } from '../services/api';

const DocumentVersionsPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const { data: document } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => apiClient.getDocument(documentId!),
    enabled: !!documentId,
  });

  const { data: versionsData, isLoading } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: () => apiClient.getDocumentVersions(documentId!),
    enabled: !!documentId,
  });

  const downloadVersion = async (version: DocumentVersion) => {
    try {
      const { url } = await apiClient.getDownloadUrl(version.document_id);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <SpaceBetween size="l">
      <BreadcrumbGroup
        items={[
          { text: 'Documents', href: '/documents' },
          { text: document?.name || 'Document', href: '#' },
          { text: 'Versions', href: '#' },
        ]}
        onClick={({ detail }) => {
          if (detail.href === '/documents') {
            navigate('/documents');
          }
        }}
      />

      <Header
        variant="h1"
        description={`Version history for ${document?.name || 'document'}`}
        actions={
          <Button onClick={() => navigate('/documents')}>
            Back to Documents
          </Button>
        }
      >
        Document Versions
      </Header>

      <Container>
        <Table
          columnDefinitions={[
            {
              id: 'version_id',
              header: 'Version ID',
              cell: (item: DocumentVersion) => (
                <Badge color="blue">{item.version_id.substring(0, 8)}...</Badge>
              ),
            },
            {
              id: 'size',
              header: 'Size',
              cell: (item: DocumentVersion) => formatFileSize(item.size),
            },
            {
              id: 'created',
              header: 'Created',
              cell: (item: DocumentVersion) => new Date(item.created_at).toLocaleString(),
              sortingField: 'created_at',
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (item: DocumentVersion) => (
                <ButtonDropdown
                  items={[
                    { id: 'download', text: 'Download' },
                  ]}
                  onItemClick={({ detail }) => {
                    if (detail.id === 'download') {
                      downloadVersion(item);
                    }
                  }}
                >
                  Actions
                </ButtonDropdown>
              ),
            },
          ]}
          items={versionsData?.versions || []}
          loading={isLoading}
          trackBy="version_id"
          sortingDescending
          empty={
            <Box textAlign="center" color="inherit">
              <b>No versions</b>
              <Box variant="p" color="inherit">
                No document versions to display.
              </Box>
            </Box>
          }
        />
      </Container>
    </SpaceBetween>
  );
};

export default DocumentVersionsPage;
