import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Header,
  Table,
  Button,
  SpaceBetween,
  Box,
  Modal,
  FormField,
  FileUpload,
  Alert,
  Badge,
  ButtonDropdown,
  StatusIndicator,
  CollectionPreferences,
  Pagination,
  TextFilter
} from '@cloudscape-design/components';
import { authService } from '../services/auth';
import { apiClient, Document } from '../services/api';

const DocumentsPage: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState<Document[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filteringText, setFilteringText] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [preferences, setPreferences] = useState({
    pageSize: 10,
    visibleContent: ['name', 'size', 'type', 'status', 'owner', 'created', 'tags', 'actions'],
    wrapLines: false
  });
  
  const queryClient = useQueryClient();
  const user = authService.getUser();

  // Use appropriate endpoint based on user role
  const getDocumentsQuery = () => {
    if (user?.groups.includes('Admin')) {
      return ['all-documents'];
    } else if (user?.groups.includes('Vendor')) {
      return ['vendor-documents'];
    }
    return ['user-documents'];
  };

  const getDocumentsFunction = () => {
    if (user?.groups.includes('Admin')) {
      return () => apiClient.listDocuments();
    } else if (user?.groups.includes('Vendor')) {
      return () => apiClient.getVendorDocuments();
    }
    return () => apiClient.getUserDocuments();
  };

  const { data: documentsData, isLoading, error } = useQuery({
    queryKey: getDocumentsQuery(),
    queryFn: getDocumentsFunction(),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Get presigned URL
      const { url, documentId } = await apiClient.getUploadUrl({
        filename: file.name,
        contentType: file.type,
      });

      // Upload to S3
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getDocumentsQuery() });
      setShowUploadModal(false);
      setUploadFile([]);
      setUploadError(null);
    },
    onError: (error) => {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => apiClient.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getDocumentsQuery() });
      setSelectedItems([]);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (documentId: string) => apiClient.restoreDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getDocumentsQuery() });
      setSelectedItems([]);
    },
  });

  const downloadDocument = async (document: Document) => {
    try {
      const { url } = await apiClient.getDownloadUrl(document.document_id);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleUpload = () => {
    if (uploadFile.length > 0) {
      uploadMutation.mutate(uploadFile[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIndicator = (document: Document) => {
    if (document.deleted_at) {
      return <StatusIndicator type="error">Deleted</StatusIndicator>;
    }
    return <StatusIndicator type="success">Active</StatusIndicator>;
  };

  // Filter documents based on search text
  const filteredDocuments = (documentsData?.items || []).filter(document =>
    document.name.toLowerCase().includes(filteringText.toLowerCase()) ||
    document.mime.toLowerCase().includes(filteringText.toLowerCase()) ||
    document.tags.some(tag => tag.toLowerCase().includes(filteringText.toLowerCase()))
  );

  // Paginate filtered documents
  const startIndex = (currentPageIndex - 1) * pageSize;
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + pageSize);

  const columnDefinitions = [
    {
      id: 'name',
      header: 'Name',
      cell: (item: Document) => item.name,
      sortingField: 'name',
    },
    {
      id: 'size',
      header: 'Size',
      cell: (item: Document) => formatFileSize(item.size),
    },
    {
      id: 'type',
      header: 'Type',
      cell: (item: Document) => <Badge color="blue">{item.mime}</Badge>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: getStatusIndicator,
    },
    {
      id: 'owner',
      header: 'Owner',
      cell: (item: Document) => item.owner_user_id,
    },
    {
      id: 'created',
      header: 'Created',
      cell: (item: Document) => new Date(item.created_at).toLocaleDateString(),
      sortingField: 'created_at',
    },
    {
      id: 'tags',
      header: 'Tags',
      cell: (item: Document) => (
        <SpaceBetween direction="horizontal" size="xs">
          {item.tags.slice(0, 3).map(tag => (
            <Badge key={tag}>{tag}</Badge>
          ))}
          {item.tags.length > 3 && <Badge>+{item.tags.length - 3}</Badge>}
        </SpaceBetween>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: Document) => (
        <ButtonDropdown
          items={[
            { id: 'download', text: 'Download' },
            { id: 'versions', text: 'View Versions' },
            { id: 'restore', text: 'Restore', disabled: !item.deleted_at },
            { id: 'delete', text: 'Delete' },
          ]}
          onItemClick={({ detail }) => {
            if (detail.id === 'download') {
              downloadDocument(item);
            } else if (detail.id === 'versions') {
              window.location.href = `/documents/${item.document_id}/versions`;
            } else if (detail.id === 'restore') {
              restoreMutation.mutate(item.document_id);
            } else if (detail.id === 'delete') {
              deleteMutation.mutate(item.document_id);
            }
          }}
        >
          Actions
        </ButtonDropdown>
      ),
    },
  ];

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              disabled={selectedItems.length === 0}
              onClick={() => selectedItems.forEach(doc => deleteMutation.mutate(doc.document_id))}
            >
              Delete Selected
            </Button>
            <Button variant="primary" onClick={() => setShowUploadModal(true)}>
              Upload Document
            </Button>
          </SpaceBetween>
        }
      >
        Documents
      </Header>

      {error && (
        <Alert type="error" header="Failed to load documents">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </Alert>
      )}

      <Container>
        <Table
          columnDefinitions={columnDefinitions.filter(col => 
            preferences.visibleContent.includes(col.id)
          )}
          items={paginatedDocuments}
          loading={isLoading}
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
          selectionType="multi"
          trackBy="document_id"
          header={
            <Header
              counter={`(${filteredDocuments.length})`}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    disabled={selectedItems.length === 0}
                    onClick={() => selectedItems.forEach(doc => deleteMutation.mutate(doc.document_id))}
                  >
                    Delete Selected
                  </Button>
                  <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                    Upload Document
                  </Button>
                </SpaceBetween>
              }
            >
              Documents
            </Header>
          }
          filter={
            <TextFilter
              filteringText={filteringText}
              onChange={({ detail }) => setFilteringText(detail.filteringText)}
              filteringPlaceholder="Search documents..."
            />
          }
          pagination={
            <Pagination
              currentPageIndex={currentPageIndex}
              pagesCount={Math.ceil(filteredDocuments.length / pageSize)}
              onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
            />
          }
          preferences={
            <CollectionPreferences
              title="Preferences"
              confirmLabel="Confirm"
              cancelLabel="Cancel"
              preferences={preferences}
              onConfirm={({ detail }) => setPreferences(detail)}
              pageSizePreference={{
                title: 'Page size',
                options: [
                  { value: 10, label: '10 documents' },
                  { value: 20, label: '20 documents' },
                  { value: 50, label: '50 documents' }
                ]
              }}
              visibleContentPreference={{
                title: 'Select visible columns',
                options: [
                  { id: 'name', label: 'Name' },
                  { id: 'size', label: 'Size' },
                  { id: 'type', label: 'Type' },
                  { id: 'status', label: 'Status' },
                  { id: 'owner', label: 'Owner' },
                  { id: 'created', label: 'Created' },
                  { id: 'tags', label: 'Tags' },
                  { id: 'actions', label: 'Actions' }
                ]
              }}
              wrapLinesPreference={{
                label: 'Wrap lines',
                description: 'Wrap long text content'
              }}
            />
          }
          empty={
            <Box textAlign="center" color="inherit">
              <b>No documents</b>
              <Box variant="p" color="inherit">
                No documents to display.
              </Box>
            </Box>
          }
        />
      </Container>

      <Modal
        visible={showUploadModal}
        onDismiss={() => setShowUploadModal(false)}
        header="Upload Document"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                loading={uploadMutation.isPending}
                disabled={uploadFile.length === 0}
              >
                Upload
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          {uploadError && (
            <Alert type="error" dismissible onDismiss={() => setUploadError(null)}>
              {uploadError}
            </Alert>
          )}
          <FormField label="Select file" description="Choose a file to upload to the document library">
            <FileUpload
              onChange={({ detail }) => setUploadFile(detail.value)}
              value={uploadFile}
              i18nStrings={{
                uploadButtonText: e => e ? 'Choose files' : 'Choose file',
                dropzoneText: e => e ? 'Drop files to upload' : 'Drop file to upload',
                removeFileAriaLabel: e => `Remove file ${e + 1}`,
                limitShowFewer: 'Show fewer files',
                limitShowMore: 'Show more files',
                errorIconAriaLabel: 'Error'
              }}
              showFileLastModified
              showFileSize
              showFileThumbnail
              constraintText="Maximum file size: 100MB"
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
};

export default DocumentsPage;
