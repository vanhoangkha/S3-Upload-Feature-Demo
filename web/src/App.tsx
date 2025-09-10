import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout, TopNavigation, SideNavigation, Spinner, Box, Flashbar } from '@cloudscape-design/components';
import { authService, User } from './services/auth';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentVersionsPage from './pages/DocumentVersionsPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import ProfilePage from './pages/ProfilePage';
import VendorDashboardPage from './pages/VendorDashboardPage';
import SystemHealthPage from './pages/SystemHealthPage';
import DebugPage from './pages/DebugPage';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      console.log('Checking authentication state...');
      const currentUser = authService.getUser();
      const isAuth = authService.isAuthenticated();
      
      console.log('Auth check result:', { currentUser, isAuth });
      setUser(currentUser);
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const addNotification = (notification: any) => {
    setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  console.log('App render:', { isLoading, user: !!user, pathname: location.pathname });

  if (isLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
        <Box variant="p" padding={{ top: 'm' }}>
          Loading...
        </Box>
      </Box>
    );
  }

  // Handle OAuth callback
  if (location.pathname === '/callback') {
    return <CallbackPage onSuccess={() => {
      console.log('Callback success, updating user state');
      setUser(authService.getUser());
      addNotification({
        type: 'success',
        header: 'Sign in successful',
        content: 'Welcome to Document Management System',
        dismissible: true
      });
    }} />;
  }

  // Show login page if not authenticated
  if (!user) {
    console.log('User not authenticated, showing login page');
    return <LoginPage />;
  }

  console.log('User authenticated, showing main app');

  const navigationItems = [
    { type: 'link', text: 'Dashboard', href: '/' },
    { type: 'divider' },
    { type: 'link', text: 'Documents', href: '/documents' },
    ...(user?.groups.includes('Vendor') && !user?.groups.includes('Admin')
      ? [{ type: 'link', text: 'Vendor Dashboard', href: '/vendor' }] 
      : []
    ),
    ...(user?.groups.includes('Admin') || user?.groups.includes('Vendor') 
      ? [{ type: 'link', text: 'Users', href: '/users' }] 
      : []
    ),
    ...(user?.groups.includes('Admin') 
      ? [
          { type: 'divider' },
          { type: 'link', text: 'Audit Logs', href: '/audit' },
          { type: 'link', text: 'System Health', href: '/health' },
          { type: 'link', text: 'Debug', href: '/debug' }
        ] 
      : []
    ),
  ];

  return (
    <AppLayout
      headerSelector="#header"
      navigation={
        <SideNavigation
          header={{ text: 'DMS', href: '/' }}
          items={navigationItems}
        />
      }
      notifications={
        <Flashbar
          items={notifications}
          onDismiss={({ detail }) => removeNotification(detail.id)}
        />
      }
      content={
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:documentId/versions" element={<DocumentVersionsPage />} />
          <Route 
            path="/vendor" 
            element={
              user?.groups.includes('Vendor') 
                ? <VendorDashboardPage /> 
                : <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/users" 
            element={
              user?.groups.includes('Admin') || user?.groups.includes('Vendor') 
                ? <UsersPage /> 
                : <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/audit" 
            element={
              user?.groups.includes('Admin') 
                ? <AuditPage /> 
                : <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/health" 
            element={
              user?.groups.includes('Admin') 
                ? <SystemHealthPage /> 
                : <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/debug" 
            element={
              user?.groups.includes('Admin') 
                ? <DebugPage /> 
                : <Navigate to="/" replace />
            } 
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      }
      toolsHide
      navigationOpen
    >
      <div id="header">
        <TopNavigation
          identity={{
            href: '/',
            title: 'Document Management System',
          }}
          utilities={[
            {
              type: 'menu-dropdown',
              text: user?.username || 'User',
              description: user?.email,
              iconName: 'user-profile',
              items: [
                { id: 'profile', text: 'Profile' },
                { id: 'logout', text: 'Sign out' },
              ],
              onItemClick: ({ detail }) => {
                if (detail.id === 'logout') {
                  authService.logout();
                } else if (detail.id === 'profile') {
                  window.location.href = '/profile';
                }
              },
            },
          ]}
        />
      </div>
    </AppLayout>
  );
}

export default App;
