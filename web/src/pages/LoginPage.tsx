import React from 'react';
import { 
  Container, 
  Header, 
  Button, 
  Box, 
  SpaceBetween,
  Grid
} from '@cloudscape-design/components';
import { authService } from '../services/auth';

const LoginPage: React.FC = () => {
  return (
    <Box padding="xxl" color="text-body-secondary" minHeight="100vh">
      <Grid
        gridDefinition={[
          { colspan: { default: 12, xs: 12, s: 8, m: 6, l: 4 }, offset: { default: 0, xs: 0, s: 2, m: 3, l: 4 } }
        ]}
      >
        <Box textAlign="center" padding={{ vertical: 'xxl' }}>
          <SpaceBetween size="xl">
            <Box>
              <Header variant="h1" description="">
                Document Management System
              </Header>
              <Box variant="p" color="text-body-secondary" fontSize="body-s">
                Sign in to your account
              </Box>
            </Box>

            <Container>
              <SpaceBetween size="l">
                <Box textAlign="center">
                  <SpaceBetween size="m">
                    <Box variant="h3">
                      Welcome
                    </Box>
                    <Box variant="p" color="text-body-secondary">
                      Access your documents and collaborate with your team
                    </Box>
                  </SpaceBetween>
                </Box>

                <Button 
                  variant="primary" 
                  fullWidth
                  size="large"
                  onClick={() => authService.login()}
                >
                  Sign in with AWS
                </Button>

                <Box textAlign="center" variant="small" color="text-body-secondary">
                  Secure authentication with Amazon Cognito
                </Box>
              </SpaceBetween>
            </Container>
          </SpaceBetween>
        </Box>
      </Grid>
    </Box>
  );
};

export default LoginPage;
