import React, { ReactNode } from 'react';
import {
  AppLayout as CloudscapeAppLayout,
  TopNavigation,
  SideNavigation,
  SideNavigationProps,
} from '@cloudscape-design/components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();

  const navigationItems: SideNavigationProps.Item[] = [
    {
      type: 'link',
      text: 'Documents',
      href: '/documents',
    },
    ...(isAdmin ? [
      {
        type: 'divider' as const,
      },
      {
        type: 'link' as const,
        text: 'Admin Panel',
        href: '/admin',
      },
    ] : []),
  ];

  const handleNavigate = (event: CustomEvent<SideNavigationProps.FollowDetail>) => {
    event.preventDefault();
    navigate(event.detail.href);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // AuthProvider will handle the navigation and history clearing
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
            type: 'menu-dropdown',
            text: `${user?.cognitoUser.email || 'User'}${isAdmin ? ' (Admin)' : ''}`,
            iconName: 'user-profile',
            items: [
              {
                id: 'signout',
                text: 'Sign out',
              },
            ],
            onItemClick: ({ detail }) => {
              if (detail.id === 'signout') {
                handleLogout();
              }
            },
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
