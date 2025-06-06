import React, { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';
import {
  Container,
  Header,
  SpaceBetween,
  FormField,
  Input,
  Button,
  Box,
  Alert,
  ColumnLayout,
  Tabs,
  Form,
  PasswordField
} from '@cloudscape-design/components';
import AppLayout from '../layouts/AppLayout';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const userData = await Auth.currentAuthenticatedUser();
      setUser(userData);
      
      // Extract user attributes
      const attributes = userData.attributes || {};
      setFormData({
        name: attributes.name || '',
        email: attributes.email || '',
        phone: attributes.phone_number || ''
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData({ ...passwordData, [field]: value });
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdateLoading(true);

    try {
      const user = await Auth.currentAuthenticatedUser();
      
      const attributes = {};
      if (formData.name) attributes.name = formData.name;
      if (formData.phone) attributes.phone_number = formData.phone;
      
      // Email requires verification, so we handle it separately
      const emailChanged = user.attributes.email !== formData.email && formData.email;
      
      if (Object.keys(attributes).length > 0) {
        await Auth.updateUserAttributes(user, attributes);
      }
      
      if (emailChanged) {
        await Auth.updateUserAttributes(user, {
          email: formData.email
        });
        setSuccess('Profile updated successfully. A verification code has been sent to your new email address.');
      } else if (Object.keys(attributes).length > 0) {
        setSuccess('Profile updated successfully.');
      } else {
        setSuccess('No changes to update.');
      }
      
      // Refresh user data
      fetchUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'An error occurred while updating your profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    
    setPasswordLoading(true);

    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.changePassword(
        user,
        passwordData.oldPassword,
        passwordData.newPassword
      );
      
      setSuccess('Password changed successfully');
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message || 'An error occurred while changing your password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AppLayout
      breadcrumbs={[{ text: 'Home', href: '/' }, { text: 'Profile', href: '/profile' }]}
      contentType="default"
    >
      <SpaceBetween size="l">
        <Container
          header={
            <Header variant="h2">
              User Profile
            </Header>
          }
        >
          <Tabs
            activeTabId={activeTabId}
            onChange={({ detail }) => {
              setActiveTabId(detail.activeTabId);
              setError('');
              setSuccess('');
            }}
            tabs={[
              {
                id: 'profile',
                label: 'Profile Information',
                content: (
                  <Box padding="l">
                    <Form
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button formAction="none" variant="link">
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            onClick={updateProfile}
                            loading={updateLoading}
                          >
                            Save changes
                          </Button>
                        </SpaceBetween>
                      }
                      errorText={error}
                      successText={success}
                    >
                      <SpaceBetween size="l">
                        <Container header={<Header variant="h3">Personal Information</Header>}>
                          <SpaceBetween size="l">
                            <FormField label="Username">
                              <Input
                                value={user?.username || ''}
                                disabled
                              />
                            </FormField>
                            
                            <FormField label="Full Name">
                              <Input
                                value={formData.name}
                                onChange={({ detail }) => handleProfileChange('name', detail.value)}
                              />
                            </FormField>
                            
                            <FormField label="Email">
                              <Input
                                type="email"
                                value={formData.email}
                                onChange={({ detail }) => handleProfileChange('email', detail.value)}
                              />
                            </FormField>
                            
                            <FormField label="Phone Number">
                              <Input
                                type="tel"
                                value={formData.phone}
                                onChange={({ detail }) => handleProfileChange('phone', detail.value)}
                              />
                            </FormField>
                          </SpaceBetween>
                        </Container>
                      </SpaceBetween>
                    </Form>
                  </Box>
                )
              },
              {
                id: 'security',
                label: 'Security',
                content: (
                  <Box padding="l">
                    <Form
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            formAction="none"
                            variant="link"
                            onClick={() => {
                              setPasswordData({
                                oldPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                              });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            onClick={changePassword}
                            loading={passwordLoading}
                          >
                            Change password
                          </Button>
                        </SpaceBetween>
                      }
                      errorText={error}
                      successText={success}
                    >
                      <SpaceBetween size="l">
                        <Container header={<Header variant="h3">Change Password</Header>}>
                          <SpaceBetween size="l">
                            <PasswordField
                              label="Current password"
                              value={passwordData.oldPassword}
                              onChange={({ detail }) => handlePasswordChange('oldPassword', detail.value)}
                            />
                            
                            <PasswordField
                              label="New password"
                              value={passwordData.newPassword}
                              onChange={({ detail }) => handlePasswordChange('newPassword', detail.value)}
                            />
                            
                            <PasswordField
                              label="Confirm new password"
                              value={passwordData.confirmPassword}
                              onChange={({ detail }) => handlePasswordChange('confirmPassword', detail.value)}
                            />
                          </SpaceBetween>
                        </Container>
                      </SpaceBetween>
                    </Form>
                  </Box>
                )
              },
              {
                id: 'activity',
                label: 'Account Activity',
                content: (
                  <Box padding="l">
                    <Container header={<Header variant="h3">Recent Activity</Header>}>
                      <ColumnLayout columns={1} variant="text-grid">
                        <SpaceBetween size="l">
                          <div>
                            <Box variant="h4">Last Sign In</Box>
                            <div>{new Date(user?.signInUserSession?.accessToken?.payload?.auth_time * 1000).toLocaleString() || 'N/A'}</div>
                          </div>
                          
                          <div>
                            <Box variant="h4">Account Created</Box>
                            <div>{new Date(user?.attributes?.sub ? parseInt(user.attributes.sub.substring(0, 8), 16) * 1000 : 0).toLocaleString() || 'N/A'}</div>
                          </div>
                        </SpaceBetween>
                      </ColumnLayout>
                    </Container>
                  </Box>
                )
              }
            ]}
          />
        </Container>
      </SpaceBetween>
    </AppLayout>
  );
};

export default Profile;
