import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand
} from '@aws-sdk/client-s3';
import { s3Client, config } from '../utils/aws-config';
import {
  PresignedUrlResponse,
  MultipartUploadResponse,
  MultipartUploadInitResponse,
  CompleteMultipartUploadRequest,
  CompletedPart,
  UploadStatusResponse,
  MultipartUploadPart
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export class S3Service {
  // Threshold for multipart upload (1GB - most files will use simple upload)
  private readonly MULTIPART_THRESHOLD = 1024 * 1024 * 1024;
  // Size of each part for multipart upload (100MB)
  private readonly PART_SIZE = 100 * 1024 * 1024;

  async generatePresignedUrls(
    fileName: string,
    mimeType: string,
    user_id: string,
    fileSize?: number
  ): Promise<MultipartUploadResponse> {
    // Use the format: protected/user_id/filename (following your example)
    const s3Key = `protected/${user_id}/${fileName}`;

    // Determine if we should use multipart upload
    const useMultipart = fileSize && fileSize > this.MULTIPART_THRESHOLD;

    if (useMultipart) {
      return this.initializeMultipartUpload(s3Key, mimeType, fileSize!);
    } else {
      return this.generateSimpleUploadUrl(s3Key, mimeType);
    }
  }

  private async generateSimpleUploadUrl(s3Key: string, mimeType: string): Promise<MultipartUploadResponse> {
    // Generate presigned URL for simple upload
    const putCommand = new PutObjectCommand({
      Bucket: config.documentStoreBucketName,
      Key: s3Key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: config.presignedUrlExpiry,
    });

    // Generate presigned URL for download
    const downloadUrl = await this.getDownloadUrl(s3Key);

    return {
      uploadUrl,
      downloadUrl,
      s3Key,
      uploadType: 'simple'
    };
  }

  private async initializeMultipartUpload(
    s3Key: string,
    mimeType: string,
    fileSize: number
  ): Promise<MultipartUploadResponse> {
    // Create multipart upload
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: config.documentStoreBucketName,
      Key: s3Key,
      ContentType: mimeType,
    });

    const createResponse = await s3Client.send(createCommand);
    const uploadId = createResponse.UploadId!;

    // Calculate number of parts
    const numParts = Math.ceil(fileSize / this.PART_SIZE);
    const parts: MultipartUploadPart[] = [];

    // Generate presigned URLs for each part
    for (let partNumber = 1; partNumber <= numParts; partNumber++) {
      const uploadPartCommand = new UploadPartCommand({
        Bucket: config.documentStoreBucketName,
        Key: s3Key,
        PartNumber: partNumber,
        UploadId: uploadId,
      });

      const partUploadUrl = await getSignedUrl(s3Client, uploadPartCommand, {
        expiresIn: config.presignedUrlExpiry,
      });

      parts.push({
        partNumber,
        uploadUrl: partUploadUrl,
      });
    }

    // Generate download URL
    const downloadUrl = await this.getDownloadUrl(s3Key);

    return {
      downloadUrl,
      s3Key,
      uploadType: 'multipart',
      uploadId,
      parts
    };
  }

  async completeMultipartUpload(request: CompleteMultipartUploadRequest): Promise<boolean> {
    try {
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: config.documentStoreBucketName,
        Key: request.s3Key,
        UploadId: request.uploadId,
        MultipartUpload: {
          Parts: request.parts.map(part => ({
            ETag: part.etag,
            PartNumber: part.partNumber,
          })),
        },
      });

      await s3Client.send(completeCommand);
      return true;
    } catch (error) {
      console.error('Error completing multipart upload:', error);
      return false;
    }
  }

  async abortMultipartUpload(uploadId: string, s3Key: string): Promise<boolean> {
    try {
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: config.documentStoreBucketName,
        Key: s3Key,
        UploadId: uploadId,
      });

      await s3Client.send(abortCommand);
      return true;
    } catch (error) {
      console.error('Error aborting multipart upload:', error);
      return false;
    }
  }

  async getUploadStatus(uploadId: string, s3Key: string): Promise<UploadStatusResponse> {
    try {
      const listPartsCommand = new ListPartsCommand({
        Bucket: config.documentStoreBucketName,
        Key: s3Key,
        UploadId: uploadId,
      });

      const response = await s3Client.send(listPartsCommand);

      const completedParts: CompletedPart[] = response.Parts?.map(part => ({
        partNumber: part.PartNumber!,
        etag: part.ETag!,
      })) || [];

      return {
        status: 'pending',
        uploadId,
        s3Key,
        completedParts,
      };
    } catch (error) {
      console.error('Error getting upload status:', error);
      return {
        status: 'failed',
        s3Key,
      };
    }
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

  async checkObjectExists(s3Key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: config.documentStoreBucketName,
        Key: s3Key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
}
