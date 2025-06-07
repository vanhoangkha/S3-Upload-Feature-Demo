// Types for folder-related functionality
export interface S3FolderItem {
  name: string;
  type: 'folder' | 'file';
  path?: string;
  size?: number;
  lastModified?: string | Date;
  s3Key?: string;
}

export interface S3FolderListResponse {
  currentPath: string;
  folders: S3FolderItem[];
  files: S3FolderItem[];
}
