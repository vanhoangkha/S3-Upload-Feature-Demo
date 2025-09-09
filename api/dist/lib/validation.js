"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditQuerySchema = exports.listUsersSchema = exports.updateRolesSchema = exports.createUserSchema = exports.presignDownloadSchema = exports.presignUploadSchema = exports.listDocumentsSchema = exports.updateDocumentSchema = exports.createDocumentSchema = exports.validateInput = void 0;
const zod_1 = require("zod");
const errors_1 = require("./errors");
const validateInput = (schema, input) => {
    try {
        return schema.parse(input);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            throw new errors_1.BadRequestError('Validation failed', error.errors);
        }
        throw error;
    }
};
exports.validateInput = validateInput;
exports.createDocumentSchema = zod_1.z.object({
    filename: zod_1.z.string().min(1).max(255),
    contentType: zod_1.z.string().min(1),
    size: zod_1.z.number().positive().optional(),
    checksum: zod_1.z.string().min(1).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional().default([])
});
exports.updateDocumentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
});
exports.listDocumentsSchema = zod_1.z.object({
    scope: zod_1.z.enum(['me', 'vendor']).default('me'),
    q: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    limit: zod_1.z.number().min(1).max(100).default(20),
    cursor: zod_1.z.string().optional(),
    includeDeleted: zod_1.z.boolean().default(false)
});
exports.presignUploadSchema = zod_1.z.object({
    documentId: zod_1.z.string().uuid().optional(),
    version: zod_1.z.number().positive().default(1),
    filename: zod_1.z.string().min(1),
    contentType: zod_1.z.string().min(1)
});
exports.presignDownloadSchema = zod_1.z.object({
    documentId: zod_1.z.string().min(1)
});
exports.createUserSchema = zod_1.z.object({
    usernameOrEmail: zod_1.z.string().email(),
    vendor_id: zod_1.z.string().min(1),
    groups: zod_1.z.array(zod_1.z.enum(['Admin', 'Vendor', 'User'])).default(['User'])
});
exports.updateRolesSchema = zod_1.z.object({
    vendor_id: zod_1.z.string().min(1).optional(),
    groups: zod_1.z.array(zod_1.z.enum(['Admin', 'Vendor', 'User']))
});
exports.listUsersSchema = zod_1.z.object({
    limit: zod_1.z.number().min(1).max(60).default(20),
    nextToken: zod_1.z.string().optional()
});
exports.auditQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    actor: zod_1.z.string().optional(),
    action: zod_1.z.string().optional(),
    limit: zod_1.z.number().min(1).max(100).default(50)
});
