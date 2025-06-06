export interface Document {
  user_id: string;
  file: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  uploadDate: string;
  lastModified: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  downloadUrl: string;
  s3Key: string;
}

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
}

export interface DocumentListParams {
  user_id?: string;
  limit?: number;
  lastEvaluatedKey?: string;
}
