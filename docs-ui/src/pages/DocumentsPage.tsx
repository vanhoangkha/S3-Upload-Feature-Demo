import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  Table,
  Button,
  SpaceBetween,
  Pagination,
  TextFilter,
  Box,
  Modal,
  Alert,
} from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';
import { Document } from '../types';
import { DocumentService } from '../services/documentService';
import { formatFileSize, formatDate, getFileIcon } from '../utils/helpers';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Document[]>([]);
  const [filteringText, setFilteringText] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string>('');
  // const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string>();

  const pageSize = 10;
  const currentUserId = 'demo-user'; // In a real app, this would come from authentication

  useEffect(() => {
    loadDocuments();
  }, [currentPageIndex]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await DocumentService.listDocuments({
        user_id: currentUserId,
        limit: pageSize,
      });

      setDocuments(response.documents);
      // setLastEvaluatedKey(response.lastEvaluatedKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      setLoading(true);

      for (const doc of selectedItems) {
        await DocumentService.deleteDocument(doc.user_id, doc.file);
      }

      setSelectedItems([]);
      setShowDeleteModal(false);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const downloadUrl = await DocumentService.getDownloadUrl(document.user_id, document.file);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(filteringText.toLowerCase()) ||
    doc.file.toLowerCase().includes(filteringText.toLowerCase())
  );

  const columnDefinitions = [
    {
      id: 'icon',
      header: '',
      cell: (item: Document) => (
        <Box textAlign="center" fontSize="heading-l">
          {getFileIcon(item.mimeType)}
        </Box>
      ),
      width: 60,
      minWidth: 60,
    },
    {
      id: 'title',
      header: 'Title',
      cell: (item: Document) => (
        <Button
          variant="link"
          onClick={() => navigate(`/documents/${item.user_id}/${item.file}`)}
        >
          {item.title}
        </Button>
      ),
      sortingField: 'title',
    },
    {
      id: 'fileName',
      header: 'File Name',
      cell: (item: Document) => item.file,
      sortingField: 'file',
    },
    {
      id: 'fileSize',
      header: 'Size',
      cell: (item: Document) => formatFileSize(item.fileSize),
      sortingField: 'fileSize',
    },
    {
      id: 'createdAt',
      header: 'Upload Date',
      cell: (item: Document) => formatDate(item.createdAt),
      sortingField: 'createdAt',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: Document) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            variant="normal"
            iconName="download"
            onClick={() => handleDownload(item)}
          >
            Download
          </Button>
          <Button
            variant="normal"
            iconName="edit"
            onClick={() => navigate(`/documents/${item.user_id}/${item.file}`)}
          >
            Edit
          </Button>
        </SpaceBetween>
      ),
    },
  ];

  return (
    <Container
      header={
        <Header
          variant="h1"
          description="Manage your uploaded documents"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="normal"
                iconName="refresh"
                onClick={loadDocuments}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                iconName="add-plus"
                onClick={() => navigate('/upload')}
              >
                Upload Document
              </Button>
            </SpaceBetween>
          }
        >
          Documents
        </Header>
      }
    >
      {error && (
        <Alert
          type="error"
          dismissible
          onDismiss={() => setError('')}
          header="Error"
        >
          {error}
        </Alert>
      )}

      <Table
        columnDefinitions={columnDefinitions}
        items={filteredDocuments}
        loading={loading}
        loadingText="Loading documents..."
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
        selectionType="multi"
        ariaLabels={{
          selectionGroupLabel: 'Items selection',
          allItemsSelectionLabel: ({ selectedItems }) =>
            `${selectedItems.length} ${selectedItems.length === 1 ? 'item' : 'items'
            } selected`,
          itemSelectionLabel: ({ selectedItems }, item) => {
            const isItemSelected = selectedItems.filter(
              (i) => i.file === item.file
            ).length;
            return `${item.title} is ${isItemSelected ? '' : 'not '
              }selected`;
          },
        }}
        header={
          <Header
            counter={`(${filteredDocuments.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  disabled={selectedItems.length === 0}
                  onClick={() => setShowDeleteModal(true)}
                  variant="normal"
                  iconName="remove"
                >
                  Delete Selected
                </Button>
              </SpaceBetween>
            }
          >
            Documents
          </Header>
        }
        filter={
          <TextFilter
            filteringPlaceholder="Search documents..."
            filteringText={filteringText}
            onChange={({ detail }) => setFilteringText(detail.filteringText)}
          />
        }
        pagination={
          <Pagination
            currentPageIndex={currentPageIndex}
            onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
            pagesCount={Math.ceil(filteredDocuments.length / pageSize)}
          />
        }
        empty={
          <Box textAlign="center" color="inherit">
            <Box variant="strong" textAlign="center" color="inherit">
              No documents
            </Box>
            <Box variant="p" padding={{ bottom: 's' }} color="inherit">
              You haven't uploaded any documents yet.
            </Box>
            <Button
              variant="primary"
              iconName="add-plus"
              onClick={() => navigate('/upload')}
            >
              Upload your first document
            </Button>
          </Box>
        }
      />

      <Modal
        visible={showDeleteModal}
        onDismiss={() => setShowDeleteModal(false)}
        header="Delete Documents"
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteSelected}
                loading={loading}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box variant="span">
            Are you sure you want to delete {selectedItems.length} document(s)?
            This action cannot be undone.
          </Box>
          {selectedItems.map((item) => (
            <Box key={item.file} variant="span">
              • {item.title}
            </Box>
          ))}
        </SpaceBetween>
      </Modal>
    </Container>
  );
};
