"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_1 = require("../lib/auth");
const errors_1 = require("../lib/errors");
const handler = async (event) => {
    try {
        const auth = (0, auth_1.requireAuth)(event);
        (0, auth_1.requireRole)(auth, ['Vendor', 'Admin']);
        return (0, errors_1.createSuccessResponse)({
            totalDocuments: 0,
            totalUsers: 0,
            storageUsed: 0,
            message: 'Vendor stats endpoint - implementation pending'
        });
    }
    catch (error) {
        return (0, errors_1.createErrorResponse)(error);
    }
};
exports.handler = handler;
