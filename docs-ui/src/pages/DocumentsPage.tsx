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
import { useNavigate, useLocation } from 'react-router-dom';
import { Document, FolderItem } from '../types';
import { DocumentService } from '../services/documentService';
import { useAuth } from '../components/AuthProvider';
import { formatFileSize, formatDate, getFileIcon, getBreadcrumbs, isFilePath, getFileNameFromPath, getFolderPathFromFilePath, truncateFileName } from '../utils/helpers';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
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
  const [viewingFile, setViewingFile] = useState<Document | null>(null);
  // const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string>();

  const pageSize = 10;

  // Extract folder path from URL
  const getFolderPathFromUrl = useCallback(() => {
    const pathname = location.pathname;
    const documentsPath = '/documents';

    if (pathname === documentsPath) {
      return '';
    }

    if (pathname.startsWith(documentsPath + '/')) {
      // Remove the /documents/ prefix and decode any URI components
      const fullPath = decodeURIComponent(pathname.substring(documentsPath.length + 1));

      // Check if this is a file path
      if (isFilePath(fullPath)) {
        // Return the folder path (everything except the filename)
        return getFolderPathFromFilePath(fullPath);
      }

      // It's a folder path
      return fullPath;
    }

    return '';
  }, [location.pathname]);

  // Check if URL points to a file
  const getFileFromUrl = useCallback(() => {
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

  // Initialize folder path from URL and check for file viewing
  useEffect(() => {
    const urlFolderPath = getFolderPathFromUrl();
    const urlFileName = getFileFromUrl();

    if (urlFolderPath !== currentFolderPath) {
      // Clear data immediately when folder path changes to prevent showing stale data
      setFolderStructure({ folders: [], files: [] });
      setDocuments([]);
      setSelectedItems([]);
      setViewingFile(null);
      setCurrentFolderPath(urlFolderPath);
    }

    // If URL points to a file, we'll handle file viewing after documents are loaded
    if (urlFileName) {

    }
  }, [getFolderPathFromUrl, getFileFromUrl, currentFolderPath]);

  const loadDocuments = useCallback(async () => {
    if (!user?.idToken) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Clear previous data immediately to prevent showing stale data
      setFolderStructure({ folders: [], files: [] });
      setDocuments([]);



      // OPTIMIZED: Single DynamoDB-first call to get folders and files
      const folderContents = await DocumentService.listFolderContents(currentFolderPath, user.idToken);



      // Convert to our existing FolderItem format
      const folders: FolderItem[] = folderContents.folders.map(folder => ({
        name: folder.name,
        path: folder.path,
        type: 'folder' as const
      }));

      const files: FolderItem[] = folderContents.files.map(file => ({
        name: file.name,
        path: file.path,
        type: 'file' as const,
        document: file.document
      }));

      // Extract documents for backward compatibility
      const documents = folderContents.files
        .map(file => file.document)
        .filter((doc): doc is Document => doc !== undefined);

      // Update state all at once to prevent multiple renders
      setDocuments(documents);
      setFolderStructure({ folders, files });

      // Check if URL points to a specific file
      const urlFileName = getFileFromUrl();
      if (urlFileName) {
        // Find the document that matches the filename
        const fileDocument = documents.find(doc => {
          const docFileName = doc.s3Key.split('/').pop();
          return docFileName === urlFileName;
        });

        if (fileDocument) {
          setViewingFile(fileDocument);
        } else {
          setError(`File "${urlFileName}" not found`);
          // Navigate back to folder view
          const folderPath = currentFolderPath ? `/documents/${currentFolderPath}` : '/documents';
          navigate(folderPath, { replace: true });
        }
      } else {
        setViewingFile(null);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      // Clear data on error to prevent showing stale data
      setFolderStructure({ folders: [], files: [] });
      setDocuments([]);
      setViewingFile(null);
    } finally {
      setLoading(false);
    }
  }, [currentFolderPath, getFileFromUrl, navigate, user]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDeleteSelected = async () => {
    if (!user?.idToken) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);

      for (const doc of selectedItems) {
        await DocumentService.deleteDocument(doc.s3Key, user.idToken);
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
    if (!user?.idToken) {
      setError('Authentication required');
      return;
    }

    try {
      const downloadUrl = await DocumentService.getDownloadUrl(document.file, user.idToken);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  const handleFileNavigation = (document: Document) => {
    // Construct file path from S3 key
    const s3KeyParts = document.s3Key.split('/');
    const filePath = s3KeyParts.slice(2).join('/'); // Remove "protected/user_id/" prefix
    const navigationPath = `/documents/${filePath}`;
    navigate(navigationPath);
  };

  const handleFolderNavigation = (folderPath: string) => {
    // Clear data immediately before navigation to prevent showing stale data
    setFolderStructure({ folders: [], files: [] });
    setDocuments([]);
    setSelectedItems([]);
    setViewingFile(null);
    setCurrentPageIndex(1);

    const navigationPath = folderPath ? `/documents/${folderPath}` : '/documents';
    navigate(navigationPath);
  };

  const handleBreadcrumbClick = (path: string) => {
    // Clear data immediately before navigation to prevent showing stale data
    setFolderStructure({ folders: [], files: [] });
    setDocuments([]);
    setSelectedItems([]);
    setViewingFile(null);
    setCurrentPageIndex(1);

    const navigationPath = path ? `/documents/${path}` : '/documents';
    navigate(navigationPath);
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
            // Files with document metadata - make them clickable
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
            // Files without metadata - not clickable
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
          // Files with metadata
          return (
            <Button
              variant="normal"
              iconName="download"
              onClick={() => handleDownload(item.document)}
            >
              Download
            </Button>
          );
        } else {
          // Files without metadata (direct S3 files)
          return (
            <Button
              variant="normal"
              iconName="download"
              onClick={() => {
                setError(`The file "${item.name}" can't be downloaded directly as it has no document record. Add document metadata first.`);
                setTimeout(() => setError(''), 5000);
              }}
            >
              Download (Unavailable)
            </Button>
          );
        }
      },
      width: 180,
      minWidth: 120,
    },
  ];

  const handleCreateFolder = async () => {
    if (!user?.idToken) {
      setFolderCreationError('Authentication required');
      return;
    }

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



      // OPTIMIZED: Use the new DynamoDB-first folder creation
      await DocumentService.createFolderOptimized(
        newFolderName.trim(),
        currentFolderPath || undefined,
        user.idToken
      );

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
    <>
      {viewingFile ? (
        // File Detail View
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
                      // Clear data immediately before navigation
                      setFolderStructure({ folders: [], files: [] });
                      setDocuments([]);
                      setSelectedItems([]);
                      setViewingFile(null);

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
                  >
                    Download
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
              onDismiss={() => setError('')}
              header="Error"
            >
              {error}
            </Alert>
          )}

          {/* File Details */}
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
      ) : (
        // Folder View (existing code)
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
      )}
    </>
  );
};
