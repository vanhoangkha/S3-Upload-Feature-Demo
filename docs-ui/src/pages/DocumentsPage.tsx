import React, { useState, useCallback, useMemo } from 'react';
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
  Spinner,
} from '@cloudscape-design/components';
import { useNavigate, useLocation } from 'react-router-dom';
import { Document } from '../types';
import {
  useFolderContents,
  useDeleteDocuments,
  useCreateFolder,
  useDownloadDocument,
  usePrefetchFolder,
  useDocument
} from '../hooks/useDocuments';
import { formatFileSize, formatDate, getFileIcon, getBreadcrumbs, isFilePath, getFileNameFromPath, getFolderPathFromFilePath, truncateFileName } from '../utils/helpers';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // UI State
  const [selectedItems, setSelectedItems] = useState<Document[]>([]);
  const [filteringText, setFilteringText] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderCreationError, setFolderCreationError] = useState('');
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);

  const pageSize = 10;

  // Extract folder path from URL
  const currentFolderPath = useMemo(() => {
    const pathname = location.pathname;
    const documentsPath = '/documents';

    if (pathname === documentsPath) {
      return '';
    }

    if (pathname.startsWith(documentsPath + '/')) {
      const fullPath = decodeURIComponent(pathname.substring(documentsPath.length + 1));

      if (isFilePath(fullPath)) {
        return getFolderPathFromFilePath(fullPath);
      }

      return fullPath;
    }

    return '';
  }, [location.pathname]);

  // Check if URL points to a file
  const viewingFileName = useMemo(() => {
    const pathname = location.pathname;
    const documentsPath = '/documents';

    if (pathname.startsWith(documentsPath + '/')) {
      const fullPath = decodeURIComponent(pathname.substring(documentsPath.length + 1));

      if (isFilePath(fullPath)) {
        return getFileNameFromPath(fullPath);
      }
    }

    return null;
  }, [location.pathname]);

  // React Query hooks
  const {
    data: folderData,
    isLoading,
    error: folderError,
    refetch: refetchFolder
  } = useFolderContents(currentFolderPath);

  const deleteDocumentsMutation = useDeleteDocuments();
  const createFolderMutation = useCreateFolder();
  const downloadDocumentMutation = useDownloadDocument();
  const prefetchFolder = usePrefetchFolder();

  // Track loading states for better UX
  const isDeleting = deleteDocumentsMutation.isPending;
  const isCreatingFolder = createFolderMutation.isPending;

  // Find the viewing file document
  const viewingFileDocument = useMemo(() => {
    if (!viewingFileName || !folderData) return null;

    return folderData.files.find(file => {
      if (!file.document) return false;
      const docFileName = file.document.s3Key.split('/').pop();
      return docFileName === viewingFileName;
    })?.document || null;
  }, [viewingFileName, folderData]);

  // Use document query for file viewing to get fresh data
  const viewingFileS3Key = useMemo(() => {
    if (!viewingFileDocument) return undefined;
    return viewingFileDocument.s3Key;
  }, [viewingFileDocument]);

  const {
    data: viewingFileDetails,
    error: fileError
  } = useDocument(viewingFileS3Key);

  // Use the detailed file data if available, otherwise fall back to folder data
  const viewingFile = viewingFileDetails || viewingFileDocument;

  // Handle errors
  const error = folderError || fileError;

  // Navigation handlers with prefetching
  const handleFileNavigation = useCallback((document: Document) => {
    const s3KeyParts = document.s3Key.split('/');
    const filePath = s3KeyParts.slice(2).join('/');
    const navigationPath = `/documents/${filePath}`;
    navigate(navigationPath);
  }, [navigate]);

  const handleFolderNavigation = useCallback((folderPath: string) => {
    // Prefetch the folder data for smoother navigation
    prefetchFolder(folderPath);

    setSelectedItems([]);
    setCurrentPageIndex(1);

    const navigationPath = folderPath ? `/documents/${folderPath}` : '/documents';
    navigate(navigationPath);
  }, [navigate, prefetchFolder]);

  const handleBreadcrumbClick = useCallback((path: string) => {
    // Prefetch the folder data
    prefetchFolder(path);

    setSelectedItems([]);
    setCurrentPageIndex(1);

    const navigationPath = path ? `/documents/${path}` : '/documents';
    navigate(navigationPath);
  }, [navigate, prefetchFolder]);

  // File operations
  const handleDeleteSelected = useCallback(async () => {
    try {
      await deleteDocumentsMutation.mutateAsync(selectedItems);
      setSelectedItems([]);
      setShowDeleteModal(false);
    } catch (err) {
      // Error handling is managed by React Query
      console.error('Failed to delete documents:', err);
    }
  }, [deleteDocumentsMutation, selectedItems]);

  const handleDownload = useCallback(async (document: Document) => {
    try {
      setDownloadingDocumentId(document.s3Key);
      await downloadDocumentMutation.mutateAsync(document.s3Key);
    } catch (err) {
      console.error('Failed to download document:', err);
    } finally {
      setDownloadingDocumentId(null);
    }
  }, [downloadDocumentMutation]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) {
      setFolderCreationError('Folder name is required');
      return;
    }

    const folderNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!folderNameRegex.test(newFolderName.trim())) {
      setFolderCreationError('Folder name can only contain letters, numbers, spaces, hyphens, and underscores');
      return;
    }

    try {
      setFolderCreationError('');
      await createFolderMutation.mutateAsync({
        folderName: newFolderName.trim(),
        parentFolderPath: currentFolderPath || undefined,
      });

      setNewFolderName('');
      setShowCreateFolderModal(false);
    } catch (err) {
      setFolderCreationError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  }, [createFolderMutation, newFolderName, currentFolderPath]);

  // Data processing
  const { tableItems, filteredDocuments } = useMemo(() => {
    if (!folderData) {
      return { tableItems: [], filteredDocuments: [] };
    }

    const filteredFiles = folderData.files.filter(file => {
      if (file.document) {
        return file.document.title.toLowerCase().includes(filteringText.toLowerCase()) ||
          file.document.file.toLowerCase().includes(filteringText.toLowerCase());
      } else {
        return filteringText === '' || file.name.toLowerCase().includes(filteringText.toLowerCase());
      }
    });

    const tableItems = [
      ...folderData.folders.map(folder => ({ ...folder, itemType: 'folder' as const })),
      ...filteredFiles.map(file => ({ ...file, itemType: 'file' as const }))
    ];

    const filteredDocuments = filteredFiles
      .map(file => file.document)
      .filter((doc): doc is Document => doc !== undefined);

    return { tableItems, filteredDocuments };
  }, [folderData, filteringText]);

  // Table configuration
  const columnDefinitions = useMemo(() => [
    {
      id: 'icon',
      header: '',
      cell: (item: any) => (
        <Box textAlign="center" fontSize="heading-l">
          {item.itemType === 'folder' ? '📁' : getFileIcon(item.document?.mimeType || '')}
        </Box>
      ),
      width: 50,
      minWidth: 50,
      maxWidth: 50,
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
              {truncateFileName(item.name, 50)}
            </Button>
          );
        } else {
          const displayName = item.document?.title || item.name;

          if (item.document) {
            return (
              <Button
                variant="link"
                onClick={() => handleFileNavigation(item.document)}
                ariaLabel={displayName}
              >
                {truncateFileName(displayName, 50)}
              </Button>
            );
          } else {
            return (
              <span title={displayName}>
                {truncateFileName(displayName, 50)}
              </span>
            );
          }
        }
      },
      sortingField: 'name',
      width: 400,
      minWidth: 250,
    },
    {
      id: 'fileSize',
      header: 'Size',
      cell: (item: any) => {
        if (item.itemType === 'folder') return '-';
        return item.document?.fileSize ? formatFileSize(item.document.fileSize) : 'Unknown';
      },
      sortingField: 'fileSize',
      width: 100,
      minWidth: 80,
    },
    {
      id: 'createdAt',
      header: 'Upload Date',
      cell: (item: any) => {
        if (item.itemType === 'folder') return '-';
        return item.document?.createdAt ? formatDate(item.document.createdAt) : 'Unknown';
      },
      sortingField: 'createdAt',
      width: 180,
      minWidth: 150,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: any) => {
        if (item.itemType === 'folder') return null;

        if (item.document) {
          const isDownloadingThis = downloadingDocumentId === item.document.s3Key;
          return (
            <Button
              variant="normal"
              iconName="download"
              onClick={() => handleDownload(item.document)}
              loading={isDownloadingThis}
            >
              {isDownloadingThis ? 'Downloading...' : 'Download'}
            </Button>
          );
        } else {
          return (
            <Button
              variant="normal"
              iconName="download"
              disabled
            >
              Download (Unavailable)
            </Button>
          );
        }
      },
      width: 180,
      minWidth: 120,
    },
  ], [handleFolderNavigation, handleFileNavigation, handleDownload, downloadingDocumentId]);

  // Error handling
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';

    // If file not found, navigate back to folder
    if (viewingFileName && errorMessage.includes('not found')) {
      const folderPath = currentFolderPath ? `/documents/${currentFolderPath}` : '/documents';
      navigate(folderPath, { replace: true });
      return null;
    }
  }

  // File detail view
  if (viewingFile) {
    return (
      <Container
        header={
          <Header
            variant="h1"
            description="File Details"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="normal"
                  iconName="arrow-left"
                  onClick={() => {
                    const folderPath = currentFolderPath ? `/documents/${currentFolderPath}` : '/documents';
                    navigate(folderPath);
                  }}
                >
                  Back to Folder
                </Button>
                <Button
                  variant="primary"
                  iconName="download"
                  onClick={() => handleDownload(viewingFile)}
                  loading={downloadingDocumentId === viewingFile.s3Key}
                >
                  {downloadingDocumentId === viewingFile.s3Key ? 'Downloading...' : 'Download'}
                </Button>
              </SpaceBetween>
            }
          >
            {viewingFile.title}
          </Header>
        }
      >
        {error && (
          <Alert
            type="error"
            dismissible
            onDismiss={() => { }} // Error will be cleared by navigation
            header="Error"
          >
            {error instanceof Error ? error.message : 'An error occurred'}
          </Alert>
        )}

        <SpaceBetween size="l">
          <Box>
            <SpaceBetween size="m">
              <div>
                <Box variant="awsui-key-label">File Name</Box>
                <Box>
                  <span title={viewingFile.file} style={{ wordBreak: 'break-all' }}>
                    {truncateFileName(viewingFile.file, 60)}
                  </span>
                </Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Title</Box>
                <Box>{viewingFile.title}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Description</Box>
                <Box>{viewingFile.description || 'No description provided'}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">File Size</Box>
                <Box>{formatFileSize(viewingFile.fileSize)}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">MIME Type</Box>
                <Box>{viewingFile.mimeType}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Upload Date</Box>
                <Box>{formatDate(viewingFile.createdAt)}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">S3 Key</Box>
                <Box>{viewingFile.s3Key}</Box>
              </div>
            </SpaceBetween>
          </Box>
        </SpaceBetween>
      </Container>
    );
  }

  // Folder list view
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
                onClick={() => refetchFolder()}
                loading={isLoading}
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
                loading={isCreatingFolder}
              >
                {isCreatingFolder ? 'Creating...' : 'Create Folder'}
              </Button>
              <Button
                variant="primary"
                iconName="add-plus"
                onClick={() => {
                  const uploadUrl = currentFolderPath
                    ? `/upload?folder=${encodeURIComponent(currentFolderPath)}`
                    : '/upload';
                  navigate(uploadUrl);
                }}
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
          onDismiss={() => { }} // React Query handles error state
          header="Error"
        >
          {error instanceof Error ? error.message : 'An error occurred'}
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

      {/* Loading overlay when operations are in progress */}
      {(isDeleting || isCreatingFolder) && (
        <Alert
          type="info"
          header={
            <SpaceBetween direction="horizontal" size="xs" alignItems="center">
              <Spinner size="normal" />
              <Box variant="span" fontWeight="bold">
                {isDeleting && 'Deleting documents...'}
                {isCreatingFolder && 'Creating folder...'}
              </Box>
            </SpaceBetween>
          }
        />
      )}

      <Table
        columnDefinitions={columnDefinitions}
        items={tableItems}
        loading={isLoading}
        loadingText="Loading documents..."
        selectedItems={tableItems.filter((tableItem: any) =>
          tableItem.itemType === 'file' &&
          tableItem.document &&
          selectedItems.some(selected =>
            selected.user_id === tableItem.document.user_id &&
            selected.file === tableItem.document.file
          )
        )}
        onSelectionChange={({ detail }) => {
          // Only allow selection of files with document metadata, not folders
          const fileItems = detail.selectedItems.filter((item: any) =>
            item.itemType === 'file' && item.document
          );
          setSelectedItems(fileItems.map((item: any) => item.document).filter(Boolean));
        }}
        selectionType="multi"
        // Make items non-selectable if they don't have document metadata
        isItemDisabled={(item: any) =>
          item.itemType === 'folder' || (item.itemType === 'file' && !item.document)
        }
        ariaLabels={{
          selectionGroupLabel: 'Items selection',
          allItemsSelectionLabel: ({ selectedItems }) =>
            `${selectedItems.length} ${selectedItems.length === 1 ? 'item' : 'items'
            } selected`,
          itemSelectionLabel: ({ selectedItems }, item: any) => {
            // Only show selection for files with document metadata
            if (item.itemType !== 'file' || !item.document) {
              return '';
            }
            const isItemSelected = selectedItems.some((selectedItem: any) =>
              selectedItem.itemType === 'file' &&
              selectedItem.document?.user_id === item.document.user_id &&
              selectedItem.document?.file === item.document.file
            );
            const displayName = item.document.title || item.name;
            return `${displayName} is ${isItemSelected ? '' : 'not '}selected`;
          },
        }}
        header={
          <Header
            counter={`(${filteredDocuments.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  disabled={selectedItems.length === 0 || isDeleting}
                  onClick={() => setShowDeleteModal(true)}
                  variant="normal"
                  iconName="remove"
                  loading={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Selected'}
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
              onClick={() => {
                const uploadUrl = currentFolderPath
                  ? `/upload?folder=${encodeURIComponent(currentFolderPath)}`
                  : '/upload';
                navigate(uploadUrl);
              }}
            >
              Upload your first document
            </Button>
          </Box>
        }
      />

      {/* Delete Modal */}
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
                loading={deleteDocumentsMutation.isPending}
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

      {/* Create Folder Modal */}
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
                loading={createFolderMutation.isPending}
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
