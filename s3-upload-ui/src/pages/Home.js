import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Storage } from 'aws-amplify';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  ColumnLayout,
  Cards,
  Button,
  ProgressBar,
  StatusIndicator
} from '@cloudscape-design/components';
import AppLayout from '../layouts/AppLayout';
import { filesize } from 'filesize';

const Home = () => {
  const navigate = useNavigate();
  const [recentFiles, setRecentFiles] = useState([]);
  const [storageStats, setStorageStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    imageCount: 0,
    documentCount: 0,
    otherCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentFiles();
  }, []);

  const fetchRecentFiles = async () => {
    setLoading(true);
    try {
      const result = await Storage.list('', { level: 'private' });
      
      // Filter out folders
      const files = result.filter(item => !item.key.endsWith('/'));
      
      // Sort by last modified (newest first)
      files.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      
      // Take only the 5 most recent files
      const recent = files.slice(0, 5);
      
      // Get URLs for the recent files
      const recentWithUrls = await Promise.all(
        recent.map(async (item) => {
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
      
      setRecentFiles(recentWithUrls);
      
      // Calculate storage statistics
      const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
      const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
      
      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
        imageCount: files.filter(file => {
          const ext = file.key.split('.').pop().toLowerCase();
          return imageTypes.includes(ext);
        }).length,
        documentCount: files.filter(file => {
          const ext = file.key.split('.').pop().toLowerCase();
          return documentTypes.includes(ext);
        }).length,
        otherCount: files.filter(file => {
          const ext = file.key.split('.').pop().toLowerCase();
          return !imageTypes.includes(ext) && !documentTypes.includes(ext);
        }).length
      };
      
      setStorageStats(stats);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDownload = async (item) => {
    try {
      window.open(item.url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <AppLayout
      breadcrumbs={[{ text: 'Home', href: '/' }]}
      contentType="default"
    >
      <SpaceBetween size="l">
        <Container
          header={
            <Header variant="h2">
              Welcome to S3 Upload Demo
            </Header>
          }
        >
          <SpaceBetween size="l">
            <Box variant="p">
              This application demonstrates secure file uploads to Amazon S3 using pre-signed URLs.
              You can upload files, manage your documents, and download them securely.
            </Box>
            
            <ColumnLayout columns={2} variant="text-grid">
              <SpaceBetween size="l">
                <div>
                  <Box variant="h3">Quick Actions</Box>
                  <SpaceBetween size="m" direction="horizontal">
                    <Button
                      variant="primary"
                      iconName="upload"
                      onClick={() => navigate('/documents')}
                    >
                      Upload Files
                    </Button>
                    <Button
                      iconName="folder"
                      onClick={() => navigate('/documents')}
                    >
                      View All Documents
                    </Button>
                  </SpaceBetween>
                </div>
                
                <div>
                  <Box variant="h3">Storage Usage</Box>
                  <ProgressBar
                    value={30} // This would be calculated based on quota
                    label="Storage used"
                    description={`${filesize(storageStats.totalSize)} of 5 GB`}
                  />
                </div>
              </SpaceBetween>
              
              <SpaceBetween size="l">
                <div>
                  <Box variant="h3">Storage Statistics</Box>
                  <SpaceBetween size="s">
                    <div>Total Files: <strong>{storageStats.totalFiles}</strong></div>
                    <div>Images: <strong>{storageStats.imageCount}</strong></div>
                    <div>Documents: <strong>{storageStats.documentCount}</strong></div>
                    <div>Other Files: <strong>{storageStats.otherCount}</strong></div>
                    <div>Total Size: <strong>{filesize(storageStats.totalSize)}</strong></div>
                  </SpaceBetween>
                </div>
              </SpaceBetween>
            </ColumnLayout>
          </SpaceBetween>
        </Container>
        
        <Container
          header={
            <Header
              variant="h2"
              actions={
                <Button onClick={() => navigate('/documents')}>View All</Button>
              }
            >
              Recent Files
            </Header>
          }
        >
          {loading ? (
            <StatusIndicator type="loading">Loading recent files</StatusIndicator>
          ) : recentFiles.length > 0 ? (
            <Cards
              items={recentFiles}
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
              cardsPerRow={[
                { cards: 1 },
                { minWidth: 500, cards: 2 }
              ]}
              empty={
                <Box textAlign="center" color="inherit">
                  <b>No recent files</b>
                  <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                    Upload your first file to get started.
                  </Box>
                  <Button onClick={() => navigate('/documents')}>Upload files</Button>
                </Box>
              }
            />
          ) : (
            <Box textAlign="center" color="inherit">
              <b>No recent files</b>
              <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                Upload your first file to get started.
              </Box>
              <Button onClick={() => navigate('/documents')}>Upload files</Button>
            </Box>
          )}
        </Container>
      </SpaceBetween>
    </AppLayout>
  );
};

export default Home;
