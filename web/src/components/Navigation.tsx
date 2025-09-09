import React from 'react';
import { SideNavigation } from '@cloudscape-design/components';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../lib/rbac';

export const Navigation: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userRoles = user?.roles || [];
  const vendorId = user?.vendorId;

  const items = [
    {
      type: 'link' as const,
      text: 'Dashboard',
      href: '/'
    },
    {
      type: 'divider' as const
    },
    {
      type: 'section' as const,
      text: 'Documents',
      items: [
        ...(hasPermission(userRoles, 'canViewDocuments', vendorId) ? [{
          type: 'link' as const,
          text: 'Drive',
          href: '/drive'
        }] : []),
        ...(hasPermission(userRoles, 'canViewVendorData', vendorId) ? [{
          type: 'link' as const,
          text: 'Vendor',
          href: '/vendor'
        }] : [])
      ]
    },
    {
      type: 'divider' as const
    },
    {
      type: 'section' as const,
      text: 'Account',
      items: [
        {
          type: 'link' as const,
          text: 'Profile',
          href: '/profile'
        }
      ]
    },
    ...(hasPermission(userRoles, 'canManageUsers', vendorId) || hasPermission(userRoles, 'canViewAuditLogs', vendorId) ? [
      {
        type: 'divider' as const
      },
      {
        type: 'section' as const,
        text: 'Admin',
        items: [
          ...(hasPermission(userRoles, 'canManageUsers', vendorId) ? [{
            type: 'link' as const,
            text: 'Users',
            href: '/admin'
          }] : []),
          ...(hasPermission(userRoles, 'canViewAuditLogs', vendorId) ? [{
            type: 'link' as const,
            text: 'Audit',
            href: '/audit'
          }] : [])
        ]
      }
    ] : []),
    {
      type: 'divider' as const
    },
    {
      type: 'section' as const,
      text: 'Dev',
      items: [
        {
          type: 'link' as const,
          text: 'Review',
          href: '/review'
        },
        {
          type: 'link' as const,
          text: 'Demo',
          href: '/hybrid'
        }
      ]
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <SideNavigation
      activeHref={location.pathname}
      header={{
        href: '/',
        text: 'DMS Portal'
      }}
      items={items}
      onFollow={(event) => {
        if (!event.detail.external) {
          event.preventDefault();
          navigate(event.detail.href);
        }
      }}
      footer={{
        type: 'section',
        text: user ? `${user.username}` : 'Loading...',
        items: [
          {
            type: 'link',
            text: `${user?.roles?.join(', ') || 'User'}`,
            href: '/profile',
            external: false
          },
          {
            type: 'link',
            text: 'Sign out',
            href: '#',
            external: false
          }
        ]
      }}
      onFollowFooter={(event) => {
        event.preventDefault();
        if (event.detail.text === 'Sign out') {
          handleSignOut();
        } else {
          navigate('/profile');
        }
      }}
    />
  );
};
