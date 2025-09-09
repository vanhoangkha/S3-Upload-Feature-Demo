import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ContentLayout,
  Header,
  Container,
  Form,
  FormField,
  Input,
  Select,
  Button,
  SpaceBetween,
  Alert
} from '@cloudscape-design/components';
import { useMutation } from 'react-query';
import { apiClient } from '../lib/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    vendor_id: '',
    role: ''
  });
  const [error, setError] = useState('');

  const registerMutation = useMutation(
    (data: typeof formData) => apiClient.adminCreateUser({
      usernameOrEmail: data.usernameOrEmail,
      vendor_id: data.vendor_id,
      groups: [data.role]
    }),
    {
      onSuccess: () => {
        navigate('/auth/login');
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || 'Registration failed');
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.usernameOrEmail || !formData.vendor_id || !formData.role) {
      setError('All fields are required');
      return;
    }
    registerMutation.mutate(formData);
  };

  return (
    <ContentLayout
      header={
        <Header variant="h1">
          Create Account
        </Header>
      }
    >
      <Container>
        <Form onSubmit={handleSubmit}>
          <SpaceBetween direction="vertical" size="l">
            {error && (
              <Alert type="error" dismissible onDismiss={() => setError('')}>
                {error}
              </Alert>
            )}

            <FormField label="Email or Username" errorText={!formData.usernameOrEmail ? 'Required' : ''}>
              <Input
                value={formData.usernameOrEmail}
                onChange={({ detail }) => setFormData(prev => ({ ...prev, usernameOrEmail: detail.value }))}
                placeholder="Enter your email or username"
              />
            </FormField>

            <FormField label="Vendor ID" errorText={!formData.vendor_id ? 'Required' : ''}>
              <Input
                value={formData.vendor_id}
                onChange={({ detail }) => setFormData(prev => ({ ...prev, vendor_id: detail.value }))}
                placeholder="Enter your vendor ID"
              />
            </FormField>

            <FormField label="Role" errorText={!formData.role ? 'Required' : ''}>
              <Select
                selectedOption={formData.role ? { label: formData.role, value: formData.role } : null}
                onChange={({ detail }) => setFormData(prev => ({ ...prev, role: detail.selectedOption.value || '' }))}
                options={[
                  { label: 'User', value: 'User' },
                  { label: 'Vendor', value: 'Vendor' },
                  { label: 'Admin', value: 'Admin' }
                ]}
                placeholder="Select your role"
              />
            </FormField>

            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => navigate('/auth/login')}>
                Already have an account? Sign In
              </Button>
              <Button 
                variant="primary" 
                loading={registerMutation.isLoading}
                onClick={handleSubmit}
              >
                Create Account
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        </Form>
      </Container>
    </ContentLayout>
  );
};
