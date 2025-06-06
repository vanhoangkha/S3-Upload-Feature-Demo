import axios from 'axios';
import { Document, DocumentFormData, DocumentListParams, PresignedUrlResponse, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class DocumentService {
  // Generate presigned URLs for file upload
  static async getPresignedUrl(fileName: string, mimeType: string, userId: string): Promise<PresignedUrlResponse> {
    const response = await api.post<ApiResponse<PresignedUrlResponse>>('/documents/presigned-url', {
      fileName,
      mimeType,
      user_id: userId,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get presigned URL');
    }

    return response.data.data;
  }

  // Upload file to S3 using presigned URL
  static async uploadFileToS3(file: File, uploadUrl: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
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
  static async listDocuments(params: DocumentListParams = {}): Promise<{ documents: Document[]; lastEvaluatedKey?: string }> {
    const searchParams = new URLSearchParams();

    if (params.user_id) searchParams.append('user_id', params.user_id);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.lastEvaluatedKey) searchParams.append('lastEvaluatedKey', params.lastEvaluatedKey);

    const response = await api.get<ApiResponse<{ documents: Document[]; lastEvaluatedKey?: string }>>(`/documents?${searchParams}`);

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
  static async updateDocument(userId: string, fileName: string, updates: Partial<DocumentFormData>): Promise<Document> {
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
