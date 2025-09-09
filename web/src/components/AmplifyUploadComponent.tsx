import React, { useState, useRef } from 'react';
import {
  View,
  Button,
  Text,
  Flex,
  TextField,
  SelectField,
  Alert,
  Card,
  Divider,
  Loader
} from '@aws-amplify/ui-react';
import { apiClient } from '../lib/api';

export const AmplifyUploadComponent: React.FC = () => {
  const [tags, setTags] = useState('');
  const [uploadType, setUploadType] = useState('personal');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    try {
      setIsUploading(true);
      setError(null);
      setSuccess(null);
      setUploadProgress(0);

      // Get presigned upload URL
      const uploadResponse = await apiClient.getUploadUrl({
        filename: file.name,
        contentType: file.type,
      });

      setUploadProgress(25);

      // Upload file to S3 using presigned URL
      const formData = new FormData();
      
      // Parse the presigned URL to extract form fields
      const uploadUrl = new URL(uploadResponse.url);
      const searchParams = new URLSearchParams(uploadUrl.search);
      
      // Add required fields for S3 upload
      for (const [key, value] of searchParams.entries()) {
        formData.append(key, value);
      }
      
      // Add the file last
      formData.append('file', file);

      setUploadProgress(50);

      const uploadResult = await fetch(uploadResponse.url, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResult.ok) {
        throw new Error('Failed to upload file to S3');
      }

      setUploadProgress(75);

      // Create document metadata
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      await apiClient.createDocument({
        filename: file.name,
        contentType: file.type,
        tags: tagArray,
      });

      setUploadProgress(100);
      setSuccess(`Successfully uploaded ${file.name}`);
      
      // Reset form
      setTags('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setSuccess(null);
        setError(null);
      }, 3000);
    }
  };

  return (
    <View>
      <Flex direction="column" gap="medium">
        <SelectField
          label="Upload Type"
          descriptiveText="Choose where to upload your document"
          value={uploadType}
          onChange={(e) => setUploadType(e.target.value)}
          disabled={isUploading}
        >
          <option value="personal">Personal Drive</option>
          <option value="organization">Organization</option>
        </SelectField>

        <TextField
          label="Tags (optional)"
          descriptiveText="Add comma-separated tags to organize your document"
          placeholder="e.g., important, project, draft"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          disabled={isUploading}
        />

        <View>
          <Text fontWeight="bold" marginBottom="small">Select File</Text>
          <Text fontSize="small" color="font.secondary" marginBottom="medium">
            Choose a document to upload (max 10MB)
          </Text>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            disabled={isUploading}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginBottom: '16px'
            }}
          />
        </View>

        {isUploading && (
          <Card variation="outlined">
            <Flex direction="column" gap="small">
              <Flex direction="row" alignItems="center" gap="small">
                <Loader size="small" />
                <Text>Uploading... {uploadProgress}%</Text>
              </Flex>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  backgroundColor: '#007eb9',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </Flex>
          </Card>
        )}

        {error && (
          <Alert variation="error" hasIcon>
            <Text fontWeight="bold">Upload Failed</Text>
            <Text>{error}</Text>
          </Alert>
        )}

        {success && (
          <Alert variation="success" hasIcon>
            <Text fontWeight="bold">Upload Successful</Text>
            <Text>{success}</Text>
          </Alert>
        )}

        <Divider />
        
        <Text fontSize="small" color="font.secondary">
          Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG
          <br />
          Maximum file size: 10MB
        </Text>
      </Flex>
    </View>
  );
};
