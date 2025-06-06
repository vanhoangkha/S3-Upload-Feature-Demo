import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { DocumentsPage, DocumentDetailPage, UploadPage } from './pages';

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/documents" replace />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:userId/:fileName" element={<DocumentDetailPage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
