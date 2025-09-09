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
  Alert,
  Box
} from '@cloudscape-design/components';

export const SelfRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    vendor_id: '',
    role: 'User'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.vendor_id) {
      return;
    }
    // In real app, this would call a public registration API
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <ContentLayout
        header={<Header variant="h1">Registration Submitted</Header>}
      >
        <Container>
          <Alert type="success" header="Registration Request Sent">
            <Box>
              Your registration request has been submitted. An administrator will review and approve your account.
              You will receive an email notification once your account is ready.
            </Box>
            <Box margin={{ top: 'm' }}>
              <Button variant="primary" onClick={() => navigate('/auth/login')}>
                Back to Login
              </Button>
            </Box>
          </Alert>
        </Container>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      header={
        <Header 
          variant="h1"
          description="Request access to the Document Management System"
        >
          Request Account
        </Header>
      }
    >
      <Container>
        <Form onSubmit={handleSubmit}>
          <SpaceBetween direction="vertical" size="l">
            <FormField 
              label="Email Address" 
              errorText={!formData.email ? 'Email is required' : ''}
            >
              <Input
                value={formData.email}
                onChange={({ detail }) => setFormData(prev => ({ ...prev, email: detail.value }))}
                placeholder="your.email@company.com"
                type="email"
              />
            </FormField>

            <FormField 
              label="Vendor/Organization ID" 
              errorText={!formData.vendor_id ? 'Vendor ID is required' : ''}
            >
              <Input
                value={formData.vendor_id}
                onChange={({ detail }) => setFormData(prev => ({ ...prev, vendor_id: detail.value }))}
                placeholder="your-organization-id"
              />
            </FormField>

            <FormField label="Requested Role">
              <Select
                selectedOption={{ label: formData.role, value: formData.role }}
                onChange={({ detail }) => setFormData(prev => ({ ...prev, role: detail.selectedOption.value || 'User' }))}
                options={[
                  { label: 'User - Basic document access', value: 'User' },
                  { label: 'Vendor - Organization document access', value: 'Vendor' }
                ]}
              />
            </FormField>

            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => navigate('/auth/login')}>
                Back to Login
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit}
                disabled={!formData.email || !formData.vendor_id}
              >
                Submit Request
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        </Form>
      </Container>
    </ContentLayout>
  );
};
