import React, { useState, useCallback, useMemo } from 'react';
import {
  Container,
  Header,
  Table,
  Button,
  SpaceBetween,
  Box,
  Alert,
  BreadcrumbGroup,
  Tabs,
  TabsProps,
  Link,
  Badge,
  ColumnLayout,
  TextContent
} from '@cloudscape-design/components';
import { useAuth } from '../components/AuthProvider';
import { useAdminUsers, useAdminProtectedFolder, useDownloadDocument } from '../hooks/useDocuments';
import { formatFileSize, formatDate, getFileIcon } from '../utils/helpers';
import { Document, UserStats } from '../types';

export const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTabId, setActiveTabId] = useState('users');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [currentFolderPath, setCurrentFolderPath] = useState<string>('');
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);

  // Admin users query
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError
  } = useAdminUsers();

  // Protected folder query (only when user is selected)
  const {
    data: folderData,
    isLoading: folderLoading,
    error: folderError
  } = useAdminProtectedFolder(selectedUserId, currentFolderPath);

  const downloadDocumentMutation = useDownloadDocument();

  // Handle download
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

  // Handle folder navigation
  const handleFolderNavigation = useCallback((folderPath: string) => {
    setCurrentFolderPath(folderPath);
  }, []);

  // Handle file navigation (for now, just download)
  const handleFileNavigation = useCallback((document: Document) => {
    handleDownload(document);
  }, [handleDownload]);

  // Generate breadcrumbs for protected folder structure
  const protectedBreadcrumbs = useMemo(() => {
    if (!selectedUserId) return [];

    const breadcrumbs = [
      { text: 'Protected', href: '#' },
      { text: selectedUserId, href: '#' },
    ];

    if (currentFolderPath) {
      const parts = currentFolderPath.split('/');
      let path = '';
      parts.forEach(part => {
        path = path ? `${path}/${part}` : part;
        breadcrumbs.push({ text: part, href: '#' });
      });
    }

    return breadcrumbs;
  }, [selectedUserId, currentFolderPath]);

  // Users table configuration
  const usersColumnDefinitions = [
    {
      id: 'userId',
      header: 'User ID',
      cell: (item: UserStats) => (
        <Link
          onFollow={() => {
            setSelectedUserId(item.user_id);
            setCurrentFolderPath('');
            setActiveTabId('protected');
          }}
        >
          {item.user_id}
        </Link>
      ),
      sortingField: 'user_id',
    },
    {
      id: 'documentCount',
      header: 'Documents',
      cell: (item: UserStats) => (
        <Badge color={item.documentCount > 0 ? 'blue' : 'grey'}>
          {item.documentCount}
        </Badge>
      ),
      sortingField: 'documentCount',
    },
    {
      id: 'lastActivity',
      header: 'Last Activity',
      cell: (item: UserStats) => formatDate(item.lastActivity),
      sortingField: 'lastActivity',
    },
  ];

  // Protected folder table configuration
  const protectedColumnDefinitions = [
    {
      id: 'icon',
      header: '',
      cell: (item: any) => (
        <Box textAlign="center" fontSize="heading-l">
          {item.type === 'folder' ? '📁' : getFileIcon(item.document?.mimeType || '')}
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
        if (item.type === 'folder') {
          return (
            <Button
              variant="link"
              onClick={() => handleFolderNavigation(item.path)}
            >
              {item.name}
            </Button>
          );
        } else {
          return (
            <Button
              variant="link"
              onClick={() => handleFileNavigation(item.document)}
              loading={downloadingDocumentId === item.document?.s3Key}
            >
              {item.document?.title || item.name}
            </Button>
          );
        }
      },
    },
    {
      id: 'size',
      header: 'Size',
      cell: (item: any) => {
        if (item.type === 'folder') return '-';
        return item.document ? formatFileSize(item.document.fileSize) : '-';
      },
    },
    {
      id: 'modified',
      header: 'Modified',
      cell: (item: any) => {
        if (item.type === 'folder') return '-';
        return item.document ? formatDate(item.document.updatedAt) : '-';
      },
    },
    {
      id: 'type',
      header: 'Type',
      cell: (item: any) => {
        if (item.type === 'folder') return 'Folder';
        return item.document?.mimeType || 'Unknown';
      },
    },
  ];

  // Tab definitions
  const tabs: TabsProps.Tab[] = [
    {
      id: 'users',
      label: 'All Users',
      content: (
        <Container>
          {usersError && (
            <Alert type="error" header="Error loading users">
              {usersError instanceof Error ? usersError.message : 'An error occurred'}
            </Alert>
          )}

          <Table
            columnDefinitions={usersColumnDefinitions}
            items={usersData?.users || []}
            loading={usersLoading}
            loadingText="Loading users..."
            empty={
              <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
                <SpaceBetween size="m">
                  <b>No users found</b>
                </SpaceBetween>
              </Box>
            }
            header={
              <Header
                counter={usersData?.users ? `(${usersData.users.length})` : undefined}
                description="List of all users with document statistics"
              >
                Users Overview
              </Header>
            }
          />
        </Container>
      ),
    },
    {
      id: 'protected',
      label: 'Protected Structure',
      disabled: !selectedUserId,
      content: (
        <Container>
          {selectedUserId && (
            <>
              <SpaceBetween size="m">
                <ColumnLayout columns={2}>
                  <div>
                    <TextContent>
                      <h3>Browsing Protected Folder</h3>
                      <p><strong>User:</strong> {selectedUserId}</p>
                      <p><strong>Path:</strong> {folderData?.protectedPath || `protected/${selectedUserId}`}</p>
                    </TextContent>
                  </div>
                  <div>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                        variant="normal"
                        onClick={() => {
                          setSelectedUserId('');
                          setCurrentFolderPath('');
                          setActiveTabId('users');
                        }}
                      >
                        ← Back to Users
                      </Button>
                      {currentFolderPath && (
                        <Button
                          variant="normal"
                          onClick={() => {
                            const parentPath = currentFolderPath.split('/').slice(0, -1).join('/');
                            setCurrentFolderPath(parentPath);
                          }}
                        >
                          ↑ Parent Folder
                        </Button>
                      )}
                    </SpaceBetween>
                  </div>
                </ColumnLayout>

                <BreadcrumbGroup items={protectedBreadcrumbs} />

                {folderError && (
                  <Alert type="error" header="Error loading folder contents">
                    {folderError instanceof Error ? folderError.message : 'An error occurred'}
                  </Alert>
                )}

                <Table
                  columnDefinitions={protectedColumnDefinitions}
                  items={[
                    ...(folderData?.folders || []).map(folder => ({ ...folder, type: 'folder' as const })),
                    ...(folderData?.files || []).map(file => ({ ...file, type: 'file' as const }))
                  ]}
                  loading={folderLoading}
                  loadingText="Loading folder contents..."
                  empty={
                    <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
                      <SpaceBetween size="m">
                        <b>This folder is empty</b>
                        <p>No files or folders found in this location.</p>
                      </SpaceBetween>
                    </Box>
                  }
                  header={
                    <Header
                      counter={
                        folderData
                          ? `(${(folderData.folders?.length || 0) + (folderData.files?.length || 0)})`
                          : undefined
                      }
                      description={`Contents of ${folderData?.protectedPath || 'protected folder'}`}
                    >
                      Folder Contents
                    </Header>
                  }
                />
              </SpaceBetween>
            </>
          )}

          {!selectedUserId && (
            <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
              <SpaceBetween size="m">
                <b>Select a user to browse their protected folders</b>
                <p>Go to the "All Users" tab and click on a User ID to view their document structure.</p>
              </SpaceBetween>
            </Box>
          )}
        </Container>
      ),
    },
  ];

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <Container>
        <Alert type="error" header="Access Denied">
          You must be an administrator to access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container
      header={
        <Header
          variant="h1"
          description="Administrative interface for managing users and viewing document structures"
        >
          Admin Panel
        </Header>
      }
    >
      <Tabs
        activeTabId={activeTabId}
        onChange={({ detail }) => setActiveTabId(detail.activeTabId)}
        tabs={tabs}
      />
    </Container>
  );
};
