"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listObjectVersions = exports.generatePresignedDownloadUrl = exports.generatePresignedUploadUrl = exports.generateS3Key = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_s3_2 = require("@aws-sdk/client-s3");
const s3Client = new client_s3_1.S3Client({ region: 'us-east-1' });
const DOC_BUCKET = process.env.DOC_BUCKET || 'dms-dev-docs';
const KMS_KEY_ID = process.env.KMS_KEY_ID || '';
const generateS3Key = (vendorId, userId, documentId, version, filename) => {
    return `tenant/${vendorId}/user/${userId}/${documentId}/v${version}/${filename}`;
};
exports.generateS3Key = generateS3Key;
const generatePresignedUploadUrl = async (vendorId, userId, documentId, version, filename, contentType) => {
    const key = (0, exports.generateS3Key)(vendorId, userId, documentId, version, filename);
    const command = new client_s3_2.PutObjectCommand({
        Bucket: DOC_BUCKET,
        Key: key,
        ContentType: contentType,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: KMS_KEY_ID
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 900 });
    return { url, key };
};
exports.generatePresignedUploadUrl = generatePresignedUploadUrl;
const generatePresignedDownloadUrl = async (s3Key) => {
    const command = new client_s3_2.GetObjectCommand({
        Bucket: DOC_BUCKET,
        Key: s3Key
    });
    return await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 900 });
};
exports.generatePresignedDownloadUrl = generatePresignedDownloadUrl;
const listObjectVersions = async (vendorId, userId, documentId) => {
    const prefix = `tenant/${vendorId}/user/${userId}/${documentId}/`;
    const command = new client_s3_1.ListObjectVersionsCommand({
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
exports.listObjectVersions = listObjectVersions;
const extractVersionFromKey = (key) => {
    const match = key.match(/\/v(\d+)\//);
    return match ? parseInt(match[1], 10) : 1;
};
