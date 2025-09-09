import React, { useState, useEffect } from 'react';
import {
  ContentLayout,
  Header,
  SpaceBetween,
  Container,
  Table,
  Button,
  Modal,
  Form,
  FormField,
  Input,
  Select,
  Multiselect,
  Alert,
  Box,
  Badge,
  StatusIndicator
} from '@cloudscape-design/components';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../lib/rbac';
import { apiClient, User } from '../lib/api';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    vendor_id: 'default',
    groups: []
  });
  const { user, token } = useAuth();

  // RBAC check
  if (!user || !hasPermission(user.roles || [], 'canManageUsers', user.vendorId)) {
    return (
      <ContentLayout header={<Header variant="h1">Access Denied</Header>}>
        <Container>
          <Alert type="error">
            You don't have permission to access user management.
          </Alert>
        </Container>
      </ContentLayout>
    );
  }

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
      loadUsers();
    }
  }, [token]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.listUsers();
      setUsers(response.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await apiClient.createUser(newUser);
      setCreateModalVisible(false);
      setNewUser({ username: '', email: '', vendor_id: 'default', groups: [] });
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleUpdateRoles = async (userId: string, roles: string[]) => {
    try {
      await apiClient.updateUserRoles(userId, roles);
      setEditModalVisible(false);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update roles');
    }
  };

  const handleSignOutUser = async (userId: string) => {
    try {
      await apiClient.signOutUser(userId);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out user');
    }
  };

  const roleOptions = [
    { label: 'Admin', value: 'Admin' },
    { label: 'Vendor', value: 'Vendor' },
    { label: 'User', value: 'User' }
  ];

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Manage users and their roles"
          actions={
            <Button
              variant="primary"
              onClick={() => setCreateModalVisible(true)}
            >
              Create User
            </Button>
          }
        >
          User Management
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
                id: 'username',
                header: 'Username',
                cell: (item: User) => item.username
              },
              {
                id: 'email',
                header: 'Email',
                cell: (item: User) => item.email
              },
              {
                id: 'vendor',
                header: 'Vendor',
                cell: (item: User) => item.vendor_id
              },
              {
                id: 'roles',
                header: 'Roles',
                cell: (item: User) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    {item.groups?.map(role => (
                      <Badge key={role} color="blue">{role}</Badge>
                    ))}
                  </SpaceBetween>
                )
              },
              {
                id: 'status',
                header: 'Status',
                cell: (item: User) => (
                  <StatusIndicator type={item.status === 'CONFIRMED' ? 'success' : 'pending'}>
                    {item.status}
                  </StatusIndicator>
                )
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (item: User) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedUser(item);
                        setEditModalVisible(true);
                      }}
                    >
                      Edit Roles
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleSignOutUser(item.username)}
                    >
                      Sign Out
                    </Button>
                  </SpaceBetween>
                )
              }
            ]}
            items={users}
            loading={loading}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No users</b>
                <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                  Create your first user to get started.
                </Box>
              </Box>
            }
          />
        </Container>

        {/* Create User Modal */}
        <Modal
          visible={createModalVisible}
          onDismiss={() => setCreateModalVisible(false)}
          header="Create New User"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setCreateModalVisible(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateUser}
                  disabled={!newUser.username || !newUser.email}
                >
                  Create User
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <Form>
            <SpaceBetween direction="vertical" size="l">
              <FormField label="Username">
                <Input
                  value={newUser.username}
                  onChange={({ detail }) => setNewUser({ ...newUser, username: detail.value })}
                />
              </FormField>
              <FormField label="Email">
                <Input
                  value={newUser.email}
                  onChange={({ detail }) => setNewUser({ ...newUser, email: detail.value })}
                  type="email"
                />
              </FormField>
              <FormField label="Vendor ID">
                <Input
                  value={newUser.vendor_id}
                  onChange={({ detail }) => setNewUser({ ...newUser, vendor_id: detail.value })}
                />
              </FormField>
              <FormField label="Roles">
                <Multiselect
                  selectedOptions={newUser.groups.map(g => ({ label: g, value: g }))}
                  onChange={({ detail }) => 
                    setNewUser({ ...newUser, groups: detail.selectedOptions.map(o => o.value!) })
                  }
                  options={roleOptions}
                />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>

        {/* Edit Roles Modal */}
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          header={`Edit Roles - ${selectedUser?.username}`}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setEditModalVisible(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => selectedUser && handleUpdateRoles(selectedUser.username, selectedUser.groups)}
                >
                  Update Roles
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          {selectedUser && (
            <Form>
              <FormField label="Roles">
                <Multiselect
                  selectedOptions={selectedUser.groups?.map(g => ({ label: g, value: g })) || []}
                  onChange={({ detail }) => 
                    setSelectedUser({ 
                      ...selectedUser, 
                      groups: detail.selectedOptions.map(o => o.value!) 
                    })
                  }
                  options={roleOptions}
                />
              </FormField>
            </Form>
          )}
        </Modal>
      </SpaceBetween>
    </ContentLayout>
  );
};
