import React, { useState } from 'react';
import {
  Table,
  Button,
  SpaceBetween,
  TextFilter,
  Pagination,
  CollectionPreferences,
  Modal,
  Box,
  StatusIndicator,
  FormField,
  Input,
  ButtonDropdown
} from '@cloudscape-design/components';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Document } from '../types';

interface DocumentTableProps {
  scope: 'me' | 'vendor';
  filters?: {
    q?: string;
    tags?: string[];
    includeDeleted?: boolean;
  };
  customData?: Document[];
  isLoading?: boolean;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({ 
  scope, 
  filters = {}, 
  customData,
  isLoading: customLoading 
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<Document[]>([]);
  const [filteringText, setFilteringText] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Use custom data if provided, otherwise fetch from API
  const { data: documentsData, isLoading: queryLoading } = useQuery(
    ['documents', scope, filteringText, currentPageIndex, pageSize, filters],
    () => {
      if (scope === 'me') {
        return apiClient.getUserDocuments({
          q: filters.q || filteringText,
          tags: filters.tags,
          limit: pageSize,
          includeDeleted: filters.includeDeleted
        });
      } else if (scope === 'vendor') {
        return apiClient.getVendorDocuments({
          q: filters.q || filteringText,
          tags: filters.tags,
          limit: pageSize,
          includeDeleted: filters.includeDeleted
        });
      } else {
        return apiClient.listDocuments({
          scope,
          q: filters.q || filteringText,
          tags: filters.tags,
          limit: pageSize,
          includeDeleted: filters.includeDeleted
        });
      }
    },
    {
      keepPreviousData: true,
      enabled: !customData // Only fetch if no custom data provided
    }
  );

  const isLoading = customLoading || queryLoading;
  const documents = customData || documentsData?.documents || [];

  const deleteDocumentMutation = useMutation(
    (documentId: string) => apiClient.deleteDocument(documentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['documents']);
        setSelectedItems([]);
        setShowDeleteModal(false);
      }
    }
  );

  const restoreDocumentMutation = useMutation(
    (documentId: string) => apiClient.restoreDocument(documentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['documents']);
        setSelectedItems([]);
        setShowRestoreModal(false);
      }
    }
  );

  const updateDocumentMutation = useMutation(
    ({ id, data }: { id: string; data: { name?: string; tags?: string[] } }) => 
      apiClient.updateDocument(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['documents']);
        setShowEditModal(false);
        setEditingDocument(null);
      }
    }
  );

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setEditName(document.name);
    setEditTags(document.tags?.join(', ') || '');
    setShowEditModal(true);
  };

  const downloadDocument = async (document: Document) => {
    if (!user) return;
    
    try {
      setDownloadingId(document.document_id);
      const { url } = await apiClient.presignDownload({
        vendorId: user.vendorId,
        userId: user.userId,
        s3Key: document.s3_key
      });
      
      // Open download URL in new tab
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  const columnDefinitions = [
    {
      id: 'name',
      header: 'Name',
      cell: (item: Document) => (
        <Button
          variant="link"
          onClick={() => downloadDocument(item)}
          loading={downloadingId === item.document_id}
        >
          {item.name}
        </Button>
      ),
      sortingField: 'name'
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: Document) => (
        <ButtonDropdown
          items={[
            { id: 'edit', text: 'Edit', disabled: !!item.deleted_at },
            { id: 'versions', text: 'Versions' },
            { id: 'download', text: 'Download' },
            { id: 'delete', text: item.deleted_at ? 'Restore' : 'Delete' }
          ]}
          onItemClick={({ detail }) => {
            if (detail.id === 'edit') handleEdit(item);
            if (detail.id === 'versions') navigate(`/document/${item.document_id}/versions`);
            if (detail.id === 'download') downloadDocument(item);
            if (detail.id === 'delete') {
              setSelectedItems([item]);
              if (item.deleted_at) {
                setShowRestoreModal(true);
              } else {
                setShowDeleteModal(true);
              }
            }
          }}
        >
          Actions
        </ButtonDropdown>
      )
    },
    {
      id: 'size',
      header: 'Size',
      cell: (item: Document) => formatFileSize(item.size),
      sortingField: 'size'
    },
    {
      id: 'updated_at',
      header: 'Modified',
      cell: (item: Document) => new Date(item.updated_at).toLocaleDateString(),
      sortingField: 'updated_at'
    },
    {
      id: 'owner',
      header: 'Owner',
      cell: (item: Document) => item.owner_user_id,
      sortingField: 'owner_user_id'
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: Document) => (
        <StatusIndicator type={item.deleted_at ? 'error' : 'success'}>
          {item.deleted_at ? 'Deleted' : 'Active'}
        </StatusIndicator>
      )
    }
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <SpaceBetween direction="vertical" size="l">
      <Table
        columnDefinitions={columnDefinitions}
        items={documentsData?.items || []}
        loading={isLoading}
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
        selectionType="multi"
        header={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              disabled={selectedItems.length === 0 || selectedItems.some(item => item.deleted_at)}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
            <Button
              disabled={selectedItems.length === 0 || selectedItems.some(item => !item.deleted_at)}
              onClick={() => setShowRestoreModal(true)}
            >
              Restore
            </Button>
          </SpaceBetween>
        }
        filter={
          <TextFilter
            filteringText={filteringText}
            filteringPlaceholder="Search documents..."
            onChange={({ detail }) => setFilteringText(detail.filteringText)}
          />
        }
        pagination={
          <Pagination
            currentPageIndex={currentPageIndex}
            pagesCount={Math.ceil((documentsData?.total || 0) / pageSize)}
            onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
          />
        }
        preferences={
          <CollectionPreferences
            title="Preferences"
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            pageSizePreference={{
              title: "Page size",
              options: [
                { value: 10, label: "10 documents" },
                { value: 20, label: "20 documents" },
                { value: 50, label: "50 documents" }
              ]
            }}
            onConfirm={({ detail }) => {
              setPageSize(detail.pageSize || 20);
            }}
          />
        }
      />

      {/* Delete Modal */}
      <Modal
        visible={showDeleteModal}
        onDismiss={() => setShowDeleteModal(false)}
        header="Delete documents"
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={deleteDocumentMutation.isLoading}
                onClick={() => {
                  selectedItems.forEach(item => {
                    deleteDocumentMutation.mutate(item.document_id);
                  });
                }}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        Are you sure you want to delete {selectedItems.length} document(s)?
        This action can be undone by restoring the documents.
      </Modal>

      {/* Restore Modal */}
      <Modal
        visible={showRestoreModal}
        onDismiss={() => setShowRestoreModal(false)}
        header="Restore documents"
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowRestoreModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={restoreDocumentMutation.isLoading}
                onClick={() => {
                  selectedItems.forEach(item => {
                    restoreDocumentMutation.mutate(item.document_id);
                  });
                }}
              >
                Restore
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        Are you sure you want to restore {selectedItems.length} document(s)?
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        onDismiss={() => setShowEditModal(false)}
        header="Edit document"
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={updateDocumentMutation.isLoading}
                onClick={() => {
                  if (editingDocument) {
                    updateDocumentMutation.mutate({
                      id: editingDocument.document_id,
                      data: {
                        name: editName,
                        tags: editTags.split(',').map(t => t.trim()).filter(Boolean)
                      }
                    });
                  }
                }}
              >
                Save
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween direction="vertical" size="m">
          <FormField label="Document name">
            <Input
              value={editName}
              onChange={({ detail }) => setEditName(detail.value)}
            />
          </FormField>
          <FormField label="Tags (comma-separated)">
            <Input
              value={editTags}
              onChange={({ detail }) => setEditTags(detail.value)}
              placeholder="tag1, tag2, tag3"
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
};
