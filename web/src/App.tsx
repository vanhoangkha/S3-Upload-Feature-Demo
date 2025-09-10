import React, { useState } from 'react';
import {
  AppLayout,
  TopNavigation,
  SideNavigation,
  ContentLayout,
  Header,
  Table,
  Button,
  SpaceBetween,
  Box,
  Alert,
  Modal,
  Form,
  FormField,
  Input,
  Container
} from '@cloudscape-design/components';
import '@cloudscape-design/global-styles/index.css';

function App() {
  const [activeTab, setActiveTab] = useState('documents');
  const [showModal, setShowModal] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const API_URL = 'https://wcyez0q6t8.execute-api.us-east-1.amazonaws.com/v1';

  const testAPI = async (endpoint: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setAlert({ type: response.ok ? 'success' : 'error', message: `${endpoint}: ${JSON.stringify(data)}` });
    } catch (error: any) {
      setAlert({ type: 'error', message: `${endpoint}: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { type: 'link', text: 'Documents', href: '/documents' },
    { type: 'link', text: 'Admin', href: '/admin' },
    { type: 'link', text: 'Vendor', href: '/vendor' },
    { type: 'link', text: 'User', href: '/user' }
  ];

  const endpoints = [
    { name: 'Health Check', path: '/health' },
    { name: 'Who Am I', path: '/me' },
    { name: 'List Files', path: '/files' },
    { name: 'Admin Users', path: '/admin/users' },
    { name: 'Vendor Docs', path: '/vendor/documents' },
    { name: 'User Profile', path: '/user/profile' }
  ];

  return (
    <>
      <TopNavigation
        identity={{ href: '/', title: 'DMS - API Integration Test' }}
        utilities={[
          {
            type: 'button',
            text: 'Test All APIs',
            onClick: () => endpoints.forEach(ep => testAPI(ep.path))
          }
        ]}
      />
      
      <AppLayout
        navigation={
          <SideNavigation
            header={{ text: 'API Endpoints' }}
            items={navigationItems}
            onFollow={(e) => {
              e.preventDefault();
              setActiveTab(e.detail.href.replace('/', ''));
            }}
          />
        }
        content={
          <ContentLayout
            header={
              <Header
                variant="h1"
                actions={
                  <Button variant="primary" onClick={() => setShowModal(true)}>
                    Create Document
                  </Button>
                }
              >
                API Endpoint Testing
              </Header>
            }
          >
            <SpaceBetween size="l">
              {alert && (
                <Alert
                  type={alert.type}
                  dismissible
                  onDismiss={() => setAlert(null)}
                >
                  {alert.message}
                </Alert>
              )}

              <Container header={<Header>Available API Endpoints</Header>}>
                <Table
                  columnDefinitions={[
                    { id: 'name', header: 'Endpoint', cell: item => item.name },
                    { id: 'path', header: 'Path', cell: item => item.path },
                    { id: 'action', header: 'Action', cell: item => (
                      <Button 
                        size="small" 
                        onClick={() => testAPI(item.path)}
                        loading={loading}
                      >
                        Test
                      </Button>
                    )}
                  ]}
                  items={endpoints}
                  empty={<Box>No endpoints available</Box>}
                />
              </Container>

              <Container header={<Header>Quick Actions</Header>}>
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={() => testAPI('/files')}>List Documents</Button>
                  <Button onClick={() => testAPI('/admin/users')}>List Users</Button>
                  <Button onClick={() => testAPI('/vendor/documents')}>Vendor Docs</Button>
                  <Button onClick={() => testAPI('/user/profile')}>User Profile</Button>
                </SpaceBetween>
              </Container>
            </SpaceBetween>
          </ContentLayout>
        }
      />

      <Modal
        visible={showModal}
        onDismiss={() => setShowModal(false)}
        header="Create Document"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => {
                testAPI('/files');
                setShowModal(false);
              }}>
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Document Name">
            <Input placeholder="Enter document name" />
          </FormField>
        </Form>
      </Modal>
    </>
  );
}

export default App;
