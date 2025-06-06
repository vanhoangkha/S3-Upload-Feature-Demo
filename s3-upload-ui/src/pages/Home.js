import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  ColumnLayout,
  Cards,
  Button,
  Link,
  TextContent
} from '@cloudscape-design/components';
import { Auth } from 'aws-amplify';
import AppLayout from '../layouts/AppLayout';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await Auth.currentAuthenticatedUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/login');
      }
    };

    checkUser();
  }, [navigate]);

  const cardItems = [
    {
      header: "Document Management",
      description: "Upload, download, and manage your documents securely in the cloud.",
      footer: <Button onClick={() => navigate('/documents')}>View Documents</Button>
    },
    {
      header: "User Profile",
      description: "View and update your profile information.",
      footer: <Button onClick={() => navigate('/profile')}>View Profile</Button>
    },
    {
      header: "Documentation",
      description: "Learn more about how to use the S3 Upload Feature Demo.",
      footer: <Link href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html" external>View Documentation</Link>
    }
  ];

  return (
    <AppLayout breadcrumbs={[]}>
      <SpaceBetween size="l">
        <Container
          header={<Header variant="h2">Welcome to S3 Upload Feature Demo</Header>}
        >
          <Box padding="l">
            <TextContent>
              <p>
                This application demonstrates secure file management using Amazon S3, 
                with authentication powered by Amazon Cognito. You can upload, download, 
                and manage your documents with ease.
              </p>
            </TextContent>
          </Box>
        </Container>

        <Container
          header={<Header variant="h2">Quick Actions</Header>}
        >
          <Cards
            cardDefinition={{
              header: item => <Header variant="h3">{item.header}</Header>,
              sections: [
                {
                  id: "description",
                  content: item => item.description
                },
                {
                  id: "footer",
                  content: item => item.footer
                }
              ]
            }}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 500, cards: 3 }
            ]}
            items={cardItems}
            loadingText="Loading resources"
            empty={
              <Box textAlign="center" color="inherit">
                <b>No resources</b>
                <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                  No resources to display.
                </Box>
              </Box>
            }
          />
        </Container>

        <Container
          header={<Header variant="h2">System Status</Header>}
        >
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Authentication</Box>
              <Box variant="awsui-value-large">Connected</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Storage</Box>
              <Box variant="awsui-value-large">Available</Box>
            </div>
          </ColumnLayout>
        </Container>
      </SpaceBetween>
    </AppLayout>
  );
};

export default Home;
