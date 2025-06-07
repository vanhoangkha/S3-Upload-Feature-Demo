export interface Document {
  user_id: string;  // Hash key
  file: string;     // Range key (filename or file identifier)
  id?: string;      // Additional unique identifier
  title: string;
  description?: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  bucket?: string;  // S3 bucket name
}

export interface PresignedUrlResponse {
  uploadUrl?: string;
  downloadUrl: string;
  s3Key: string;
  uploadType: 'simple' | 'multipart';
  uploadId?: string;
  parts?: MultipartUploadPart[];
}

export interface MultipartUploadPart {
  partNumber: number;
  uploadUrl: string;
}

export interface CompletedPart {
  partNumber: number;
  etag: string;
}

export interface CompleteMultipartUploadRequest {
  uploadId: string;
  s3Key: string;
  parts: CompletedPart[];
}

export interface UploadStatusResponse {
  status: 'pending' | 'completed' | 'failed' | 'aborted';
  uploadId?: string;
  s3Key: string;
  completedParts?: CompletedPart[];
}

export interface ListDocumentsResponse {
  documents: Document[];
  nextToken?: string;
}

export interface CreateDocumentRequest {
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  user_id: string;
}

// Document update functionality has been removed - viewing and downloading only

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DocumentFormData {
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  user_id: string;
  s3Key: string;
  folderPath?: string;
}

export interface DocumentListParams {
  user_id?: string;
  limit?: number;
  nextToken?: string;
}

export interface FolderItem {
  name: string;
  path: string;
  type: 'folder' | 'file';
  document?: Document;
}

export interface FolderStructure {
  currentPath: string;
  folders: FolderItem[];
  files: FolderItem[];
}

export interface S3FolderItem {
  name: string;
  type: 'folder' | 'file';
  path?: string;
  size?: number;
  lastModified?: string;
  s3Key?: string;
}

export interface S3FolderListResponse {
  currentPath: string;
  folders: S3FolderItem[];
  files: S3FolderItem[];
}
