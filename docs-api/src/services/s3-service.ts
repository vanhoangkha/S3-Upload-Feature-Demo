import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, config } from '../utils/aws-config';
import { PresignedUrlResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class S3Service {
  async generatePresignedUrls(fileName: string, mimeType: string, user_id: string): Promise<PresignedUrlResponse> {
    const s3Key = `documents/${user_id}/${uuidv4()}-${fileName}`;

    // Generate presigned URL for upload
    const putCommand = new PutObjectCommand({
      Bucket: config.documentStoreBucketName,
      Key: s3Key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: config.presignedUrlExpiry,
    });

    // Generate presigned URL for download
    const getCommand = new GetObjectCommand({
      Bucket: config.documentStoreBucketName,
      Key: s3Key,
    });

    const downloadUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: config.presignedUrlExpiry,
    });

    return {
      uploadUrl,
      downloadUrl,
      s3Key,
    };
  }

  async getDownloadUrl(s3Key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: config.documentStoreBucketName,
      Key: s3Key,
    });

    return await getSignedUrl(s3Client, command, {
      expiresIn: config.presignedUrlExpiry,
    });
  }

  async deleteObject(s3Key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: config.documentStoreBucketName,
        Key: s3Key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting S3 object:', error);
      return false;
    }
  }
}
