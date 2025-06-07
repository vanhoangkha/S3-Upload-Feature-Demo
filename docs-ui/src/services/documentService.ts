import axios from 'axios';
import {
  Document,
  DocumentFormData,
  DocumentListParams,
  PresignedUrlResponse,
  ApiResponse,
  MultipartUploadPart,
  UpdateDocumentRequest,
  S3FolderListResponse
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class DocumentService {
  // Generate presigned URLs for file upload
  static async getPresignedUrl(fileName: string, mimeType: string, userId: string, fileSize?: number, folderPath?: string): Promise<PresignedUrlResponse> {
    const response = await api.post<ApiResponse<PresignedUrlResponse>>('/documents/presigned-url', {
      fileName,
      mimeType,
      user_id: userId,
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
    documentData: Omit<DocumentFormData, 'fileName' | 'mimeType' | 'fileSize' | 's3Key'>,
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    try {
      // Step 1: Get presigned URL(s)
      const presignedResponse = await this.getPresignedUrl(
        file.name,
        file.type,
        documentData.user_id,
        file.size,
        documentData.folderPath
      );

      // Step 2: Upload file to S3 (handles both simple and multipart automatically)
      await this.uploadFileToS3(file, presignedResponse, onProgress);

      // Step 3: Create document record in database
      const documentPayload = {
        ...documentData,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        s3Key: presignedResponse.s3Key,
      };

      const document = await this.createDocument(documentPayload);

      return document;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  // Create document metadata record
  static async createDocument(documentData: DocumentFormData): Promise<Document> {
    const response = await api.post<ApiResponse<Document>>('/documents', documentData);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create document');
    }

    return response.data.data;
  }

  // List documents
  static async listDocuments(params: DocumentListParams = {}): Promise<{ documents: Document[]; nextToken?: string }> {
    const searchParams = new URLSearchParams();

    if (params.user_id) searchParams.append('user_id', params.user_id);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.nextToken) searchParams.append('nextToken', params.nextToken);

    const response = await api.get<ApiResponse<{ documents: Document[]; nextToken?: string }>>(`/documents?${searchParams}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch documents');
    }

    return response.data.data;
  }

  // Get specific document
  static async getDocument(userId: string, fileName: string): Promise<Document> {
    const response = await api.get<ApiResponse<Document>>(`/documents/${userId}/${fileName}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch document');
    }

    return response.data.data;
  }

  // Update document
  static async updateDocument(userId: string, fileName: string, updates: UpdateDocumentRequest): Promise<Document> {
    const response = await api.put<ApiResponse<Document>>(`/documents/${userId}/${fileName}`, updates);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update document');
    }

    return response.data.data;
  }

  // Get download URL
  static async getDownloadUrl(userId: string, fileName: string): Promise<string> {
    const response = await api.get<ApiResponse<{ downloadUrl: string }>>(`/documents/${userId}/${fileName}/download`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get download URL');
    }

    return response.data.data.downloadUrl;
  }

  // Delete document
  static async deleteDocument(userId: string, fileName: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/documents/${userId}/${fileName}`);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete document');
    }
  }

  // Create folder
  static async createFolder(userId: string, folderPath: string): Promise<{ folderPath: string; message: string }> {
    const response = await api.post<ApiResponse<{ folderPath: string; message: string }>>('/documents/folders', {
      folderPath,
      user_id: userId,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create folder');
    }

    return response.data.data;
  }

  // List folders and files
  static async listFolders(userId: string, folderPath?: string): Promise<S3FolderListResponse> {
    const searchParams = new URLSearchParams();
    if (folderPath && folderPath.trim()) {
      searchParams.append('path', folderPath);
    }

    const url = `/documents/folders/${userId}${searchParams.toString() ? `?${searchParams}` : ''}`;
    const response = await api.get<ApiResponse<S3FolderListResponse>>(url);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to list folders');
    }

    return response.data.data;
  }

  // Check API health
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.data.success || response.status === 200;
    } catch {
      return false;
    }
  }
}
