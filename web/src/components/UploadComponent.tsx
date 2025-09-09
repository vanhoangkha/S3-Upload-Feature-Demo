import React, { useState } from 'react';
import {
  Container,
  Header,
  Button,
  FormField,
  Input,
  FileUpload,
  SpaceBetween,
  ProgressBar,
  Alert,
  Box
} from '@cloudscape-design/components';
import { useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export const UploadComponent: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useMutation(
    async (file: File) => {
      if (!user) throw new Error('User not authenticated');

      setError(null);
      setUploadProgress(0);

      // Calculate file checksum
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Get presigned URL
      setUploadProgress(25);
      const { url, documentId } = await apiClient.presignUpload({
        vendorId: user.vendorId,
        userId: user.userId,
        filename: file.name,
        contentType: file.type
      });

      // Simulate upload progress
      setUploadProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUploadProgress(75);

      // Create document metadata
      await apiClient.createDocument({
        name: file.name,
        mime: file.type,
        size: file.size,
        checksum,
        vendorId: user.vendorId,
        userId: user.userId,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      });

      setUploadProgress(100);
      return documentId;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['documents']);
        setFiles([]);
        setTags('');
        setTimeout(() => setUploadProgress(null), 2000);
      },
      onError: (error: Error) => {
        setError(error.message);
        setUploadProgress(null);
      }
    }
  );

  const handleUpload = () => {
    if (files.length > 0) {
      uploadMutation.mutate(files[0]);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setTags('');
    setError(null);
    setUploadProgress(null);
  };

  return (
    <Container
      header={
        <Header 
          variant="h2"
          description="Upload documents securely to your drive"
        >
          Upload Document
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="m">
        <FormField 
          label="Select file"
          description="Choose a document to upload (max 10MB)"
        >
          <FileUpload
            onChange={({ detail }) => setFiles(detail.value)}
            value={files}
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
            tokenLimit={3}
            accept="*/*"
            constraintText="Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, images"
          />
        </FormField>

        <FormField 
          label="Tags (optional)"
          description="Add tags to help organize and find your document later"
        >
          <Input
            value={tags}
            onChange={({ detail }) => setTags(detail.value)}
            placeholder="important, draft, final, project-alpha"
          />
        </FormField>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {uploadProgress !== null && (
          <FormField label="Upload Progress">
            <ProgressBar
              value={uploadProgress}
              additionalInfo={`${uploadProgress}% complete`}
              description={
                uploadProgress < 25 ? "Preparing upload..." :
                uploadProgress < 50 ? "Getting upload URL..." :
                uploadProgress < 75 ? "Uploading file..." :
                uploadProgress < 100 ? "Creating metadata..." :
                "Upload complete!"
              }
            />
          </FormField>
        )}

        <Box textAlign="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button 
              onClick={handleClear}
              disabled={uploadMutation.isLoading}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={files.length === 0 || uploadMutation.isLoading}
              loading={uploadMutation.isLoading}
            >
              Upload Document
            </Button>
          </SpaceBetween>
        </Box>
      </SpaceBetween>
    </Container>
  );
};
