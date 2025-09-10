// Real API client for production use
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://7o9lrh9and.execute-api.us-east-1.amazonaws.com/v1';
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
  s3_key?: string;
  pk?: string;
  sk?: string;
}

export interface UserInfo {
  userId: string;
  vendorId: string;
  roles: string[];
  email: string;
}

export interface User {
  username: string;
  email: string;
  vendor_id: string;
  groups: string[];
  status: string;
}

class ApiClient {
  private baseURL: string;
  private token: string = '';

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async whoAmI(): Promise<UserInfo> {
    return this.request<UserInfo>('/me');
  }

  // Documents
  async listDocuments(params: any = {}): Promise<{ documents: Document[] }> {
    const response = await this.request<{ items: Document[], total: number }>('/files');
    return { documents: response.items || [] };
  }

  async createDocument(data: { filename: string; contentType: string; tags?: string[] }): Promise<Document> {
    return this.request<Document>('/files', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDocument(id: string): Promise<Document> {
    return this.request<Document>(`/files/${id}`);
  }

  async updateDocument(id: string, data: { name?: string; tags?: string[] }): Promise<void> {
    return this.request<void>(`/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: string): Promise<void> {
    return this.request<void>(`/files/${id}`, {
      method: 'DELETE',
    });
  }

  async getUploadUrl(data: { documentId?: string; filename: string; contentType: string }): Promise<{ url: string; key: string; documentId: string }> {
    return this.request<{ url: string; key: string; documentId: string }>('/files/presign/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDownloadUrl(documentId: string): Promise<{ url: string }> {
    return this.request<{ url: string }>('/files/presign/download', {
      method: 'POST',
      body: JSON.stringify({ documentId }),
    });
  }

  // Admin endpoints
  async listUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/admin/users');
  }

  async createUser(data: { username: string; email: string; vendor_id: string; groups: string[] }): Promise<User> {
    return this.request<User>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUserRoles(userId: string, roles: string[]): Promise<void> {
    return this.request<void>(`/admin/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roles }),
    });
  }

  async signOutUser(userId: string): Promise<void> {
    return this.request<void>(`/admin/users/${userId}/signout`, {
      method: 'POST',
    });
  }

  async getAuditLogs(params: any = {}): Promise<{ logs: any[] }> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return this.request<{ logs: any[] }>(`/admin/audits${query ? `?${query}` : ''}`);
  }
}

export const apiClient = new ApiClient();
