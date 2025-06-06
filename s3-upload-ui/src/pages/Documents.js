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
  Alert,
  StatusIndicator,
  Cards,
  CollectionPreferences,
  Flashbar
} from '@cloudscape-design/components';
import { filesize } from 'filesize';
import AppLayout from '../layouts/AppLayout';
import FileUploader from '../components/FileUploader';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [filterText, setFilterText] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewType, setViewType] = useState('table');
  const [preferences, setPreferences] = useState({
    pageSize: 10,
    visibleContent: ['name', 'lastModified', 'size', 'actions'],
    wrapLines: false,
    stripedRows: false,
  });
  const [notifications, setNotifications] = useState([]);

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
              url,
              type: item.key.split('.').pop().toLowerCase()
            };
          } catch (error) {
            console.error(`Error getting URL for ${item.key}:`, error);
            return {
              key: item.key,
              name: item.key.split('/').pop(),
              lastModified: new Date(item.lastModified),
              size: item.size,
              url: null,
              type: item.key.split('.').pop().toLowerCase()
            };
          }
        })
      );
      
      setDocuments(documentList.filter(Boolean));
    } catch (error) {
      console.error('Error fetching documents:', error);
      addNotification({
        type: 'error',
        content: 'Failed to fetch documents',
        dismissible: true
      });
    } finally {
      setLoading(false);
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
      
      addNotification({
        type: 'success',
        content: `Successfully deleted ${selectedItems.length} file(s)`,
        dismissible: true
      });
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
      addNotification({
        type: 'error',
        content: `Failed to download ${item.name}`,
        dismissible: true
      });
    }
  };

  const addNotification = (notification) => {
    const id = Math.random().toString(36).substring(2, 11);
    setNotifications(prev => [...prev, { id, ...notification }]);
    
    // Auto-dismiss after 5 seconds if dismissible
    if (notification.dismissible) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredDocuments = documents.filter(item => 
    item.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const paginatedDocuments = filteredDocuments.slice(
    (currentPageIndex - 1) * preferences.pageSize,
    currentPageIndex * preferences.pageSize
  );

  const getFileIcon = (type) => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
    const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    
    if (imageTypes.includes(type)) {
      return '📷';
    } else if (documentTypes.includes(type)) {
      return '📄';
    } else {
      return '📁';
    }
  };

  const columnDefinitions = [
    {
      id: 'name',
      header: 'Name',
      cell: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{getFileIcon(item.type)}</span>
          <span>{item.name}</span>
        </div>
      ),
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
  ];

  return (
    <AppLayout
      breadcrumbs={[{ text: 'Home', href: '/' }, { text: 'Documents', href: '/documents' }]}
      contentType="table"
      notifications={
        <Flashbar
          items={notifications.map(notification => ({
            type: notification.type,
            content: notification.content,
            dismissible: notification.dismissible,
            onDismiss: () => dismissNotification(notification.id),
            id: notification.id
          }))}
        />
      }
    >
      <SpaceBetween size="l">
        {viewType === 'table' ? (
          <Table
            loading={loading}
            loadingText="Loading documents"
            columnDefinitions={columnDefinitions}
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
                pagesCount={Math.max(1, Math.ceil(filteredDocuments.length / preferences.pageSize))}
                ariaLabels={{
                  nextPageLabel: 'Next page',
                  previousPageLabel: 'Previous page',
                  pageLabel: pageNumber => `Page ${pageNumber} of all pages`
                }}
              />
            }
            preferences={
              <CollectionPreferences
                title="Preferences"
                confirmLabel="Confirm"
                cancelLabel="Cancel"
                preferences={preferences}
                onConfirm={({ detail }) => setPreferences(detail)}
                pageSizePreference={{
                  title: "Page size",
                  options: [
                    { value: 10, label: "10 documents" },
                    { value: 20, label: "20 documents" },
                    { value: 50, label: "50 documents" }
                  ]
                }}
                visibleContentPreference={{
                  title: "Select visible columns",
                  options: [
                    {
                      label: "Document properties",
                      options: [
                        { id: "name", label: "Name" },
                        { id: "lastModified", label: "Last modified" },
                        { id: "size", label: "Size" },
                        { id: "actions", label: "Actions" }
                      ]
                    }
                  ]
                }}
                wrapLinesPreference={{
                  label: "Wrap lines",
                  description: "Check to see all the text and wrap the lines"
                }}
                stripedRowsPreference={{
                  label: "Striped rows",
                  description: "Check to add alternating shaded rows"
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
            stripedRows={preferences.stripedRows}
            wrapLines={preferences.wrapLines}
            visibleColumns={preferences.visibleContent}
          />
        ) : (
          <Cards
            loading={loading}
            loadingText="Loading documents"
            items={paginatedDocuments}
            selectionType="multi"
            selectedItems={selectedItems}
            onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
            cardDefinition={{
              header: item => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{getFileIcon(item.type)}</span>
                  <span>{item.name}</span>
                </div>
              ),
              sections: [
                {
                  id: "lastModified",
                  header: "Last Modified",
                  content: item => item.lastModified.toLocaleString()
                },
                {
                  id: "size",
                  header: "Size",
                  content: item => filesize(item.size)
                },
                {
                  id: "actions",
                  header: "Actions",
                  content: item => (
                    <Button onClick={() => handleDownload(item)}>Download</Button>
                  )
                }
              ]
            }}
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
                pagesCount={Math.max(1, Math.ceil(filteredDocuments.length / preferences.pageSize))}
                ariaLabels={{
                  nextPageLabel: 'Next page',
                  previousPageLabel: 'Previous page',
                  pageLabel: pageNumber => `Page ${pageNumber} of all pages`
                }}
              />
            }
            preferences={
              <CollectionPreferences
                title="Preferences"
                confirmLabel="Confirm"
                cancelLabel="Cancel"
                preferences={preferences}
                onConfirm={({ detail }) => setPreferences(detail)}
                pageSizePreference={{
                  title: "Page size",
                  options: [
                    { value: 10, label: "10 documents" },
                    { value: 20, label: "20 documents" },
                    { value: 50, label: "50 documents" }
                  ]
                }}
                visibleContentPreference={{
                  title: "Select visible sections",
                  options: [
                    {
                      label: "Document properties",
                      options: [
                        { id: "lastModified", label: "Last modified" },
                        { id: "size", label: "Size" },
                        { id: "actions", label: "Actions" }
                      ]
                    }
                  ]
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
        )}
        
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button 
              onClick={() => setViewType(viewType === 'table' ? 'cards' : 'table')}
              iconName={viewType === 'table' ? 'view-cards' : 'table'}
            >
              {viewType === 'table' ? 'Card view' : 'Table view'}
            </Button>
          </SpaceBetween>
        </Box>
      </SpaceBetween>

      {/* Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        onDismiss={() => setUploadModalVisible(false)}
        header={<Header variant="h2">Upload Documents</Header>}
        size="large"
      >
        <FileUploader 
          onUploadComplete={() => {
            setUploadModalVisible(false);
            fetchDocuments();
            addNotification({
              type: 'success',
              content: 'Files uploaded successfully',
              dismissible: true
            });
          }} 
        />
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
