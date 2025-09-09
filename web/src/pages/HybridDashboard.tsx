import React, { useState } from 'react';
// CloudScape imports
import {
  ContentLayout,
  Header as CloudScapeHeader,
  Container,
  SpaceBetween,
  Grid as CloudScapeGrid,
  Badge as CloudScapeBadge,
  StatusIndicator
} from '@cloudscape-design/components';
// Amplify UI imports
import {
  View,
  Heading,
  Card,
  Text,
  Badge as AmplifyBadge,
  Flex,
  Button,
  Tabs
} from '@aws-amplify/ui-react';

import { DocumentTable } from '../components/DocumentTable';
import { AmplifyDocumentTable } from '../components/AmplifyDocumentTable';
import { UploadComponent } from '../components/UploadComponent';
import { AmplifyUploadComponent } from '../components/AmplifyUploadComponent';

export const HybridDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cloudscape');
  const [searchFilters, setSearchFilters] = useState({});

  return (
    <ContentLayout
      header={
        <CloudScapeHeader
          variant="h1"
          description="Compare CloudScape Design System vs AWS Amplify UI side by side"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <CloudScapeBadge color="blue">CloudScape</CloudScapeBadge>
              <AmplifyBadge variation="info">Amplify UI</AmplifyBadge>
              <StatusIndicator type="success">Hybrid Mode</StatusIndicator>
            </SpaceBetween>
          }
        >
          Hybrid UI Dashboard
        </CloudScapeHeader>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        {/* Comparison Header */}
        <Container>
          <Flex direction="row" gap="large">
            <Card flex="1">
              <Heading level={3}>🎨 CloudScape Design System</Heading>
              <Text color="font.secondary">
                AWS's enterprise design system for internal tools and services
              </Text>
              <Flex direction="row" gap="small" marginTop="small">
                <AmplifyBadge variation="success" size="small">Enterprise</AmplifyBadge>
                <AmplifyBadge variation="info" size="small">Data Heavy</AmplifyBadge>
                <AmplifyBadge variation="warning" size="small">Complex UI</AmplifyBadge>
              </Flex>
            </Card>
            
            <Card flex="1">
              <Heading level={3}>⚡ AWS Amplify UI</Heading>
              <Text color="font.secondary">
                Modern React components for customer-facing applications
              </Text>
              <Flex direction="row" gap="small" marginTop="small">
                <AmplifyBadge variation="success" size="small">Modern</AmplifyBadge>
                <AmplifyBadge variation="info" size="small">Mobile First</AmplifyBadge>
                <AmplifyBadge variation="warning" size="small">Flexible</AmplifyBadge>
              </Flex>
            </Card>
          </Flex>
        </Container>

        {/* Tabbed Interface */}
        <View>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabItem title="CloudScape Components" value="cloudscape">
              <CloudScapeGrid
                gridDefinition={[
                  { colspan: { default: 12, xs: 12, s: 6, m: 6, l: 6, xl: 6 } },
                  { colspan: { default: 12, xs: 12, s: 6, m: 6, l: 6, xl: 6 } }
                ]}
              >
                <Container
                  header={
                    <CloudScapeHeader variant="h2" description="CloudScape upload component">
                      CloudScape Upload
                    </CloudScapeHeader>
                  }
                >
                  <UploadComponent />
                </Container>

                <Container
                  header={
                    <CloudScapeHeader variant="h2" description="CloudScape data table">
                      CloudScape Table
                    </CloudScapeHeader>
                  }
                >
                  <DocumentTable scope="me" filters={searchFilters} />
                </Container>
              </CloudScapeGrid>
            </TabItem>

            <TabItem title="Amplify UI Components" value="amplify">
              <Flex direction="row" gap="large">
                <Card flex="1">
                  <Heading level={3} marginBottom="medium">Amplify Upload</Heading>
                  <Text color="font.secondary" marginBottom="medium">
                    Amplify UI upload component with StorageManager
                  </Text>
                  <AmplifyUploadComponent />
                </Card>

                <Card flex="1">
                  <Heading level={3} marginBottom="medium">Amplify Table</Heading>
                  <Text color="font.secondary" marginBottom="medium">
                    Amplify UI data table with modern styling
                  </Text>
                  <AmplifyDocumentTable scope="me" filters={searchFilters} />
                </Card>
              </Flex>
            </TabItem>

            <TabItem title="Side by Side" value="comparison">
              <CloudScapeGrid
                gridDefinition={[
                  { colspan: { default: 12, xs: 12, s: 12, m: 6, l: 6, xl: 6 } },
                  { colspan: { default: 12, xs: 12, s: 12, m: 6, l: 6, xl: 6 } }
                ]}
              >
                {/* CloudScape Side */}
                <Container
                  header={
                    <CloudScapeHeader 
                      variant="h2" 
                      description="Enterprise-focused design system"
                      actions={<CloudScapeBadge color="blue">CloudScape</CloudScapeBadge>}
                    >
                      CloudScape Components
                    </CloudScapeHeader>
                  }
                >
                  <SpaceBetween direction="vertical" size="m">
                    <UploadComponent />
                    <DocumentTable scope="me" filters={searchFilters} />
                  </SpaceBetween>
                </Container>

                {/* Amplify UI Side */}
                <View>
                  <Card>
                    <Flex direction="row" justifyContent="space-between" alignItems="center" marginBottom="medium">
                      <Heading level={3}>Amplify UI Components</Heading>
                      <AmplifyBadge variation="info">Amplify UI</AmplifyBadge>
                    </Flex>
                    <Text color="font.secondary" marginBottom="medium">
                      Modern, customer-facing design system
                    </Text>
                    
                    <Flex direction="column" gap="large">
                      <AmplifyUploadComponent />
                      <AmplifyDocumentTable scope="me" filters={searchFilters} />
                    </Flex>
                  </Card>
                </View>
              </CloudScapeGrid>
            </TabItem>
          </Tabs>
        </View>

        {/* Comparison Summary */}
        <Container
          header={
            <CloudScapeHeader variant="h2" description="Feature comparison and recommendations">
              Design System Comparison
            </CloudScapeHeader>
          }
        >
          <CloudScapeGrid
            gridDefinition={[
              { colspan: { default: 12, xs: 12, s: 4, m: 4, l: 4, xl: 4 } },
              { colspan: { default: 12, xs: 12, s: 4, m: 4, l: 4, xl: 4 } },
              { colspan: { default: 12, xs: 12, s: 4, m: 4, l: 4, xl: 4 } }
            ]}
          >
            <Card>
              <Heading level={4}>🎯 Use CloudScape For:</Heading>
              <Flex direction="column" gap="small" marginTop="small">
                <Text fontSize="small">• Enterprise admin panels</Text>
                <Text fontSize="small">• Data-heavy interfaces</Text>
                <Text fontSize="small">• AWS console-like UIs</Text>
                <Text fontSize="small">• Complex form workflows</Text>
                <Text fontSize="small">• Internal tools</Text>
              </Flex>
            </Card>

            <Card>
              <Heading level={4}>⚡ Use Amplify UI For:</Heading>
              <Flex direction="column" gap="small" marginTop="small">
                <Text fontSize="small">• Customer-facing apps</Text>
                <Text fontSize="small">• Mobile-first design</Text>
                <Text fontSize="small">• Modern web apps</Text>
                <Text fontSize="small">• Quick prototyping</Text>
                <Text fontSize="small">• Startup MVPs</Text>
              </Flex>
            </Card>

            <Card>
              <Heading level={4}>🔄 Hybrid Approach:</Heading>
              <Flex direction="column" gap="small" marginTop="small">
                <Text fontSize="small">• Admin: CloudScape</Text>
                <Text fontSize="small">• User UI: Amplify UI</Text>
                <Text fontSize="small">• Auth: Amplify Authenticator</Text>
                <Text fontSize="small">• Data Tables: CloudScape</Text>
                <Text fontSize="small">• Forms: Amplify UI</Text>
              </Flex>
            </Card>
          </CloudScapeGrid>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
};
