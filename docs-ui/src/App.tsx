import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { AppLayout } from './components/AppLayout';
import { AuthProvider } from './components/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DocumentsPage, UploadPage, LoginPage, RegisterPage, AdminPage } from './pages';
import awsExports from './aws-exports';

// Configure Amplify
Amplify.configure(awsExports);

function App() {
  return (
    <QueryProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <Navigate to="/documents" replace />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/documents" element={
              <ProtectedRoute>
                <AppLayout>
                  <DocumentsPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/documents/*" element={
              <ProtectedRoute>
                <AppLayout>
                  <DocumentsPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <AppLayout>
                  <UploadPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AppLayout>
                  <AdminPage />
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryProvider>
  );
}

export default App;
