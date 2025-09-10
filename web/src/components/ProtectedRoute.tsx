import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Spinner, Alert } from '@cloudscape-design/components';
import { canAccessRoute, hasPermission, RBACPermissions } from '../lib/rbac';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermission?: keyof RBACPermissions;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [],
  requiredPermission
}) => {
  const { isAuthenticated, isLoading, hasAnyRole, user } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('ProtectedRoute - user:', user);
  console.log('ProtectedRoute - location:', location.pathname);

  if (isLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check specific permission if provided
  if (requiredPermission && user) {
    const hasRequiredPermission = hasPermission(
      user.roles || [], 
      requiredPermission, 
      user.vendorId
    );
    
    if (!hasRequiredPermission) {
      console.log(`Access denied - missing permission: ${requiredPermission}`);
      return <Navigate to="/access-denied" replace />;
    }
  }

  // Check required roles if provided
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    console.log(`Access denied - missing roles: ${requiredRoles.join(', ')}`);
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};
