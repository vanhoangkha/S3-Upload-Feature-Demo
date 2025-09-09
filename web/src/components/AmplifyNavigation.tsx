import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  View,
  Flex,
  Button,
  Text,
  Divider,
  Badge,
  Card
} from '@aws-amplify/ui-react';
import { useAmplifyAuth } from './AmplifyAuthProvider';

interface AmplifyNavigationProps {
  signOut: () => void;
}

export const AmplifyNavigation: React.FC<AmplifyNavigationProps> = ({ signOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, hasRole, hasAnyRole } = useAmplifyAuth();

  const navigationItems = [
    { path: '/drive', label: 'My Drive', icon: '📁' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/vendor', label: 'Vendor Documents', icon: '🏢', roles: ['Vendor', 'Admin'] },
    { path: '/admin', label: 'User Management', icon: '⚙️', roles: ['Admin'] },
    { path: '/audit', label: 'Audit Logs', icon: '📊', roles: ['Admin'] }
  ];

  const canAccessItem = (roles?: string[]) => {
    if (!roles) return true;
    return hasAnyRole(roles);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <View
      width="280px"
      backgroundColor="background.primary"
      borderRight="1px solid"
      borderColor="border.primary"
      height="100vh"
      padding="medium"
    >
      <Flex direction="column" height="100%" gap="medium">
        {/* Header */}
        <Card variation="outlined">
          <Text fontWeight="bold" fontSize="large">
            Document Management
          </Text>
          <Text fontSize="small" color="font.secondary">
            AWS Amplify UI
          </Text>
        </Card>

        {/* Navigation Items */}
        <Flex direction="column" gap="xs" flex="1">
          {navigationItems
            .filter(item => canAccessItem(item.roles))
            .map((item) => (
              <Button
                key={item.path}
                variation={isActive(item.path) ? 'primary' : 'link'}
                onClick={() => navigate(item.path)}
                justifyContent="flex-start"
                width="100%"
              >
                <Flex direction="row" alignItems="center" gap="small">
                  <Text>{item.icon}</Text>
                  <Text>{item.label}</Text>
                </Flex>
              </Button>
            ))}
        </Flex>

        <Divider />

        {/* User Info */}
        <Card variation="outlined">
          <Flex direction="column" gap="small">
            <Text fontWeight="bold" fontSize="medium">
              {userInfo?.email || 'Loading...'}
            </Text>
            <Text fontSize="small" color="font.secondary">
              Vendor: {userInfo?.vendorId || 'N/A'}
            </Text>
            <Flex direction="row" gap="xs" wrap="wrap">
              {userInfo?.roles?.map(role => (
                <Badge 
                  key={role}
                  variation={role === 'Admin' ? 'error' : role === 'Vendor' ? 'warning' : 'info'} 
                  size="small"
                >
                  {role}
                </Badge>
              ))}
            </Flex>
            <Button
              variation="link"
              onClick={signOut}
              size="small"
              width="100%"
            >
              Sign Out
            </Button>
          </Flex>
        </Card>
      </Flex>
    </View>
  );
};
