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
import { formatFileSize, formatDate, getFileIcon, getBreadcrumbs, isFilePath, getFileNameFromPath, getFolderPathFromFilePath } from '../utils/helpers';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const currentUserId = 'demo-user'; // In a real app, this would come from authentication

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
      setCurrentFolderPath(urlFolderPath);
      console.log(`Initialized folder path from URL: "${urlFolderPath}"`);
    }

    // If URL points to a file, we'll handle file viewing after documents are loaded
    if (urlFileName) {
      console.log(`URL points to file: "${urlFileName}"`);
    }
  }, [getFolderPathFromUrl, getFileFromUrl, currentFolderPath]);

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

      // Check if URL points to a specific file
      const urlFileName = getFileFromUrl();
      if (urlFileName) {
        // Find the document that matches the filename
        const fileDocument = currentFolderDocuments.find(doc => {
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
    } finally {
      setLoading(false);
    }
  }, [currentFolderPath, getFileFromUrl, navigate]);

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

  const handleFileNavigation = (document: Document) => {
    // Construct file path from S3 key
    const s3KeyParts = document.s3Key.split('/');
    const filePath = s3KeyParts.slice(2).join('/'); // Remove "protected/user_id/" prefix
    const navigationPath = `/documents/${filePath}`;
    navigate(navigationPath);
  };

  const handleFolderNavigation = (folderPath: string) => {
    const navigationPath = folderPath ? `/documents/${folderPath}` : '/documents';
    navigate(navigationPath);
    setCurrentPageIndex(1);
    setSelectedItems([]);
  };

  const handleBreadcrumbClick = (path: string) => {
    console.log(`Navigating to breadcrumb path: "${path}"`);
    const navigationPath = path ? `/documents/${path}` : '/documents';
    navigate(navigationPath);
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

          if (item.document) {
            // Files with document metadata - make them clickable
            return (
              <Button
                variant="link"
                onClick={() => handleFileNavigation(item.document)}
              >
                {displayName}
              </Button>
            );
          } else {
            // Files without metadata - not clickable
            return (
              <span>
                {displayName}
              </span>
            );
          }
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

          {/* Breadcrumb Navigation */}
          <Box margin={{ bottom: 'm' }}>
            <SpaceBetween direction="horizontal" size="xs">
              {getBreadcrumbs(currentFolderPath).map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.path || 'root'}>
                  {index > 0 && <span style={{ color: '#687078' }}>/</span>}
                  <Button
                    variant="link"
                    onClick={() => handleBreadcrumbClick(breadcrumb.path)}
                    ariaLabel={`Navigate to ${breadcrumb.name}`}
                  >
                    {breadcrumb.name}
                  </Button>
                </React.Fragment>
              ))}
              <span style={{ color: '#687078' }}>/</span>
              <span style={{ fontWeight: 'bold' }}>{viewingFile.file}</span>
            </SpaceBetween>
          </Box>

          {/* File Details */}
          <SpaceBetween size="l">
            <Box>
              <SpaceBetween size="m">
                <div>
                  <Box variant="awsui-key-label">File Name</Box>
                  <Box>{viewingFile.file}</Box>
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
