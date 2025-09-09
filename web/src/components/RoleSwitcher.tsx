import React from 'react';
import {
  ButtonDropdown,
  SpaceBetween,
  Badge
} from '@cloudscape-design/components';
import { useAuth } from '../contexts/AuthContext';

export const RoleSwitcher: React.FC = () => {
  const { user } = useAuth();

  const switchRole = (role: string) => {
    localStorage.setItem('demo_role', role);
    window.location.reload(); // Reload to apply new role
  };

  const currentRole = localStorage.getItem('demo_role') || 'Admin';

  return (
    <SpaceBetween direction="horizontal" size="xs">
      <Badge color="blue">Demo Mode</Badge>
      <ButtonDropdown
        items={[
          { id: 'Admin', text: 'Admin (Full Access)' },
          { id: 'Vendor', text: 'Vendor (Organization Access)' },
          { id: 'User', text: 'User (Personal Access)' }
        ]}
        onItemClick={({ detail }) => switchRole(detail.id)}
      >
        Current Role: {currentRole}
      </ButtonDropdown>
    </SpaceBetween>
  );
};
