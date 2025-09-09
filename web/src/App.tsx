import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AppLayout } from '@cloudscape-design/components';
import '@cloudscape-design/global-styles/index.css';

import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DrivePage } from './pages/DrivePage';
import { VendorPage } from './pages/VendorPage';
import { AdminPage } from './pages/AdminPage';
import { AuditPage } from './pages/AuditPage';
import { DocumentVersionsPage } from './pages/DocumentVersionsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { SelfRegisterPage } from './pages/SelfRegisterPage';
import { AmplifyLoginPage } from './pages/AmplifyLoginPage';
import AmplifyApp from './AmplifyApp';
import { HybridDashboard } from './pages/HybridDashboard';
import { SimpleReviewPage } from './pages/SimpleReviewPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/auth/login" element={<AmplifyLoginPage />} />
              <Route path="/login" element={<AmplifyLoginPage />} />
              <Route path="/auth/amplify" element={<AmplifyLoginPage />} />
              <Route path="/amplify/*" element={<AmplifyApp />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/request-access" element={<SelfRegisterPage />} />
              <Route path="/auth/callback" element={<LoginPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout
                      navigation={<Navigation />}
                      content={
                        <Routes>
                          <Route path="/" element={<SimpleReviewPage />} />
                          <Route 
                            path="/drive" 
                            element={
                              <ProtectedRoute requiredPermission="canViewDocuments">
                                <DrivePage />
                              </ProtectedRoute>
                            } 
                          />
                          <Route path="/review" element={<SimpleReviewPage />} />
                          <Route path="/hybrid" element={<HybridDashboard />} />
                          <Route path="/profile" element={<UserProfilePage />} />
                          <Route path="/document/:id/versions" element={<DocumentVersionsPage />} />
                          <Route 
                            path="/vendor" 
                            element={
                              <ProtectedRoute requiredPermission="canViewVendorData">
                                <VendorPage />
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/admin" 
                            element={
                              <ProtectedRoute requiredPermission="canManageUsers">
                                <AdminPage />
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/audit" 
                            element={
                              <ProtectedRoute requiredPermission="canViewAuditLogs">
                                <AuditPage />
                              </ProtectedRoute>
                            } 
                          />
                        </Routes>
                      }
                      navigationOpen={true}
                      toolsHide={true}
                    />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
