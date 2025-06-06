import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  Form,
  FormField,
  Input,
  Textarea,
  Alert,
  StatusIndicator,
  Modal,
  Spinner,
} from '@cloudscape-design/components';
import { useParams, useNavigate } from 'react-router-dom';
import { Document } from '../types';
import { DocumentService } from '../services/documentService';
import { formatFileSize, formatDate, getFileIcon } from '../utils/helpers';

export const DocumentDetailPage: React.FC = () => {
  const { userId, fileName } = useParams<{ userId: string; fileName: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (userId && fileName) {
      loadDocument();
    }
  }, [userId, fileName]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDocument = async () => {
    if (!userId || !fileName) return;

    try {
      setLoading(true);
      setError('');

      const doc = await DocumentService.getDocument(userId, fileName);
      setDocument(doc);
      setEditTitle(doc.title);
      setEditDescription(doc.description || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (document) {
      setEditTitle(document.title);
      setEditDescription(document.description || '');
    }
  };

  const handleSave = async () => {
    if (!userId || !fileName || !document) return;

    try {
      setSaving(true);
      setError('');

      const updatedDoc = await DocumentService.updateDocument(userId, fileName, {
        title: editTitle,
        description: editDescription,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        user_id: document.user_id,
        s3Key: document.s3Key,
      });

      setDocument(updatedDoc);
      setEditing(false);
      setSuccess('Document updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!userId || !fileName) return;

    try {
      const downloadUrl = await DocumentService.getDownloadUrl(userId, fileName);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  const handleDelete = async () => {
    if (!userId || !fileName) return;

    try {
      setDeleting(true);
      await DocumentService.deleteDocument(userId, fileName);
      setShowDeleteModal(false);
      navigate('/documents');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box textAlign="center" padding="xxl">
          <Spinner size="large" />
          <Box variant="p" padding={{ top: 's' }}>
            Loading document...
          </Box>
        </Box>
      </Container>
    );
  }

  if (!document) {
    return (
      <Container
        header={
          <Header
            variant="h1"
            actions={
              <Button
                variant="link"
                iconName="arrow-left"
                onClick={() => navigate('/documents')}
              >
                Back to Documents
              </Button>
            }
          >
            Document Not Found
          </Header>
        }
      >
        <Alert type="error" header="Document Not Found">
          The requested document could not be found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container
      header={
        <Header
          variant="h1"
          description={`Document details and management options`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                iconName="arrow-left"
                onClick={() => navigate('/documents')}
              >
                Back to Documents
              </Button>
              <Button
                variant="normal"
                iconName="download"
                onClick={handleDownload}
              >
                Download
              </Button>
              {!editing && (
                <Button
                  variant="normal"
                  iconName="edit"
                  onClick={handleEdit}
                >
                  Edit
                </Button>
              )}
              <Button
                variant="normal"
                iconName="remove"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </Button>
            </SpaceBetween>
          }
        >
          {document.title}
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

      {success && (
        <Alert
          type="success"
          dismissible
          onDismiss={() => setSuccess('')}
          header="Success"
        >
          {success}
        </Alert>
      )}

      <SpaceBetween direction="vertical" size="l">
        {editing ? (
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={saving}
                  disabled={!editTitle.trim()}
                >
                  Save Changes
                </Button>
              </SpaceBetween>
            }
          >
            <SpaceBetween direction="vertical" size="l">
              <FormField
                label="Title"
                errorText={!editTitle.trim() ? 'Title is required' : ''}
              >
                <Input
                  value={editTitle}
                  onChange={({ detail }) => setEditTitle(detail.value)}
                  disabled={saving}
                />
              </FormField>

              <FormField label="Description">
                <Textarea
                  value={editDescription}
                  onChange={({ detail }) => setEditDescription(detail.value)}
                  rows={4}
                  disabled={saving}
                />
              </FormField>
            </SpaceBetween>
          </Form>
        ) : (
          <SpaceBetween direction="vertical" size="l">
            <Box>
              <SpaceBetween direction="vertical" size="m">
                <Box>
                  <Box variant="awsui-key-label">File</Box>
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Box fontSize="heading-l">{getFileIcon(document.mimeType)}</Box>
                    <Box variant="span">{document.fileName}</Box>
                  </SpaceBetween>
                </Box>

                <Box>
                  <Box variant="awsui-key-label">Description</Box>
                  <Box variant="span">
                    {document.description || 'No description provided'}
                  </Box>
                </Box>

                <Box>
                  <Box variant="awsui-key-label">File Size</Box>
                  <Box variant="span">{formatFileSize(document.fileSize)}</Box>
                </Box>

                <Box>
                  <Box variant="awsui-key-label">MIME Type</Box>
                  <Box variant="span">{document.mimeType}</Box>
                </Box>

                <Box>
                  <Box variant="awsui-key-label">Upload Date</Box>
                  <Box variant="span">{formatDate(document.uploadDate)}</Box>
                </Box>

                <Box>
                  <Box variant="awsui-key-label">Last Modified</Box>
                  <Box variant="span">{formatDate(document.lastModified)}</Box>
                </Box>

                <Box>
                  <Box variant="awsui-key-label">Status</Box>
                  <StatusIndicator type="success">Available</StatusIndicator>
                </Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        )}
      </SpaceBetween>

      <Modal
        visible={showDeleteModal}
        onDismiss={() => setShowDeleteModal(false)}
        header="Delete Document"
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDelete}
                loading={deleting}
              >
                Delete Document
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box variant="span">
            Are you sure you want to delete "{document.title}"?
            This action cannot be undone and will permanently remove the document
            from your storage.
          </Box>
        </SpaceBetween>
      </Modal>
    </Container>
  );
};
