import React, { useState, useEffect } from 'react';
import {
  View,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Badge,
  Text,
  Flex,
  Menu,
  MenuItem,
  SearchField,
  Pagination,
  Loader,
  Alert
} from '@aws-amplify/ui-react';
import { apiClient, Document } from '../lib/api';

interface AmplifyDocumentTableProps {
  scope: 'me' | 'vendor';
  filters?: any;
}

export const AmplifyDocumentTable: React.FC<AmplifyDocumentTableProps> = ({ scope, filters }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    loadDocuments();
  }, [scope, filters]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.listDocuments();
      setDocuments(response.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      const response = await apiClient.getDownloadUrl(documentId);
      window.open(response.url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await apiClient.deleteDocument(documentId);
      await loadDocuments(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <View textAlign="center" padding="large">
        <Loader size="large" />
        <Text>Loading documents...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <Alert variation="error" hasIcon>
        <Text fontWeight="bold">Error loading documents</Text>
        <Text>{error}</Text>
        <Button onClick={loadDocuments} size="small" marginTop="small">
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <View>
      <Flex direction="row" justifyContent="space-between" alignItems="center" marginBottom="medium">
        <SearchField
          label="Search documents"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
        />
        <Button onClick={loadDocuments} size="small">
          Refresh
        </Button>
      </Flex>

      {filteredDocuments.length === 0 ? (
        <View textAlign="center" padding="large">
          <Text color="font.secondary">
            {searchTerm ? 'No documents match your search.' : 'No documents found. Upload your first document to get started.'}
          </Text>
        </View>
      ) : (
        <>
          <Table variation="striped">
            <TableHead>
              <TableRow>
                <TableCell as="th">Name</TableCell>
                <TableCell as="th">Size</TableCell>
                <TableCell as="th">Modified</TableCell>
                <TableCell as="th">Status</TableCell>
                <TableCell as="th">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.document_id}>
                  <TableCell>
                    <Flex direction="column">
                      <Text fontWeight="bold">{doc.name}</Text>
                      {doc.tags && doc.tags.length > 0 && (
                        <Flex direction="row" gap="xs" marginTop="xs">
                          {doc.tags.map((tag) => (
                            <Badge key={tag} size="small" variation="info">
                              {tag}
                            </Badge>
                          ))}
                        </Flex>
                      )}
                    </Flex>
                  </TableCell>
                  <TableCell>{formatFileSize(doc.size)}</TableCell>
                  <TableCell>{formatDate(doc.updated_at)}</TableCell>
                  <TableCell>
                    <Badge 
                      variation={doc.deleted_at ? "error" : "success"}
                      size="small"
                    >
                      {doc.deleted_at ? "Deleted" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Flex direction="row" gap="xs">
                      <Button
                        size="small"
                        onClick={() => handleDownload(doc.document_id)}
                        disabled={!!doc.deleted_at}
                      >
                        Download
                      </Button>
                      <Button
                        size="small"
                        variation="destructive"
                        onClick={() => handleDelete(doc.document_id)}
                        disabled={!!doc.deleted_at}
                      >
                        Delete
                      </Button>
                    </Flex>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredDocuments.length > 10 && (
            <Flex justifyContent="center" marginTop="medium">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredDocuments.length / 10)}
                onNext={() => setCurrentPage(currentPage + 1)}
                onPrevious={() => setCurrentPage(currentPage - 1)}
                onChange={(page) => setCurrentPage(page)}
              />
            </Flex>
          )}
        </>
      )}
    </View>
  );
};
