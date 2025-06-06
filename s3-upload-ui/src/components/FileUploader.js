import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  FormField,
  SpaceBetween,
  StatusIndicator,
  Alert,
  ProgressBar,
  Container,
  TextContent
} from '@cloudscape-design/components';
import { Storage } from 'aws-amplify';

const FileUploader = ({ onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFiles(Array.from(event.target.files));
      setError('');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
      setError('');
    }
  };

  const validateFiles = () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload');
      return false;
    }
    
    // Add additional validation as needed (file size, type, etc.)
    return true;
  };

  const handleUpload = async () => {
    if (!validateFiles()) return;

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      // For multiple files
      let completed = 0;
      
      await Promise.all(
        selectedFiles.map(async (file) => {
          await Storage.put(file.name, file, {
            level: 'private',
            progressCallback(progress) {
              // Calculate overall progress across all files
              const fileProgress = (progress.loaded / progress.total);
              const fileContribution = fileProgress / selectedFiles.length;
              const totalProgress = (completed / selectedFiles.length) + fileContribution;
              setUploadProgress(totalProgress * 100);
            },
          });
          completed++;
        })
      );
      
      setSelectedFiles([]);
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file(s). Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <SpaceBetween size="l">
      {error && <Alert type="error">{error}</Alert>}
      
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: dragActive ? '2px dashed #0972d3' : '2px dashed #d1d5db',
          borderRadius: '4px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragActive ? '#f2f8fd' : 'transparent',
          transition: 'all 0.2s ease'
        }}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={isUploading}
        />
        
        <Box padding="l">
          <SpaceBetween size="s" direction="vertical" alignItems="center">
            <StatusIndicator type="info">
              Drag and drop files here, or click to select files
            </StatusIndicator>
            <TextContent>
              <small>Supported file types: All file types</small>
            </TextContent>
          </SpaceBetween>
        </Box>
      </div>
      
      {selectedFiles.length > 0 && (
        <Container header={<h3>Selected Files ({selectedFiles.length})</h3>}>
          <SpaceBetween size="s">
            {selectedFiles.map((file, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{file.name}</strong>
                  <div><small>{formatFileSize(file.size)}</small></div>
                </div>
                {!isUploading && (
                  <Button 
                    variant="link" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </SpaceBetween>
        </Container>
      )}
      
      {isUploading && (
        <FormField label="Upload progress">
          <ProgressBar 
            value={uploadProgress} 
            label={`${Math.round(uploadProgress)}%`}
            description={`Uploading ${selectedFiles.length} file(s)...`}
          />
        </FormField>
      )}
      
      <Box float="right">
        <SpaceBetween direction="horizontal" size="xs">
          <Button 
            variant="primary" 
            onClick={handleUpload} 
            loading={isUploading}
            disabled={selectedFiles.length === 0 || isUploading}
          >
            Upload {selectedFiles.length > 0 ? `(${selectedFiles.length} files)` : ''}
          </Button>
        </SpaceBetween>
      </Box>
    </SpaceBetween>
  );
};

export default FileUploader;
