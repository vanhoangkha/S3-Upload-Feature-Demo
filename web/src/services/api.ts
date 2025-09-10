import { authService } from './auth';

const API_BASE_URL = 'https://wcyez0q6t8.execute-api.us-east-1.amazonaws.com/v1';

export interface Document {
  document_id: string;
  name: string;
  size: number;
  mime: string;
  created_at: string;
  updated_at: string;
  owner_user_id: string;
  tags: string[];
  deleted_at?: string;
  versions?: DocumentVersion[];
}

export interface DocumentVersion {
  version_id: string;
  document_id: string;
  created_at: string;
  size: number;
  s3_key: string;
}

export interface User {
  username: string;
  email: string;
  vendor_id: string;
  groups: string[];
  status: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  username: string;
  vendorId: string;
  roles: string[];
  preferences?: any;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints - GET /me
  async whoAmI() {
    return this.request<UserProfile>('/me');
  }

  // Document endpoints - All real routes from infrastructure
  async listDocuments() {
    return this.request<{ items: Document[]; total: number }>('/files');
  }

  async createDocument(data: { filename: string; contentType: string; tags?: string[] }) {
    return this.request<Document>('/files', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDocument(id: string) {
    return this.request<Document>(`/files/${id}`);
  }

  async updateDocument(id: string, data: { name?: string; tags?: string[] }) {
    return this.request<void>(`/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: string) {
    return this.request<void>(`/files/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreDocument(id: string) {
    return this.request<void>(`/files/${id}/restore`, {
      method: 'POST',
    });
  }

  async getDocumentVersions(id: string) {
    return this.request<{ versions: DocumentVersion[] }>(`/files/${id}/versions`);
  }

  async getUploadUrl(data: { filename: string; contentType: string }) {
    return this.request<{ url: string; key: string; documentId: string }>('/files/presign/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDownloadUrl(documentId: string) {
    return this.request<{ url: string }>('/files/presign/download', {
      method: 'POST',
      body: JSON.stringify({ documentId }),
    });
  }

  // Admin endpoints - All real routes from infrastructure
  async listUsers() {
    return this.request<{ users: User[] }>('/admin/users');
  }

  async createUser(data: { username: string; email: string; vendor_id: string; groups: string[] }) {
    return this.request<User>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUserRoles(userId: string, roles: string[]) {
    return this.request<void>(`/admin/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roles }),
    });
  }

  async signOutUser(userId: string) {
    return this.request<void>(`/admin/users/${userId}/signout`, {
      method: 'POST',
    });
  }

  async getAuditLogs() {
    return this.request<{ logs: any[] }>('/admin/audits');
  }

  // Convenience methods for role-based access (using same endpoints)
  async getUserDocuments() {
    // Uses same endpoint as listDocuments - backend handles filtering
    return this.listDocuments();
  }

  async getVendorDocuments() {
    // Uses same endpoint as listDocuments - backend handles filtering
    return this.listDocuments();
  }

  async getVendorUsers() {
    // Uses same endpoint as listUsers - backend handles filtering
    return this.listUsers();
  }

  async getUserProfile() {
    // Uses same endpoint as whoAmI
    return this.whoAmI();
  }

  async updateUserProfile(data: { preferences?: any }) {
    // This endpoint doesn't exist in infrastructure - remove or implement
    throw new Error('User profile update not implemented in backend');
  }

  async getVendorStats() {
    // This endpoint doesn't exist in infrastructure - remove or implement
    throw new Error('Vendor stats endpoint not implemented in backend');
  }

  async health() {
    // This endpoint doesn't exist in infrastructure - remove or implement
    throw new Error('Health endpoint not implemented in backend');
  }

  async debugJWT() {
    // This endpoint doesn't exist in infrastructure - remove or implement
    throw new Error('Debug JWT endpoint not implemented in backend');
  }
}

export const apiClient = new ApiClient();
