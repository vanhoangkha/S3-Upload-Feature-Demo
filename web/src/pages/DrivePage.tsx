import React, { useState, useEffect } from 'react';
import { 
  ContentLayout, 
  Header, 
  SpaceBetween, 
  Container,
  Button,
  Table,
  Box,
  Badge,
  StatusIndicator,
  Modal,
  Form,
  FormField,
  FileUpload,
  Alert,
  Icon,
  Input,
  ButtonDropdown
} from '@cloudscape-design/components';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, Document } from '../lib/api';
import { hasPermission } from '../lib/rbac';

interface FileItem extends Document {
  type: 'file' | 'folder';
  size_formatted?: string;
}

export const DrivePage: React.FC = () => {
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [folderName, setFolderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  const userRoles = user?.roles || [];
  const vendorId = user?.vendorId;
  
  const canCreate = hasPermission(userRoles, 'canCreateDocuments', vendorId);
  const canEdit = hasPermission(userRoles, 'canEditDocuments', vendorId);
  const canDelete = hasPermission(userRoles, 'canDeleteDocuments', vendorId);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
      loadDocuments();
    }
  }, [token]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.listDocuments();
      
      // Add sample folders
      const folders: FileItem[] = [
        {
          document_id: 'folder-1',
          name: 'Documents',
          type: 'folder',
          size: 0,
          mime: 'folder',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_user_id: user?.userId || '',
          tags: []
        },
        {
          document_id: 'folder-2', 
          name: 'Images',
          type: 'folder',
          size: 0,
          mime: 'folder',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_user_id: user?.userId || '',
          tags: []
        }
      ];

      // Process files and add size formatting
      const files: FileItem[] = (response.documents || []).map(doc => ({
        ...doc,
        type: 'file' as const,
        size_formatted: formatFileSize(doc.size)
      }));

      setItems([...folders, ...files]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      
      const document = await apiClient.createDocument({
        filename: selectedFile.name,
        contentType: selectedFile.type,
        tags: []
      });

      const { url } = await apiClient.getUploadUrl({
        documentId: document.document_id,
        filename: selectedFile.name,
        contentType: selectedFile.type
      });

      await fetch(url, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type
        }
      });

      setUploadModalVisible(false);
      setSelectedFile(null);
      loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;

    try {
      await apiClient.createDocument({
        filename: folderName + '/',
        contentType: 'application/x-directory',
        tags: ['folder']
      });

      setFolderModalVisible(false);
      setFolderName('');
      loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  const handleDelete = async (item: FileItem) => {
    try {
      await apiClient.deleteDocument(item.document_id);
      loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            canCreate ? (
              <ButtonDropdown
                items={[
                  {
                    text: 'Upload File',
                    id: 'upload',
                    iconName: 'upload'
                  },
                  {
                    text: 'Create Folder',
                    id: 'folder',
                    iconName: 'folder'
                  }
                ]}
                onItemClick={({ detail }) => {
                  if (detail.id === 'upload') {
                    setUploadModalVisible(true);
                  } else if (detail.id === 'folder') {
                    setFolderModalVisible(true);
                  }
                }}
              >
                Create
              </ButtonDropdown>
            ) : null
          }
        >
          My Files
        </Header>
      }
    >
      <SpaceBetween size="l">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            columnDefinitions={[
              {
                id: 'icon',
                header: '',
                width: 40,
                cell: (item: FileItem) => (
                  <Icon 
                    name={item.type === 'folder' ? 'folder' : 'file'} 
                    size="medium"
                  />
                )
              },
              {
                id: 'name',
                header: 'Name',
                cell: (item: FileItem) => (
                  <Box>
                    <strong>{item.name}</strong>
                    {item.type === 'file' && (
                      <Box fontSize="body-s" color="text-body-secondary">
                        {item.mime}
                      </Box>
                    )}
                  </Box>
                )
              },
              {
                id: 'size',
                header: 'Size',
                cell: (item: FileItem) => 
                  item.type === 'folder' ? '—' : (item.size_formatted || formatFileSize(item.size))
              },
              {
                id: 'modified',
                header: 'Modified',
                cell: (item: FileItem) => new Date(item.updated_at).toLocaleDateString()
              },
              {
                id: 'tags',
                header: 'Tags',
                cell: (item: FileItem) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    {item.tags?.map(tag => (
                      <Badge key={tag} color="blue">{tag}</Badge>
                    ))}
                  </SpaceBetween>
                )
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (item: FileItem) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    {canEdit && (
                      <Button size="small" iconName="edit">
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button 
                        size="small" 
                        iconName="remove"
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </Button>
                    )}
                  </SpaceBetween>
                )
              }
            ]}
            items={items}
            loading={loading}
            empty={
              <Box textAlign="center" color="inherit">
                <Icon name="folder-open" size="big" />
                <Box padding={{ bottom: 's' }} variant="h3" color="inherit">
                  No files or folders
                </Box>
                <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                  Upload files or create folders to get started.
                </Box>
              </Box>
            }
          />
        </Container>

        {/* Upload File Modal */}
        <Modal
          visible={uploadModalVisible}
          onDismiss={() => setUploadModalVisible(false)}
          header="Upload File"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setUploadModalVisible(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpload}
                  loading={uploading}
                  disabled={!selectedFile}
                >
                  Upload
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <Form>
            <FormField label="Select file">
              <FileUpload
                onChange={({ detail }) => setSelectedFile(detail.value[0] || null)}
                value={selectedFile ? [selectedFile] : []}
                i18nStrings={{
                  uploadButtonText: e => e ? "Choose files" : "Choose file",
                  dropzoneText: e => e ? "Drop files to upload" : "Drop file to upload",
                  removeFileAriaLabel: e => `Remove file ${e + 1}`,
                  limitShowFewer: "Show fewer files",
                  limitShowMore: "Show more files",
                  errorIconAriaLabel: "Error"
                }}
                showFileLastModified
                showFileSize
                showFileThumbnail
              />
            </FormField>
            {selectedFile && (
              <Alert type="info">
                <strong>File Details:</strong><br />
                Name: {selectedFile.name}<br />
                Size: {formatFileSize(selectedFile.size)}<br />
                Type: {selectedFile.type}
              </Alert>
            )}
          </Form>
        </Modal>

        {/* Create Folder Modal */}
        <Modal
          visible={folderModalVisible}
          onDismiss={() => setFolderModalVisible(false)}
          header="Create Folder"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setFolderModalVisible(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateFolder}
                  disabled={!folderName.trim()}
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <Form>
            <FormField label="Folder name">
              <Input
                value={folderName}
                onChange={({ detail }) => setFolderName(detail.value)}
                placeholder="Enter folder name"
              />
            </FormField>
          </Form>
        </Modal>
      </SpaceBetween>
    </ContentLayout>
  );
};
