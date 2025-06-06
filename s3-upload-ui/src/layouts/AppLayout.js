import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppLayout,
  SideNavigation,
  Container,
  Header,
  Button,
  SpaceBetween,
  BreadcrumbGroup
} from '@cloudscape-design/components';
import '@cloudscape-design/global-styles/index.css';
import { Auth } from 'aws-amplify';

const AppLayoutComponent = ({ children, breadcrumbs = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeHref, setActiveHref] = useState(location.pathname);

  const handleSignOut = async () => {
    try {
      await Auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const navigationItems = [
    { type: 'link', text: 'Home', href: '/' },
    { type: 'link', text: 'Documents', href: '/documents' },
    { type: 'link', text: 'Profile', href: '/profile' },
  ];

  return (
    <AppLayout
      navigation={
        <SideNavigation
          header={{ text: 'S3 Upload Demo', href: '/' }}
          items={navigationItems}
          activeHref={activeHref}
          onFollow={event => {
            if (!event.detail.external) {
              event.preventDefault();
              setActiveHref(event.detail.href);
              navigate(event.detail.href);
            }
          }}
        />
      }
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: 'S3 Upload Demo', href: '/' },
            ...breadcrumbs
          ]}
          ariaLabel="Breadcrumbs"
          onFollow={event => {
            if (!event.detail.external) {
              event.preventDefault();
              navigate(event.detail.href);
            }
          }}
        />
      }
      content={
        <Container>
          {children}
        </Container>
      }
      toolsHide={true}
      contentHeader={
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="primary" onClick={handleSignOut}>Sign out</Button>
            </SpaceBetween>
          }
        >
          S3 Upload Feature Demo
        </Header>
      }
    />
  );
};

export default AppLayoutComponent;
