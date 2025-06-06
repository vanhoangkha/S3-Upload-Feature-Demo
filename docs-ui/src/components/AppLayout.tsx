import React, { ReactNode } from 'react';
import {
  AppLayout as CloudscapeAppLayout,
  TopNavigation,
  SideNavigation,
  SideNavigationProps,
} from '@cloudscape-design/components';
import { useNavigate, useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems: SideNavigationProps.Item[] = [
    {
      type: 'link',
      text: 'Documents',
      href: '/documents',
    },
    {
      type: 'link',
      text: 'Upload Document',
      href: '/upload',
    },
  ];

  const handleNavigate = (event: CustomEvent<SideNavigationProps.FollowDetail>) => {
    event.preventDefault();
    navigate(event.detail.href);
  };

  return (
    <div>
      <TopNavigation
        identity={{
          href: '/',
          title: 'Document Management System',
        }}
        utilities={[
          {
            type: 'button',
            text: 'demo-user',
            iconName: 'user-profile',
          },
        ]}
      />
      <CloudscapeAppLayout
        navigation={
          <SideNavigation
            activeHref={location.pathname}
            header={{ text: 'Navigation', href: '/' }}
            items={navigationItems}
            onFollow={handleNavigate}
          />
        }
        content={children}
        toolsHide
        navigationHide={false}
      />
    </div>
  );
};
