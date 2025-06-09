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
  // New fields for folder structure
  itemType: 'file' | 'folder';  // Distinguish between files and folders
  folderPath: string;  // Parent folder path (e.g., "documents/subfolder" or "" for root)
  isActive?: boolean;  // For soft deletes
}

export interface CreateDocumentRequest {
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  user_id: string;
  folderPath?: string;  // Add folder path to creation request
}

export interface CreateFolderRequest {
  user_id: string;
  folderName: string;
  parentPath?: string;  // Parent folder path
}

export interface FolderItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  document?: Document;  // For files, reference to document metadata
}

export interface FolderListResponse {
  currentPath: string;
  folders: FolderItem[];
  files: FolderItem[];
}

// Admin-specific types
export interface UserStats {
  user_id: string;
  documentCount: number;
  lastActivity: string;
}

export interface UsersListResponse {
  users: UserStats[];
}

export interface ProtectedFolderResponse extends FolderListResponse {
  targetUserId: string;
  protectedPath: string;
}

// Document update functionality removed - edit functionality is no longer supported

export interface PresignedUrlResponse {
  uploadUrl: string;
  downloadUrl: string;
  s3Key: string;
  uploadType: 'simple' | 'multipart';
}

export interface MultipartUploadInitResponse {
  uploadId: string;
  s3Key: string;
  parts: MultipartUploadPart[];
  uploadType: 'multipart';
}

export interface MultipartUploadPart {
  partNumber: number;
  uploadUrl: string;
}

export interface MultipartUploadResponse {
  uploadUrl?: string;
  downloadUrl: string;
  s3Key: string;
  uploadType: 'simple' | 'multipart';
  uploadId?: string;
  parts?: MultipartUploadPart[];
}

export interface CompleteMultipartUploadRequest {
  uploadId: string;
  s3Key: string;
  parts: CompletedPart[];
}

export interface CompletedPart {
  partNumber: number;
  etag: string;
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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
