import React from 'react';
import {
  Container,
  Header,
  ColumnLayout,
  KeyValuePairs,
  Badge,
  SpaceBetween,
  StatusIndicator,
  Box
} from '@cloudscape-design/components';
import { authService } from '../services/auth';

const ProfilePage: React.FC = () => {
  const user = authService.getUser();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <SpaceBetween size="l">
      <Header variant="h1">Account Settings</Header>

      <ColumnLayout columns={2} variant="text-grid">
        <Container header={<Header variant="h2">Profile Information</Header>}>
          <KeyValuePairs
            columns={1}
            items={[
              { label: 'User ID', value: user.userId },
              { label: 'Username', value: user.username },
              { label: 'Email', value: user.email },
              { label: 'Vendor ID', value: user.vendorId || 'Not assigned' },
            ]}
          />
        </Container>

        <Container header={<Header variant="h2">Access & Permissions</Header>}>
          <SpaceBetween size="m">
            <KeyValuePairs
              columns={1}
              items={[
                {
                  label: 'Roles',
                  value: (
                    <SpaceBetween direction="horizontal" size="xs">
                      {user.groups.map(group => (
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
                { label: 'Access Scope', value: user.scope },
                { label: 'Document Access', value: user.documentAccess },
                {
                  label: 'Account Status',
                  value: <StatusIndicator type="success">Active</StatusIndicator>,
                },
              ]}
            />
          </SpaceBetween>
        </Container>
      </ColumnLayout>

      <Container header={<Header variant="h2">Permissions</Header>}>
        <Box>
          <SpaceBetween direction="horizontal" size="xs">
            {user.permissions.length > 0 ? (
              user.permissions.map(permission => (
                <Badge key={permission} color="grey">{permission}</Badge>
              ))
            ) : (
              <Box variant="p" color="text-body-secondary">No specific permissions assigned</Box>
            )}
          </SpaceBetween>
        </Box>
      </Container>
    </SpaceBetween>
  );
};

export default ProfilePage;
