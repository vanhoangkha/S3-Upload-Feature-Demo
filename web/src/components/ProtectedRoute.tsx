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
      return (
        <Box padding="l">
          <Alert type="error">
            <strong>Access Denied</strong><br />
            You don't have permission to access this resource.
            Required permission: {requiredPermission}
          </Alert>
        </Box>
      );
    }
  }

  // Check legacy role-based access
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <Box padding="l">
        <Alert type="error">
          <strong>Access Denied</strong><br />
          You don't have the required role to access this resource.
          Required roles: {requiredRoles.join(', ')}
        </Alert>
      </Box>
    );
  }

  // Check route-based permissions
  if (user && !canAccessRoute(location.pathname, user.roles || [], user.vendorId)) {
    return (
      <Box padding="l">
        <Alert type="error">
          <strong>Access Denied</strong><br />
          You don't have permission to access this page.
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
};
