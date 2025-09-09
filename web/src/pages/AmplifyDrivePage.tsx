import React, { useState } from 'react';
import {
  View,
  Heading,
  Card,
  Grid,
  Button,
  Badge,
  Text,
  Flex,
  Divider
} from '@aws-amplify/ui-react';
import { AmplifyDocumentTable } from '../components/AmplifyDocumentTable';
import { AmplifyUploadComponent } from '../components/AmplifyUploadComponent';
import { AmplifyDocumentSearch } from '../components/AmplifyDocumentSearch';
import { useAmplifyAuth } from '../components/AmplifyAuthProvider';

export const AmplifyDrivePage: React.FC = () => {
  const [searchFilters, setSearchFilters] = useState({});
  const { userInfo } = useAmplifyAuth();

  return (
    <View padding="large">
      <Flex direction="column" gap="large">
        <Card>
          <Flex direction="row" justifyContent="space-between" alignItems="center">
            <View>
              <Heading level={1}>My Drive</Heading>
              <Text color="font.secondary">
                Manage and organize your personal documents securely
              </Text>
            </View>
            <Flex direction="row" gap="small">
              <Badge variation="info">Personal Drive</Badge>
              <Badge variation="success">Active</Badge>
            </Flex>
          </Flex>
        </Card>

        <Grid templateColumns="1fr 2fr" gap="large">
          <Card>
            <Heading level={3}>Quick Upload</Heading>
            <Text color="font.secondary" marginBottom="medium">
              Upload new documents to your personal drive
            </Text>
            <Divider marginBlock="medium" />
            <AmplifyUploadComponent />
          </Card>

          <Card>
            <Heading level={3}>Search & Filter</Heading>
            <Text color="font.secondary" marginBottom="medium">
              Search and filter your documents
            </Text>
            <Divider marginBlock="medium" />
            <AmplifyDocumentSearch onSearch={setSearchFilters} />
          </Card>
        </Grid>

        <Card>
          <Flex direction="row" justifyContent="space-between" alignItems="center" marginBottom="medium">
            <View>
              <Heading level={3}>Your Documents</Heading>
              <Text color="font.secondary">
                Welcome back, {userInfo?.email}. Here are your documents.
              </Text>
            </View>
            <Text fontSize="small" color="font.secondary">
              User ID: {userInfo?.userId}
            </Text>
          </Flex>
          <Divider marginBottom="medium" />
          <AmplifyDocumentTable scope="me" filters={searchFilters} />
        </Card>
      </Flex>
    </View>
  );
};
