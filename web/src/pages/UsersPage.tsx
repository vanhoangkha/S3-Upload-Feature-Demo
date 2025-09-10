import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Header,
  Table,
  Button,
  SpaceBetween,
  Box,
  Modal,
  FormField,
  Input,
  Select,
  Alert,
  Badge,
  StatusIndicator,
  ButtonDropdown
} from '@cloudscape-design/components';
import { authService } from '../services/auth';
import { apiClient, User } from '../services/api';

const UsersPage: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    vendor_id: '',
    groups: [] as string[],
  });
  const [createError, setCreateError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const currentUser = authService.getUser();

  // Use appropriate endpoint based on user role
  const getUsersQuery = () => {
    if (currentUser?.groups.includes('Admin')) {
      return ['admin-users'];
    } else if (currentUser?.groups.includes('Vendor')) {
      return ['vendor-users'];
    }
    return ['users'];
  };

  const getUsersFunction = () => {
    if (currentUser?.groups.includes('Admin')) {
      return () => apiClient.listUsers();
    } else if (currentUser?.groups.includes('Vendor')) {
      return () => apiClient.getVendorUsers();
    }
    return () => apiClient.listUsers();
  };

  const { data: usersData, isLoading } = useQuery({
    queryKey: getUsersQuery(),
    queryFn: getUsersFunction(),
    enabled: currentUser?.groups.includes('Admin') || currentUser?.groups.includes('Vendor'),
  });

  const createMutation = useMutation({
    mutationFn: (userData: typeof newUser) => apiClient.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUsersQuery() });
      setShowCreateModal(false);
      setNewUser({ username: '', email: '', vendor_id: '', groups: [] });
      setCreateError(null);
    },
    onError: (error) => {
      setCreateError(error instanceof Error ? error.message : 'Failed to create user');
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      apiClient.updateUserRoles(userId, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUsersQuery() });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: (userId: string) => apiClient.signOutUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUsersQuery() });
    },
  });

  const handleCreateUser = () => {
    if (newUser.username && newUser.email) {
      createMutation.mutate(newUser);
    }
  };

  const getStatusIndicator = (user: User) => {
    switch (user.status) {
      case 'CONFIRMED':
        return <StatusIndicator type="success">Active</StatusIndicator>;
      case 'FORCE_CHANGE_PASSWORD':
        return <StatusIndicator type="warning">Password Reset Required</StatusIndicator>;
      default:
        return <StatusIndicator type="pending">{user.status}</StatusIndicator>;
    }
  };

  const getRoleOptions = () => {
    if (currentUser?.groups.includes('Admin')) {
      return [
        { label: 'Admin', value: 'Admin' },
        { label: 'Vendor', value: 'Vendor' },
        { label: 'User', value: 'User' },
      ];
    } else if (currentUser?.groups.includes('Vendor')) {
      return [
        { label: 'Vendor', value: 'Vendor' },
        { label: 'User', value: 'User' },
      ];
    }
    return [];
  };

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        actions={
          currentUser?.groups.includes('Admin') && (
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Create User
            </Button>
          )
        }
      >
        Users
      </Header>

      <Container>
        <Table
          columnDefinitions={[
            {
              id: 'username',
              header: 'Username',
              cell: (item: User) => item.username,
              sortingField: 'username',
            },
            {
              id: 'email',
              header: 'Email',
              cell: (item: User) => item.email,
            },
            {
              id: 'vendor_id',
              header: 'Vendor ID',
              cell: (item: User) => item.vendor_id || 'N/A',
            },
            {
              id: 'groups',
              header: 'Roles',
              cell: (item: User) => (
                <SpaceBetween direction="horizontal" size="xs">
                  {item.groups.map(group => (
                    <Badge key={group} color={
                      group === 'Admin' ? 'red' : 
                      group === 'Vendor' ? 'blue' : 'grey'
                    }>
                      {group}
                    </Badge>
                  ))}
                </SpaceBetween>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              cell: getStatusIndicator,
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (item: User) => (
                <ButtonDropdown
                  items={[
                    { id: 'signout', text: 'Force Sign Out' },
                    ...(currentUser?.groups.includes('Admin') ? [
                      { id: 'update-roles', text: 'Update Roles' }
                    ] : [])
                  ]}
                  onItemClick={({ detail }) => {
                    if (detail.id === 'signout') {
                      signOutMutation.mutate(item.username);
                    } else if (detail.id === 'update-roles') {
                      // Simple role toggle for demo
                      const currentRoles = item.groups;
                      const newRoles = currentRoles.includes('Admin') 
                        ? ['User'] 
                        : currentRoles.includes('Vendor') 
                          ? ['Admin'] 
                          : ['Vendor'];
                      updateRolesMutation.mutate({ userId: item.username, roles: newRoles });
                    }
                  }}
                >
                  Actions
                </ButtonDropdown>
              ),
            },
          ]}
          items={usersData?.users || []}
          loading={isLoading}
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
          selectionType="multi"
          trackBy="username"
          empty={
            <Box textAlign="center" color="inherit">
              <b>No users</b>
              <Box variant="p" color="inherit">
                No users to display.
              </Box>
            </Box>
          }
        />
      </Container>

      <Modal
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        header="Create User"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateUser}
                loading={createMutation.isPending}
                disabled={!newUser.username || !newUser.email}
              >
                Create User
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          {createError && (
            <Alert type="error" dismissible onDismiss={() => setCreateError(null)}>
              {createError}
            </Alert>
          )}
          <FormField label="Username">
            <Input
              value={newUser.username}
              onChange={({ detail }) => setNewUser({ ...newUser, username: detail.value })}
              placeholder="Enter username"
            />
          </FormField>
          <FormField label="Email">
            <Input
              value={newUser.email}
              onChange={({ detail }) => setNewUser({ ...newUser, email: detail.value })}
              placeholder="Enter email address"
              type="email"
            />
          </FormField>
          <FormField label="Vendor ID">
            <Input
              value={newUser.vendor_id}
              onChange={({ detail }) => setNewUser({ ...newUser, vendor_id: detail.value })}
              placeholder="Enter vendor ID"
            />
          </FormField>
          <FormField label="Roles">
            <Select
              selectedOption={newUser.groups.length > 0 ? { label: newUser.groups[0], value: newUser.groups[0] } : null}
              onChange={({ detail }) => 
                setNewUser({ ...newUser, groups: detail.selectedOption ? [detail.selectedOption.value!] : [] })
              }
              options={getRoleOptions()}
              placeholder="Select role"
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
};

export default UsersPage;
