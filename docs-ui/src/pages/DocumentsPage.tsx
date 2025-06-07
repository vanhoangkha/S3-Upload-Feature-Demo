import React, { useState, useEffect, useCallback } from 'react';
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
  Input,
  FormField,
} from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';
import { Document, FolderItem } from '../types';
import { DocumentService } from '../services/documentService';
import { formatFileSize, formatDate, getFileIcon, getBreadcrumbs } from '../utils/helpers';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Document[]>([]);
  const [filteringText, setFilteringText] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentFolderPath, setCurrentFolderPath] = useState('');
  const [folderStructure, setFolderStructure] = useState<{ folders: FolderItem[], files: FolderItem[] }>({ folders: [], files: [] });
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderCreationError, setFolderCreationError] = useState('');
  // const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string>();

  const pageSize = 10;
  const currentUserId = 'demo-user'; // In a real app, this would come from authentication

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Use the new S3-based folder listing API
      const folderResponse = await DocumentService.listFolders(currentUserId, currentFolderPath);

      // Convert S3FolderListResponse to our existing FolderItem format
      const folders: FolderItem[] = folderResponse.folders.map(folder => ({
        name: folder.name,
        path: folder.path || folder.name,
        type: 'folder' as const
      }));

      const files: FolderItem[] = folderResponse.files.map(file => ({
        name: file.name,
        path: file.s3Key || file.name,
        type: 'file' as const,
        // We'll need the document details for file operations, so let's also load documents
        document: undefined // Will be populated below if needed
      }));

      setFolderStructure({ folders, files });

      // Also load documents for the current folder to get full document metadata
      // This is needed for file operations like download, delete, etc.
      const response = await DocumentService.listDocuments({
        user_id: currentUserId,
        limit: 1000, // Get all documents to filter by folder
      });

      // Filter documents that belong to the current folder
      const currentFolderDocuments = response.documents.filter(doc => {
        // Extract folder path from S3 key (e.g., "protected/demo-user/A/B/file.txt" -> "A/B")
        const keyParts = doc.s3Key.split('/');
        if (keyParts.length <= 2) {
          // File is in root directory (e.g., "protected/demo-user/file.txt")
          return currentFolderPath === '';
        } else {
          // File is in a subfolder
          const docFolderPath = keyParts.slice(2, -1).join('/'); // Remove "protected", user_id, and filename
          return docFolderPath === currentFolderPath;
        }
      });

      setDocuments(currentFolderDocuments);

      // Attach document metadata to files for operations like download/delete
      const filesWithDocuments: FolderItem[] = files.map(file => {
        // Try to find a matching document by s3Key (most accurate) or by filename (fallback)
        const matchingDoc = currentFolderDocuments.find(doc => {
          // Match by exact S3 key (most accurate)
          if (doc.s3Key === file.path) return true;

          // Alternative match: compare just the filename
          const docFileName = doc.s3Key.split('/').pop();
          return docFileName === file.name;
        });

        console.log(`File: ${file.name}, Path: ${file.path}, Has doc: ${!!matchingDoc}`);

        return {
          ...file,
          document: matchingDoc
        };
      });

      setFolderStructure({ folders, files: filesWithDocuments });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [currentFolderPath]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

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

  const handleFolderNavigation = (folderPath: string) => {
    setCurrentFolderPath(folderPath);
    setCurrentPageIndex(1);
    setSelectedItems([]);
  };

  const handleBreadcrumbClick = (path: string) => {
    console.log(`Navigating to breadcrumb path: "${path}"`);
    setCurrentFolderPath(path);
    setCurrentPageIndex(1);
    setSelectedItems([]);
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(filteringText.toLowerCase()) ||
    doc.file.toLowerCase().includes(filteringText.toLowerCase())
  );

  // Combine folders and files for display
  const tableItems = [
    ...folderStructure.folders.map(folder => ({ ...folder, itemType: 'folder' as const })),
    ...folderStructure.files
      .filter(file => {
        // Show files that have document metadata or at least exist in S3
        if (file.document) {
          return file.document.title.toLowerCase().includes(filteringText.toLowerCase()) ||
            file.document.file.toLowerCase().includes(filteringText.toLowerCase());
        } else {
          // For files without document metadata, just filter by filename
          // Always include files without metadata if no filter is applied
          return filteringText === '' || file.name.toLowerCase().includes(filteringText.toLowerCase());
        }
      })
      .map(file => ({ ...file, itemType: 'file' as const }))
  ];

  const columnDefinitions = [
    {
      id: 'icon',
      header: '',
      cell: (item: any) => (
        <Box textAlign="center" fontSize="heading-l">
          {item.itemType === 'folder' ? '📁' : getFileIcon(item.document?.mimeType || '')}
        </Box>
      ),
      width: 60,
      minWidth: 60,
    },
    {
      id: 'name',
      header: 'Name',
      cell: (item: any) => {
        if (item.itemType === 'folder') {
          return (
            <Button
              variant="link"
              onClick={() => handleFolderNavigation(item.path)}
              iconName="folder"
            >
              {item.name}
            </Button>
          );
        } else {
          const displayName = item.document?.title || item.name;
          const linkTarget = item.document
            ? `/documents/${item.document.user_id}/${item.document.file}`
            : '#'; // For files without document metadata, don't navigate

          return (
            <Button
              variant={item.document ? "link" : "normal"}
              onClick={() => item.document && navigate(linkTarget)}
              disabled={!item.document}
            >
              {displayName}
            </Button>
          );
        }
      },
      sortingField: 'name',
    },
    {
      id: 'fileName',
      header: 'File Name',
      cell: (item: any) => item.itemType === 'folder' ? '-' : (item.document?.file || item.name),
      sortingField: 'file',
    },
    {
      id: 'fileSize',
      header: 'Size',
      cell: (item: any) => {
        if (item.itemType === 'folder') return '-';
        return item.document?.fileSize ? formatFileSize(item.document.fileSize) : 'Unknown';
      },
      sortingField: 'fileSize',
    },
    {
      id: 'createdAt',
      header: 'Upload Date',
      cell: (item: any) => {
        if (item.itemType === 'folder') return '-';
        return item.document?.createdAt ? formatDate(item.document.createdAt) : 'Unknown';
      },
      sortingField: 'createdAt',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: any) => {
        if (item.itemType === 'folder') return null;

        if (item.document) {
          // Files with metadata
          return (
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="normal"
                iconName="download"
                onClick={() => handleDownload(item.document)}
              >
                Download
              </Button>
              <Button
                variant="normal"
                iconName="edit"
                onClick={() => navigate(`/documents/${item.document.user_id}/${item.document.file}`)}
              >
                Edit
              </Button>
            </SpaceBetween>
          );
        } else {
          // Files without metadata (direct S3 files)
          return (
            <Button
              variant="normal"
              iconName="download"
              onClick={() => {
                // Direct S3 download - showing a temporary message since we can't download directly
                setError(`The file "${item.name}" can't be downloaded directly as it has no document record. Add document metadata first.`);
                setTimeout(() => setError(''), 5000);
              }}
            >
              Download (Unavailable)
            </Button>
          );
        }
      },
    },
  ];

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setFolderCreationError('Folder name is required');
      return;
    }

    // Validate folder name (no special characters except spaces, hyphens, underscores)
    const folderNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!folderNameRegex.test(newFolderName.trim())) {
      setFolderCreationError('Folder name can only contain letters, numbers, spaces, hyphens, and underscores');
      return;
    }

    try {
      setLoading(true);
      setFolderCreationError('');
      const folderPath = currentFolderPath
        ? `${currentFolderPath}/${newFolderName.trim()}`
        : newFolderName.trim();

      // Use the API to create the folder
      await DocumentService.createFolder(currentUserId, folderPath);

      setNewFolderName('');
      setShowCreateFolderModal(false);
      await loadDocuments();
    } catch (err) {
      setFolderCreationError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      header={
        <Header
          variant="h1"
          description={`Manage your uploaded documents${currentFolderPath ? ` in ${currentFolderPath}` : ' (Root Directory)'}`}
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
                variant="normal"
                iconName="folder"
                onClick={() => {
                  setShowCreateFolderModal(true);
                  setFolderCreationError('');
                  setNewFolderName('');
                }}
              >
                Create Folder
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

      {/* Breadcrumb Navigation */}
      <Box margin={{ bottom: 'm' }}>
        <SpaceBetween direction="horizontal" size="xs">
          {getBreadcrumbs(currentFolderPath).map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.path || 'root'}>
              {index > 0 && <span style={{ color: '#687078' }}>/</span>}
              <Button
                variant="link"
                onClick={() => {
                  console.log(`Breadcrumb clicked: "${breadcrumb.name}" -> path: "${breadcrumb.path}"`);
                  handleBreadcrumbClick(breadcrumb.path);
                }}
                ariaLabel={`Navigate to ${breadcrumb.name}`}
              >
                {breadcrumb.name}
              </Button>
            </React.Fragment>
          ))}
        </SpaceBetween>
      </Box>

      <Table
        columnDefinitions={columnDefinitions}
        items={tableItems}
        loading={loading}
        loadingText="Loading documents..."
        selectedItems={selectedItems.filter(item => folderStructure.files.some(file => file.document?.user_id === item.user_id && file.document?.file === item.file))}
        onSelectionChange={({ detail }) => {
          // Only allow selection of files, not folders
          const fileItems = detail.selectedItems.filter((item: any) => item.itemType === 'file');
          setSelectedItems(fileItems.map((item: any) => item.document));
        }}
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

      <Modal
        visible={showCreateFolderModal}
        onDismiss={() => {
          setShowCreateFolderModal(false);
          setFolderCreationError('');
          setNewFolderName('');
        }}
        header="Create New Folder"
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => {
                setShowCreateFolderModal(false);
                setFolderCreationError('');
                setNewFolderName('');
              }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateFolder}
                loading={loading}
              >
                Create Folder
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField
            label="Folder Name"
            description="Enter a name for the new folder"
            errorText={folderCreationError}
          >
            <Input
              value={newFolderName}
              onChange={({ detail }) => {
                setNewFolderName(detail.value);
                setFolderCreationError(''); // Clear error when user starts typing
              }}
              placeholder="e.g. Reports, Archives, 2025"
            />
          </FormField>
          <Box variant="span" color="inherit">
            <strong>Location:</strong> {currentFolderPath || 'Root'} / {newFolderName || '[Folder Name]'}
          </Box>
        </SpaceBetween>
      </Modal>
    </Container>
  );
};
