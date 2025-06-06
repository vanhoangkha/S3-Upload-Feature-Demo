import React, { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';
import {
  Container,
  Header,
  SpaceBetween,
  Form,
  FormField,
  Input,
  Button,
  Alert,
  ColumnLayout,
  Box,
  ExpandableSection
} from '@cloudscape-design/components';
import AppLayout from '../layouts/AppLayout';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const userData = await Auth.currentAuthenticatedUser();
      setUser(userData);
      setEmail(userData.attributes.email || '');
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    setIsUpdating(true);
    setError('');
    setSuccess('');

    try {
      const user = await Auth.currentAuthenticatedUser();
      
      const result = await Auth.updateUserAttributes(user, {
        email: email,
      });
      
      setSuccess('Profile updated successfully. Please check your email for verification if you changed your email address.');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setIsChangingPassword(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setIsChangingPassword(false);
      return;
    }

    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.changePassword(user, currentPassword, newPassword);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message || 'Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <AppLayout breadcrumbs={[{ text: 'Profile', href: '/profile' }]}>
      <SpaceBetween size="l">
        <Container
          header={<Header variant="h2">User Profile</Header>}
          loading={loading}
        >
          {user && (
            <ColumnLayout columns={2} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Username</Box>
                <Box variant="awsui-value-large">{user.username}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Email</Box>
                <Box variant="awsui-value-large">{user.attributes.email}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Account Created</Box>
                <Box variant="awsui-value-large">
                  {new Date(user.attributes.sub.split('-')[4] * 1000).toLocaleString()}
                </Box>
              </div>
            </ColumnLayout>
          )}
        </Container>

        <Container
          header={<Header variant="h2">Update Profile</Header>}
        >
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="primary" onClick={handleUpdateProfile} loading={isUpdating}>Save Changes</Button>
              </SpaceBetween>
            }
          >
            {error && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}
            
            <FormField label="Email" controlId="email">
              <Input
                type="email"
                value={email}
                onChange={({ detail }) => setEmail(detail.value)}
              />
            </FormField>
          </Form>
        </Container>

        <Container>
          <ExpandableSection headerText="Change Password">
            <Form
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="primary" onClick={handleChangePassword} loading={isChangingPassword}>Change Password</Button>
                </SpaceBetween>
              }
            >
              <FormField label="Current Password" controlId="currentPassword">
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={({ detail }) => setCurrentPassword(detail.value)}
                />
              </FormField>
              <FormField label="New Password" controlId="newPassword">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={({ detail }) => setNewPassword(detail.value)}
                />
              </FormField>
              <FormField label="Confirm New Password" controlId="confirmPassword">
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={({ detail }) => setConfirmPassword(detail.value)}
                />
              </FormField>
            </Form>
          </ExpandableSection>
        </Container>
      </SpaceBetween>
    </AppLayout>
  );
};

export default Profile;
