import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentService } from '../services/documentService';
import { useAuth } from '../components/AuthProvider';
import { Document } from '../types';

// Query Keys - centralized for consistency
export const documentKeys = {
  all: ['documents'] as const,
  folderContents: (folderPath?: string) => ['documents', 'folders', folderPath || 'root'] as const,
  document: (s3Key: string) => ['documents', 'detail', s3Key] as const,
  documents: (filters?: any) => ['documents', 'list', filters] as const,
};

// Hook for folder contents (folders + files)
export const useFolderContents = (folderPath?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: documentKeys.folderContents(folderPath),
    queryFn: async () => {
      if (!user?.idToken) {
        throw new Error('Authentication required');
      }
      return DocumentService.listFolderContents(folderPath, user.idToken);
    },
    enabled: !!user?.idToken,
    staleTime: 2 * 60 * 1000, // 2 minutes - folder contents can change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for specific document details
export const useDocument = (s3Key?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: documentKeys.document(s3Key || ''),
    queryFn: async () => {
      if (!user?.idToken || !s3Key) {
        throw new Error('Authentication required or missing s3Key');
      }
      return DocumentService.getDocument(s3Key, user.idToken);
    },
    enabled: !!user?.idToken && !!s3Key,
    staleTime: 10 * 60 * 1000, // 10 minutes - document details don't change often
  });
};

// Hook for document list (legacy support)
export const useDocuments = (params?: any) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: documentKeys.documents(params),
    queryFn: async () => {
      if (!user?.idToken) {
        throw new Error('Authentication required');
      }
      return DocumentService.listDocuments(params, user.idToken);
    },
    enabled: !!user?.idToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation for deleting documents
export const useDeleteDocuments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documents: Document[]) => {
      if (!user?.idToken) {
        throw new Error('Authentication required');
      }

      // Delete all documents
      for (const doc of documents) {
        await DocumentService.deleteDocument(doc.s3Key, user.idToken);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch folder contents for all cached folders
      queryClient.invalidateQueries({
        queryKey: documentKeys.all,
      });
    },
  });
};

// Mutation for creating folders
export const useCreateFolder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      folderName,
      parentFolderPath
    }: {
      folderName: string;
      parentFolderPath?: string;
    }) => {
      if (!user?.idToken) {
        throw new Error('Authentication required');
      }
      return DocumentService.createFolderOptimized(folderName, parentFolderPath, user.idToken);
    },
    onSuccess: (data, variables) => {
      // Invalidate the parent folder's contents
      queryClient.invalidateQueries({
        queryKey: documentKeys.folderContents(variables.parentFolderPath),
      });

      // Also invalidate the root if we're creating in a subfolder
      if (variables.parentFolderPath) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.folderContents(),
        });
      }
    },
  });
};

// Mutation for downloading documents
export const useDownloadDocument = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (s3Key: string) => {
      if (!user?.idToken) {
        throw new Error('Authentication required');
      }
      const downloadUrl = await DocumentService.getDownloadUrl(s3Key, user.idToken);
      // Open download in new tab
      window.open(downloadUrl, '_blank');
      return downloadUrl;
    },
  });
};

// Hook to prefetch folder contents (for better navigation UX)
export const usePrefetchFolder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return (folderPath?: string) => {
    if (user?.idToken) {
      queryClient.prefetchQuery({
        queryKey: documentKeys.folderContents(folderPath),
        queryFn: () => DocumentService.listFolderContents(folderPath, user.idToken!),
        staleTime: 2 * 60 * 1000,
      });
    }
  };
};

// Hook to get cached folder data without triggering a request
export const useCachedFolderContents = (folderPath?: string) => {
  const queryClient = useQueryClient();

  return queryClient.getQueryData(documentKeys.folderContents(folderPath));
};

// Hook to manually update cache (optimistic updates)
export const useUpdateFolderCache = () => {
  const queryClient = useQueryClient();

  return {
    addDocument: (folderPath: string | undefined, document: Document) => {
      queryClient.setQueryData(
        documentKeys.folderContents(folderPath),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            files: [
              ...old.files,
              {
                name: document.file,
                path: document.s3Key,
                type: 'file' as const,
                document,
              },
            ],
          };
        }
      );
    },
    removeDocument: (folderPath: string | undefined, s3Key: string) => {
      queryClient.setQueryData(
        documentKeys.folderContents(folderPath),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            files: old.files.filter((file: any) => file.document?.s3Key !== s3Key),
          };
        }
      );
    },
    addFolder: (folderPath: string | undefined, folderName: string, fullPath: string) => {
      queryClient.setQueryData(
        documentKeys.folderContents(folderPath),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            folders: [
              ...old.folders,
              {
                name: folderName,
                path: fullPath,
                type: 'folder' as const,
              },
            ],
          };
        }
      );
    },
  };
};
