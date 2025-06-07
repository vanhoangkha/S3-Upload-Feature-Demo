import { filesize } from 'filesize';

export const formatFileSize = (bytes: number): string => {
  return filesize(bytes, { standard: 'jedec' }) as string;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📋';
  if (mimeType.includes('video/')) return '🎥';
  if (mimeType.includes('audio/')) return '🎵';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
  return '📄';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = [
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 100MB' };
  }

  const isAllowed = allowedTypes.some(type => {
    if (type.endsWith('*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });

  if (!isAllowed) {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
};

export const extractFolderPathFromS3Key = (s3Key: string, userId: string): string => {
  // S3 key format: protected/{user_id}/[folderPath/]filename
  const prefix = `protected/${userId}/`;
  if (!s3Key.startsWith(prefix)) return '';

  const pathAfterPrefix = s3Key.substring(prefix.length);
  const lastSlashIndex = pathAfterPrefix.lastIndexOf('/');

  if (lastSlashIndex === -1) return ''; // File is in root
  return pathAfterPrefix.substring(0, lastSlashIndex);
};

export const getFolderStructure = (documents: any[], currentFolderPath: string = ''): any => {
  const folders = new Set<string>();
  const files: any[] = [];

  documents.forEach(doc => {
    // Skip folder metadata files
    if (doc.file === '.folder_metadata' || doc.file === '.folder_placeholder') return;

    const folderPath = extractFolderPathFromS3Key(doc.s3Key, doc.user_id);

    if (currentFolderPath === '') {
      // We're in root directory
      if (folderPath === '') {
        // File is directly in root
        files.push({
          name: doc.file,
          path: '',
          type: 'file',
          document: doc
        });
      } else {
        // File is in a subfolder, show the top-level folder
        const topLevelFolder = folderPath.split('/')[0];
        folders.add(topLevelFolder);
      }
    } else {
      // We're in a specific folder
      if (folderPath === currentFolderPath) {
        // File is directly in current folder
        files.push({
          name: doc.file,
          path: currentFolderPath,
          type: 'file',
          document: doc
        });
      } else if (folderPath.startsWith(currentFolderPath + '/')) {
        // File is in a subfolder of current folder
        const remainingPath = folderPath.substring(currentFolderPath.length + 1);
        const nextFolderName = remainingPath.split('/')[0];
        const nextFolderPath = `${currentFolderPath}/${nextFolderName}`;
        folders.add(nextFolderPath);
      }
    }
  });

  const folderItems = Array.from(folders).map(folderPath => {
    const folderName = folderPath.split('/').pop() || '';
    return {
      name: folderName,
      path: folderPath,
      type: 'folder' as const
    };
  });

  return {
    currentPath: currentFolderPath,
    folders: folderItems.sort((a, b) => a.name.localeCompare(b.name)),
    files: files.sort((a, b) => a.name.localeCompare(b.name))
  };
};

export const getBreadcrumbs = (currentPath: string): Array<{ name: string, path: string }> => {
  if (!currentPath) return [{ name: '🏠 My Documents', path: '' }];

  const parts = currentPath.split('/');
  const breadcrumbs = [{ name: '🏠 My Documents', path: '' }];

  let path = '';
  parts.forEach(part => {
    path = path ? `${path}/${part}` : part;
    breadcrumbs.push({ name: part, path });
  });

  return breadcrumbs;
};
