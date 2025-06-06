import React, { useState, useEffect } from 'react';
import { Storage } from 'aws-amplify';
import {
  Table,
  Box,
  SpaceBetween,
  Button,
  Header,
  Pagination,
  TextFilter,
  Container,
  Modal,
  FormField,
  Input,
  Alert,
  ProgressBar,
  StatusIndicator
} from '@cloudscape-design/components';
import { filesize } from 'filesize';
import AppLayout from '../layouts/AppLayout';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [filterText, setFilterText] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const result = await Storage.list('', { level: 'private' });
      const documentList = await Promise.all(
        result.map(async (item) => {
          if (item.key.endsWith('/')) return null; // Skip folders
          
          try {
            const url = await Storage.get(item.key, { level: 'private', expires: 60 });
            return {
              key: item.key,
              name: item.key.split('/').pop(),
              lastModified: new Date(item.lastModified),
              size: item.size,
              url
            };
          } catch (error) {
            console.error(`Error getting URL for ${item.key}:`, error);
            return {
              key: item.key,
              name: item.key.split('/').pop(),
              lastModified: new Date(item.lastModified),
              size: item.size,
              url: null
            };
          }
        })
      );
      
      setDocuments(documentList.filter(Boolean));
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(0);

    try {
      await Storage.put(selectedFile.name, selectedFile, {
        level: 'private',
        progressCallback(progress) {
          const progressPercentage = (progress.loaded / progress.total) * 100;
          setUploadProgress(progressPercentage);
        },
      });
      
      setUploadModalVisible(false);
      setSelectedFile(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedItems.length === 0) return;
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      await Promise.all(
        selectedItems.map(item => Storage.remove(item.key, { level: 'private' }))
      );
      
      setDeleteModalVisible(false);
      setSelectedItems([]);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting files:', error);
      setDeleteError('Failed to delete files. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (item) => {
    try {
      window.open(item.url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const filteredDocuments = documents.filter(item => 
    item.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const paginatedDocuments = filteredDocuments.slice(
    (currentPageIndex - 1) * pageSize,
    currentPageIndex * pageSize
  );

  return (
    <AppLayout breadcrumbs={[{ text: 'Documents', href: '/documents' }]}>
      <SpaceBetween size="l">
        <Table
          loading={loading}
          loadingText="Loading documents"
          columnDefinitions={[
            {
              id: 'name',
              header: 'Name',
              cell: item => item.name,
              sortingField: 'name'
            },
            {
              id: 'lastModified',
              header: 'Last Modified',
              cell: item => item.lastModified.toLocaleString(),
              sortingField: 'lastModified'
            },
            {
              id: 'size',
              header: 'Size',
              cell: item => filesize(item.size),
              sortingField: 'size'
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: item => (
                <Button onClick={() => handleDownload(item)}>Download</Button>
              )
            }
          ]}
          items={paginatedDocuments}
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
          header={
            <Header
              counter={`(${filteredDocuments.length})`}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button 
                    disabled={selectedItems.length === 0} 
                    onClick={() => setDeleteModalVisible(true)}
                  >
                    Delete
                  </Button>
                  <Button variant="primary" onClick={() => setUploadModalVisible(true)}>
                    Upload
                  </Button>
                </SpaceBetween>
              }
            >
              Documents
            </Header>
          }
          filter={
            <TextFilter
              filteringText={filterText}
              filteringPlaceholder="Find documents"
              filteringAriaLabel="Filter documents"
              onChange={({ detail }) => setFilterText(detail.filteringText)}
            />
          }
          pagination={
            <Pagination
              currentPageIndex={currentPageIndex}
              onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
              pagesCount={Math.max(1, Math.ceil(filteredDocuments.length / pageSize))}
              ariaLabels={{
                nextPageLabel: 'Next page',
                previousPageLabel: 'Previous page',
                pageLabel: pageNumber => `Page ${pageNumber} of all pages`
              }}
            />
          }
          empty={
            <Box textAlign="center" color="inherit">
              <b>No documents</b>
              <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                No documents to display.
              </Box>
              <Button onClick={() => setUploadModalVisible(true)}>Upload first document</Button>
            </Box>
          }
        />
      </SpaceBetween>

      {/* Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        onDismiss={() => setUploadModalVisible(false)}
        header={<Header variant="h2">Upload Document</Header>}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setUploadModalVisible(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleUpload} loading={isUploading}>Upload</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="l">
          {uploadError && <Alert type="error">{uploadError}</Alert>}
          
          <FormField label="Select file">
            <Input
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </FormField>
          
          {isUploading && (
            <FormField label="Upload progress">
              <ProgressBar 
                value={uploadProgress} 
                label={`${Math.round(uploadProgress)}%`}
                description="Uploading file..."
              />
            </FormField>
          )}
        </SpaceBetween>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        onDismiss={() => setDeleteModalVisible(false)}
        header={<Header variant="h2">Delete Documents</Header>}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDeleteModalVisible(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleDelete} loading={isDeleting}>Delete</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="l">
          {deleteError && <Alert type="error">{deleteError}</Alert>}
          
          <Container>
            <StatusIndicator type="warning">
              Are you sure you want to delete {selectedItems.length} document(s)? This action cannot be undone.
            </StatusIndicator>
          </Container>
        </SpaceBetween>
      </Modal>
    </AppLayout>
  );
};

export default Documents;
