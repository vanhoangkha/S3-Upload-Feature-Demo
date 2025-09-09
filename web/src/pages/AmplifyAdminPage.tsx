import React, { useState } from 'react';
import {
  View,
  Heading,
  Card,
  Text,
  Button,
  Flex,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Badge,
  SearchField,
  SelectField,
  TextField,
  Divider
} from '@aws-amplify/ui-react';
import { Modal } from '@cloudscape-design/components';

export const AmplifyAdminPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    vendorId: '',
    role: 'User'
  });

  // Mock user data
  const users = [
    {
      id: '1',
      username: 'john.doe',
      email: 'john.doe@example.com',
      status: 'Active',
      roles: ['User'],
      vendorId: 'vendor-1',
      lastLogin: '2024-01-15'
    },
    {
      id: '2',
      username: 'jane.admin',
      email: 'jane.admin@example.com', 
      status: 'Active',
      roles: ['Admin'],
      vendorId: 'vendor-1',
      lastLogin: '2024-01-14'
    }
  ];

  const handleCreateUser = () => {
    console.log('Creating user:', newUser);
    setShowCreateModal(false);
    setNewUser({ email: '', vendorId: '', role: 'User' });
  };

  const handleSignOutUser = (userId: string) => {
    console.log('Signing out user:', userId);
  };

  const handleUpdateRoles = (userId: string) => {
    console.log('Updating roles for user:', userId);
  };

  return (
    <View padding="large">
      <Flex direction="column" gap="large">
        <Card>
          <Flex direction="row" justifyContent="space-between" alignItems="center">
            <View>
              <Heading level={1}>User Management</Heading>
              <Text color="font.secondary">
                Manage users, roles, and permissions across your organization
              </Text>
            </View>
            <Flex direction="row" gap="small">
              <Badge variation="info">Admin Panel</Badge>
              <Badge variation="success">{users.length} Users</Badge>
            </Flex>
          </Flex>
        </Card>

        <Card>
          <Flex direction="row" justifyContent="space-between" alignItems="center" marginBottom="medium">
            <Heading level={3}>Users</Heading>
            <Button
              variation="primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create User
            </Button>
          </Flex>
          
          <Flex direction="row" gap="medium" marginBottom="medium">
            <SearchField
              label="Search users"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
              onClear={() => setSearchTerm('')}
            />
            <SelectField label="Filter by role" defaultValue="all">
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Vendor">Vendor</option>
              <option value="User">User</option>
            </SelectField>
          </Flex>

          <Table highlightOnHover={true}>
            <TableHead>
              <TableRow>
                <TableCell as="th">Username</TableCell>
                <TableCell as="th">Email</TableCell>
                <TableCell as="th">Status</TableCell>
                <TableCell as="th">Roles</TableCell>
                <TableCell as="th">Vendor ID</TableCell>
                <TableCell as="th">Last Login</TableCell>
                <TableCell as="th">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Text fontWeight="bold">{user.username}</Text>
                  </TableCell>
                  <TableCell>
                    <Text fontSize="small">{user.email}</Text>
                  </TableCell>
                  <TableCell>
                    <Badge variation={user.status === 'Active' ? 'success' : 'error'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Flex direction="row" gap="xs">
                      {user.roles.map(role => (
                        <Badge 
                          key={role} 
                          variation={role === 'Admin' ? 'warning' : 'info'}
                          size="small"
                        >
                          {role}
                        </Badge>
                      ))}
                    </Flex>
                  </TableCell>
                  <TableCell>
                    <Text fontSize="small">{user.vendorId}</Text>
                  </TableCell>
                  <TableCell>
                    <Text fontSize="small">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Flex direction="row" gap="xs">
                      <Button
                        variation="link"
                        size="small"
                        onClick={() => handleUpdateRoles(user.id)}
                      >
                        Edit Roles
                      </Button>
                      <Button
                        variation="link"
                        size="small"
                        onClick={() => handleSignOutUser(user.id)}
                      >
                        Sign Out
                      </Button>
                    </Flex>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Create User Modal */}
        <Modal
          isOpen={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
        >
          <Card>
            <Heading level={3} marginBottom="medium">Create New User</Heading>
            <Divider marginBottom="medium" />
            
            <Flex direction="column" gap="medium">
              <TextField
                label="Email Address"
                placeholder="user@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
              />
              
              <TextField
                label="Vendor ID"
                placeholder="vendor-123"
                value={newUser.vendorId}
                onChange={(e) => setNewUser({...newUser, vendorId: e.target.value})}
                required
              />
              
              <SelectField
                label="Initial Role"
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="User">User</option>
                <option value="Vendor">Vendor</option>
                <option value="Admin">Admin</option>
              </SelectField>

              <Divider />
              
              <Flex direction="row" justifyContent="flex-end" gap="small">
                <Button
                  variation="link"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variation="primary"
                  onClick={handleCreateUser}
                  isDisabled={!newUser.email || !newUser.vendorId}
                >
                  Create User
                </Button>
              </Flex>
            </Flex>
          </Card>
        </Modal>
      </Flex>
    </View>
  );
};
