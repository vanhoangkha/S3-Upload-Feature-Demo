import { z } from 'zod';
import { BadRequestError } from './errors';

export const validateInput = <T>(schema: z.ZodSchema<T>, input: any): T => {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new BadRequestError('Validation failed', error.errors);
    }
    throw error;
  }
};

// Document schemas
export const createDocumentSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  size: z.number().positive().optional(),
  checksum: z.string().min(1).optional(),
  tags: z.array(z.string()).optional().default([])
});

export const updateDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  tags: z.array(z.string()).optional()
});

export const listDocumentsSchema = z.object({
  scope: z.enum(['me', 'vendor']).default('me'),
  q: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  includeDeleted: z.boolean().default(false)
});

// Presign schemas
export const presignUploadSchema = z.object({
  documentId: z.string().uuid().optional(),
  version: z.number().positive().default(1),
  filename: z.string().min(1),
  contentType: z.string().min(1)
});

export const presignDownloadSchema = z.object({
  documentId: z.string().min(1)
});

// Admin schemas
export const createUserSchema = z.object({
  usernameOrEmail: z.string().email(),
  vendor_id: z.string().min(1),
  groups: z.array(z.enum(['Admin', 'Vendor', 'User'])).default(['User'])
});

export const updateRolesSchema = z.object({
  vendor_id: z.string().min(1).optional(),
  groups: z.array(z.enum(['Admin', 'Vendor', 'User']))
});

export const listUsersSchema = z.object({
  limit: z.number().min(1).max(60).default(20),
  nextToken: z.string().optional()
});

export const auditQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  actor: z.string().optional(),
  action: z.string().optional(),
  limit: z.number().min(1).max(100).default(50)
});
