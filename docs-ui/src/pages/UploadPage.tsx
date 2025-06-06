import React, { useState, useCallback } from 'react';
import {
  Container,
  Header,
  Form,
  FormField,
  Input,
  Textarea,
  Button,
  SpaceBetween,
  Alert,
  ProgressBar,
  Box,
  FileUpload,
  FileUploadProps,
} from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { DocumentService } from '../services/documentService';
import { validateFile } from '../utils/helpers';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentUserId = 'demo-user'; // In a real app, this would come from authentication

  const handleFileChange = useCallback((detail: FileUploadProps.ChangeDetail) => {
    setFiles(detail.value);
    setError('');

    // Auto-fill title if not set and single file
    if (detail.value.length === 1 && !title) {
      const fileName = detail.value[0].name;
      const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      setTitle(nameWithoutExtension);
    }
  }, [title]);

  const validateForm = (): boolean => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return false;
    }

    if (!title.trim()) {
      setError('Please enter a title for the document');
      return false;
    }

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(`File "${file.name}": ${validation.error}`);
        return false;
      }
    }

    return true;
  };

  const uploadSingleFile = async (file: File, index: number, total: number) => {
    try {
      // Generate unique filename
      const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
      const uniqueFileName = `${uuidv4()}${fileExtension}`;

      // Get presigned URL
      const presignedData = await DocumentService.getPresignedUrl(
        uniqueFileName,
        file.type,
        currentUserId
      );

      // Upload to S3
      await DocumentService.uploadFileToS3(file, presignedData.uploadUrl);

      // Create document record
      const documentTitle = total === 1 ? title : `${title} (${index + 1})`;
      await DocumentService.createDocument({
        title: documentTitle,
        description,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        user_id: currentUserId,
        s3Key: presignedData.s3Key,
      });

      setUploadProgress(((index + 1) / total) * 100);
    } catch (err) {
      throw new Error(`Failed to upload "${file.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        await uploadSingleFile(files[i], i, files.length);
      }

      setSuccess(`Successfully uploaded ${files.length} document(s)`);

      // Reset form
      setFiles([]);
      setTitle('');
      setDescription('');
      setUploadProgress(0);

      // Navigate to documents page after a short delay
      setTimeout(() => {
        navigate('/documents');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container
      header={
        <Header
          variant="h1"
          description="Upload new documents to your library"
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
          Upload Document
        </Header>
      }
    >
      {error && (
        <Alert
          type="error"
          dismissible
          onDismiss={() => setError('')}
          header="Upload Error"
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          type="success"
          dismissible
          onDismiss={() => setSuccess('')}
          header="Upload Successful"
        >
          {success}
        </Alert>
      )}

      <form>
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => navigate('/documents')}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={uploading}
                disabled={files.length === 0 || !title.trim()}
              >
                Upload Document{files.length > 1 ? 's' : ''}
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween direction="vertical" size="l">
            <FormField
              label="Select Files"
              description="Choose one or more files to upload. Maximum file size: 100MB per file."
              errorText={files.length === 0 ? 'Please select at least one file' : ''}
            >
              <FileUpload
                onChange={({ detail }) => handleFileChange(detail)}
                value={files}
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                showFileLastModified
                showFileSize
                showFileThumbnail
                constraintText="Supported formats: Images, PDF, Word, Excel, Text files. Max 100MB per file."
                i18nStrings={{
                  uploadButtonText: (multiple) =>
                    multiple ? 'Choose files' : 'Choose file',
                  dropzoneText: (multiple) =>
                    multiple
                      ? 'Drop files to upload, or'
                      : 'Drop file to upload, or',
                  removeFileAriaLabel: (fileIndex) =>
                    `Remove file ${fileIndex + 1}`,
                  limitShowFewer: 'Show fewer files',
                  limitShowMore: 'Show more files',
                  errorIconAriaLabel: 'Error',
                }}
              />
            </FormField>

            <FormField
              label="Title"
              description="Enter a descriptive title for your document(s)"
              errorText={!title.trim() ? 'Title is required' : ''}
            >
              <Input
                value={title}
                onChange={({ detail }) => setTitle(detail.value)}
                placeholder="Enter document title..."
                disabled={uploading}
              />
            </FormField>

            <FormField
              label="Description"
              description="Optional description or notes about the document(s)"
            >
              <Textarea
                value={description}
                onChange={({ detail }) => setDescription(detail.value)}
                placeholder="Enter description (optional)..."
                rows={4}
                disabled={uploading}
              />
            </FormField>

            {uploading && (
              <Box>
                <SpaceBetween direction="vertical" size="s">
                  <Box variant="awsui-key-label">Upload Progress</Box>
                  <ProgressBar
                    value={uploadProgress}
                    additionalInfo={`${Math.round(uploadProgress)}%`}
                    description={`Uploading ${files.length} file(s)...`}
                  />
                </SpaceBetween>
              </Box>
            )}
          </SpaceBetween>
        </Form>
      </form>
    </Container>
  );
};
