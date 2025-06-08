import axios from 'axios';
import {
  Document,
  DocumentCreateData,
  DocumentListParams,
  PresignedUrlResponse,
  ApiResponse,
  MultipartUploadPart,
  S3FolderListResponse
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const createAuthenticatedApi = (token?: string) => {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return axios.create({
    baseURL: API_BASE_URL,
    headers,
  });
};

// Default api instance for backwards compatibility
const api = createAuthenticatedApi();

export class DocumentService {
  // Set authentication token for all subsequent requests
  static setAuthToken(token: string) {
    api.defaults.headers.Authorization = `Bearer ${token}`;
  }

  // Clear authentication token
  static clearAuthToken() {
    delete api.defaults.headers.Authorization;
  }

  // Generate presigned URLs for file upload
  static async getPresignedUrl(fileName: string, mimeType: string, fileSize?: number, folderPath?: string, token?: string): Promise<PresignedUrlResponse> {
    const apiInstance = token ? createAuthenticatedApi(token) : api;
    const response = await apiInstance.post<ApiResponse<PresignedUrlResponse>>('/presigned-url', {
      fileName,
      mimeType,
      fileSize,
      folderPath,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get presigned URL');
    }

    return response.data.data;
  }

  // Upload file to S3 using presigned URL (handles both simple and multipart uploads transparently)
  static async uploadFileToS3(file: File, presignedResponse: PresignedUrlResponse, onProgress?: (progress: number) => void): Promise<void> {
    if (presignedResponse.uploadType === 'simple' && presignedResponse.uploadUrl) {
      // Simple upload
      await axios.put(presignedResponse.uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(progress);
          }
        },
      });
    } else if (presignedResponse.uploadType === 'multipart' && presignedResponse.parts) {
      // Multipart upload (for very large files > 1GB)
      // The backend handles the completion automatically when all parts are uploaded
      await this.uploadMultipartFile(file, presignedResponse.parts, onProgress);
    } else {
      throw new Error('Invalid upload response format');
    }
  }

  // Upload file using multipart upload (simplified)
  static async uploadMultipartFile(
    file: File,
    parts: MultipartUploadPart[],
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const PART_SIZE = 100 * 1024 * 1024; // 100MB per part (matches backend)
    let uploadedBytes = 0;

    for (const part of parts) {
      const start = (part.partNumber - 1) * PART_SIZE;
      const end = Math.min(start + PART_SIZE, file.size);
      const fileChunk = file.slice(start, end);

      try {
        await axios.put(part.uploadUrl, fileChunk, {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        });

        uploadedBytes += fileChunk.size;

        if (onProgress) {
          const progress = (uploadedBytes / file.size) * 100;
          onProgress(progress);
        }
      } catch (error) {
        throw error;
      }
    }
  }

  // Complete upload process: get presigned URL, upload file, create document record
  static async uploadDocument(
    file: File,
    documentData: Omit<DocumentCreateData, 'fileName' | 'mimeType' | 'fileSize' | 's3Key'>,
    onProgress?: (progress: number) => void,
    token?: string
  ): Promise<Document> {
    try {
      // Step 1: Get presigned URL(s)
      const presignedResponse = await this.getPresignedUrl(
        file.name,
        file.type,
        file.size,
        documentData.folderPath,
        token
      );

      // Step 2: Upload file to S3 (handles both simple and multipart automatically)
      await this.uploadFileToS3(file, presignedResponse, onProgress);

      // Step 3: Create document record in database
      const documentPayload: DocumentCreateData = {
        ...documentData,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        s3Key: presignedResponse.s3Key,
      };

      const document = await this.createDocument(documentPayload, token);

      return document;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  // Create document metadata record
  static async createDocument(documentData: DocumentCreateData, token?: string): Promise<Document> {
    const apiInstance = token ? createAuthenticatedApi(token) : api;
    const response = await apiInstance.post<ApiResponse<Document>>('', documentData);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create document');
    }

    return response.data.data;
  }

  // List documents
  static async listDocuments(params: DocumentListParams = {}, token?: string): Promise<{ documents: Document[]; nextToken?: string }> {
    const searchParams = new URLSearchParams();

    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.nextToken) searchParams.append('nextToken', params.nextToken);

    const apiInstance = token ? createAuthenticatedApi(token) : api;
    const response = await apiInstance.get<ApiResponse<{ documents: Document[]; nextToken?: string }>>(`?${searchParams}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch documents');
    }

    return response.data.data;
  }

  // Get specific document
  static async getDocument(fileName: string, token?: string): Promise<Document> {
    // URL encode the fileName to handle S3 keys with forward slashes
    const encodedFileName = encodeURIComponent(fileName);
    const apiInstance = token ? createAuthenticatedApi(token) : api;
    const response = await apiInstance.get<ApiResponse<Document>>(`/${encodedFileName}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch document');
    }

    return response.data.data;
  }

  // Get download URL
  static async getDownloadUrl(fileName: string, token?: string): Promise<string> {
    // URL encode the fileName to handle S3 keys with forward slashes
    const encodedFileName = encodeURIComponent(fileName);
    const apiInstance = token ? createAuthenticatedApi(token) : api;
    const response = await apiInstance.get<ApiResponse<{ downloadUrl: string }>>(`/${encodedFileName}/download`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get download URL');
    }

    return response.data.data.downloadUrl;
  }

  // Delete document
  static async deleteDocument(fileName: string, token?: string): Promise<void> {
    // URL encode the fileName to handle S3 keys with forward slashes
    const encodedFileName = encodeURIComponent(fileName);
    const apiInstance = token ? createAuthenticatedApi(token) : api;
    const response = await apiInstance.delete<ApiResponse<void>>(`/${encodedFileName}`);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete document');
    }
  }

  // OPTIMIZED: Create folder using DynamoDB-first approach
  static async createFolderOptimized(folderName: string, parentFolderPath?: string, token?: string): Promise<{
    id: string;
    folderName: string;
    folderPath: string;
    message: string;
  }> {
    const apiInstance = token ? createAuthenticatedApi(token) : api;
    const response = await apiInstance.post<ApiResponse<{
      id: string;
      folderName: string;
      folderPath: string;
      message: string;
    }>>('/folders', {
      folderName,
      parentFolderPath: parentFolderPath || '',
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create folder');
    }

    return response.data.data;
  }

  // LEGACY: Create folder (S3-based - kept for backward compatibility)
  static async createFolder(folderPath: string, token?: string): Promise<{ folderPath: string; message: string }> {
    const apiInstance = token ? createAuthenticatedApi(token) : api;
    const response = await apiInstance.post<ApiResponse<{ folderPath: string; message: string }>>('/folders', {
      folderPath,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create folder');
    }

    return response.data.data;
  }

  // OPTIMIZED: List folders and files using DynamoDB-first approach
  static async listFolderContents(folderPath?: string, token?: string): Promise<{
    folders: { name: string; path: string; type: 'folder' }[];
    files: { name: string; path: string; type: 'file'; document?: Document }[];
    currentPath: string;
  }> {
    const searchParams = new URLSearchParams();
    if (folderPath && folderPath.trim()) {
      searchParams.append('path', folderPath);
    }

    const url = `/folders?${searchParams}`;
    const apiInstance = token ? createAuthenticatedApi(token) : api;
    const response = await apiInstance.get<ApiResponse<{
      folders: { name: string; path: string; type: 'folder' }[];
      files: { name: string; path: string; type: 'file'; document?: Document }[];
      currentPath: string;
    }>>(url);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to list folder contents');
    }

    return response.data.data;
  }

  // LEGACY: List folders and files (S3-based - kept for backward compatibility)
  static async listFolders(folderPath?: string, token?: string): Promise<S3FolderListResponse> {
    const searchParams = new URLSearchParams();
    if (folderPath && folderPath.trim()) {
      searchParams.append('path', folderPath);
    }

    const url = `/folders${searchParams.toString() ? `?${searchParams}` : ''}`;
    const apiInstance = token ? createAuthenticatedApi(token) : api;
    const response = await apiInstance.get<ApiResponse<S3FolderListResponse>>(url);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to list folders');
    }

    return response.data.data;
  }

  // Check API health
  static async checkHealth(): Promise<boolean> {
    try {
      // Get base URL without the /api/documents suffix for health check
      const healthUrl = API_BASE_URL.replace('/vib-documents-function/api/documents', '/vib-documents-function') + '/health';
      const response = await axios.get(healthUrl);
      return response.data.success || response.status === 200;
    } catch {
      return false;
    }
  }
}
