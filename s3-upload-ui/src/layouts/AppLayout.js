import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  AppLayout as CloudscapeAppLayout,
  SideNavigation,
  Button,
  TopNavigation,
  SpaceBetween,
  Modal,
  Box,
  Header
} from '@cloudscape-design/components';

const AppLayout = ({ children, breadcrumbs, contentType, notifications }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleNavigate = (event) => {
    if (event.detail.href) {
      event.preventDefault();
      navigate(event.detail.href);
    }
  };

  const navigationItems = [
    { type: 'link', text: 'Home', href: '/' },
    { type: 'link', text: 'Documents', href: '/documents' },
    { type: 'link', text: 'Profile', href: '/profile' },
    { type: 'divider' },
    { type: 'link', text: 'Sign Out', href: '#', onClick: () => setLogoutModalVisible(true) }
  ];

  const activeHref = location.pathname;

  return (
    <>
      <CloudscapeAppLayout
        contentType={contentType || "default"}
        navigation={
          <SideNavigation
            activeHref={activeHref}
            header={{ text: 'S3 Upload Demo', href: '/' }}
            items={navigationItems}
            onFollow={handleNavigate}
          />
        }
        breadcrumbs={breadcrumbs}
        notifications={notifications}
        toolsHide={true}
        content={children}
        headerSelector="#header"
      />
      
      <div id="header" style={{ position: 'sticky', top: 0, zIndex: 1002 }}>
        <TopNavigation
          identity={{
            href: '/',
            title: 'S3 Upload Demo',
            logo: {
              src: 'https://d1.awsstatic.com/logos/aws-logo-lockups/poweredbyaws/PB_AWS_logo_RGB_stacked_REV_SQ.91cd4af40773cbfbd15577a3c2b8a346fe3e8fa2.png',
              alt: 'AWS'
            }
          }}
          utilities={[
            {
              type: 'button',
              text: user?.username || 'User',
              iconName: 'user-profile',
              onClick: () => navigate('/profile')
            },
            {
              type: 'button',
              text: 'Sign out',
              onClick: () => setLogoutModalVisible(true)
            }
          ]}
        />
      </div>

      <Modal
        visible={logoutModalVisible}
        onDismiss={() => setLogoutModalVisible(false)}
        header={<Header variant="h2">Sign out</Header>}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setLogoutModalVisible(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => signOut()}>Sign out</Button>
            </SpaceBetween>
          </Box>
        }
      >
        Are you sure you want to sign out?
      </Modal>
    </>
  );
};

export default AppLayout;
