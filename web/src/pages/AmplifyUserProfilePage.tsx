import React from 'react';
import {
  View,
  Heading,
  Card,
  Text,
  Badge,
  Flex,
  Grid,
  Divider,
  Button,
  Collection
} from '@aws-amplify/ui-react';
import { useAmplifyAuth } from '../components/AmplifyAuthProvider';

export const AmplifyUserProfilePage: React.FC = () => {
  const { user } = useAmplifyAuth();

  const profileData = [
    { label: 'User ID', value: user?.username || 'Loading...' },
    { label: 'Email', value: user?.signInDetails?.loginId || 'Not available' },
    { label: 'Account Status', value: 'Active' },
    { label: 'Last Sign In', value: new Date().toLocaleDateString() }
  ];

  const roleData = [
    {
      name: 'Admin',
      description: 'Full system access, user management, and audit capabilities',
      type: 'success' as const,
      active: true
    },
    {
      name: 'Vendor', 
      description: 'Access to vendor organization documents and users',
      type: 'warning' as const,
      active: false
    },
    {
      name: 'User',
      description: 'Access to personal documents and basic features', 
      type: 'info' as const,
      active: true
    }
  ];

  return (
    <View padding="large">
      <Flex direction="column" gap="large">
        <Card>
          <Flex direction="row" justifyContent="space-between" alignItems="center">
            <View>
              <Heading level={1}>User Profile</Heading>
              <Text color="font.secondary">
                View and manage your account information and permissions
              </Text>
            </View>
            <Badge variation="success">Account Active</Badge>
          </Flex>
        </Card>

        <Grid templateColumns="1fr 1fr" gap="large">
          <Card>
            <Heading level={3} marginBottom="medium">Account Information</Heading>
            <Text color="font.secondary" marginBottom="medium">
              Your account details and information
            </Text>
            <Divider marginBottom="medium" />
            
            <Flex direction="column" gap="medium">
              {profileData.map((item, index) => (
                <Flex key={index} direction="row" justifyContent="space-between">
                  <Text fontWeight="bold" color="font.secondary">
                    {item.label}
                  </Text>
                  <Text>
                    {item.label === 'Account Status' ? (
                      <Badge variation="success">{item.value}</Badge>
                    ) : (
                      item.value
                    )}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Card>

          <Card>
            <Flex direction="row" justifyContent="space-between" alignItems="center" marginBottom="medium">
              <Heading level={3}>Roles & Permissions</Heading>
              <Badge>{roleData.filter(r => r.active).length} active</Badge>
            </Flex>
            <Text color="font.secondary" marginBottom="medium">
              Your current roles and permissions
            </Text>
            <Divider marginBottom="medium" />

            <Collection
              items={roleData}
              gap="small"
            >
              {(item) => (
                <Card key={item.name} variation="outlined">
                  <Flex direction="row" justifyContent="space-between" alignItems="flex-start">
                    <View flex="1">
                      <Flex direction="row" alignItems="center" gap="small" marginBottom="xs">
                        <Text fontWeight="bold">{item.name}</Text>
                        <Badge variation={item.type}>{item.name}</Badge>
                        {item.active && <Badge variation="success" size="small">Active</Badge>}
                      </Flex>
                      <Text fontSize="small" color="font.secondary">
                        {item.description}
                      </Text>
                    </View>
                  </Flex>
                </Card>
              )}
            </Collection>
          </Card>
        </Grid>

        <Card>
          <Heading level={3} marginBottom="medium">Account Details</Heading>
          <Text color="font.secondary" marginBottom="medium">
            Additional account details and attributes
          </Text>
          <Divider marginBottom="medium" />

          <Grid templateColumns="1fr 1fr 1fr" gap="large">
            <View>
              <Text fontWeight="bold" color="font.secondary" marginBottom="xs">
                Account Type
              </Text>
              <Text fontSize="large">
                Administrator
              </Text>
            </View>
            <View>
              <Text fontWeight="bold" color="font.secondary" marginBottom="xs">
                Organization
              </Text>
              <Text fontSize="large">
                Default Organization
              </Text>
            </View>
            <View>
              <Text fontWeight="bold" color="font.secondary" marginBottom="xs">
                Access Level
              </Text>
              <Badge variation="success">Full Access</Badge>
            </View>
          </Grid>
        </Card>

        <Card>
          <Flex direction="row" justifyContent="space-between" alignItems="center">
            <View>
              <Heading level={3}>Account Actions</Heading>
              <Text color="font.secondary">
                Manage your account settings and preferences
              </Text>
            </View>
            <Flex direction="row" gap="small">
              <Button variation="link">
                Change Password
              </Button>
              <Button variation="primary">
                Update Profile
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </View>
  );
};
