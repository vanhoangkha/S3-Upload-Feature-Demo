import { S3Client, ListObjectVersionsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({ region: 'us-east-1' });
const DOC_BUCKET = process.env.DOC_BUCKET || 'dms-dev-docs';
const KMS_KEY_ID = process.env.KMS_KEY_ID || '';

export const generateS3Key = (
  vendorId: string,
  userId: string,
  documentId: string,
  version: number,
  filename: string
): string => {
  return `tenant/${vendorId}/user/${userId}/${documentId}/v${version}/${filename}`;
};

export const generatePresignedUploadUrl = async (
  vendorId: string,
  userId: string,
  documentId: string,
  version: number,
  filename: string,
  contentType: string
): Promise<{ url: string; key: string }> => {
  const key = generateS3Key(vendorId, userId, documentId, version, filename);
  
  const command = new PutObjectCommand({
    Bucket: DOC_BUCKET,
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: 'aws:kms',
    SSEKMSKeyId: KMS_KEY_ID
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes

  return { url, key };
};

export const generatePresignedDownloadUrl = async (
  s3Key: string
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: DOC_BUCKET,
    Key: s3Key
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes
};

export const listObjectVersions = async (
  vendorId: string,
  userId: string,
  documentId: string
) => {
  const prefix = `tenant/${vendorId}/user/${userId}/${documentId}/`;
  
  const command = new ListObjectVersionsCommand({
    Bucket: DOC_BUCKET,
    Prefix: prefix
  });

  const response = await s3Client.send(command);
  
  return (response.Versions || []).map(version => ({
    version: extractVersionFromKey(version.Key || ''),
    key: version.Key,
    size: version.Size,
    lastModified: version.LastModified,
    versionId: version.VersionId
  }));
};

const extractVersionFromKey = (key: string): number => {
  const match = key.match(/\/v(\d+)\//);
  return match ? parseInt(match[1], 10) : 1;
};
