"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("./lib/logger");
const whoAmI_1 = require("./handlers/whoAmI");
const listDocuments_1 = require("./handlers/listDocuments");
const createDocument_1 = require("./handlers/createDocument");
const getDocument_1 = require("./handlers/getDocument");
const updateDocument_1 = require("./handlers/updateDocument");
const deleteDocument_1 = require("./handlers/deleteDocument");
const restoreDocument_1 = require("./handlers/restoreDocument");
const listVersions_1 = require("./handlers/listVersions");
const presignUpload_1 = require("./handlers/presignUpload");
const presignDownload_1 = require("./handlers/presignDownload");
const adminListUsers_1 = require("./handlers/adminListUsers");
const adminCreateUser_1 = require("./handlers/adminCreateUser");
const adminUpdateRoles_1 = require("./handlers/adminUpdateRoles");
const adminSignOut_1 = require("./handlers/adminSignOut");
const adminAudits_1 = require("./handlers/adminAudits");
const getUserDocuments_1 = require("./handlers/getUserDocuments");
const getUserProfile_1 = require("./handlers/getUserProfile");
const updateUserProfile_1 = require("./handlers/updateUserProfile");
const getVendorDocuments_1 = require("./handlers/getVendorDocuments");
const getVendorUsers_1 = require("./handlers/getVendorUsers");
const getVendorStats_1 = require("./handlers/getVendorStats");
const handler = async (event) => {
    const { httpMethod, path } = event;
    const requestId = event.requestContext.requestId;
    logger_1.logger.info('Incoming request', {
        requestId,
        httpMethod,
        path,
        sourceIp: event.requestContext.identity?.sourceIp
    });
    try {
        if (path === '/health' && httpMethod === 'GET') {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
            };
        }
        const route = `${httpMethod} ${path}`;
        switch (route) {
            case 'GET /me':
                return await (0, whoAmI_1.handler)(event);
            case 'GET /files':
                return await (0, listDocuments_1.handler)(event);
            case 'POST /files':
                return await (0, createDocument_1.handler)(event);
            case 'POST /files/presign/upload':
                return await (0, presignUpload_1.handler)(event);
            case 'POST /files/presign/download':
                return await (0, presignDownload_1.handler)(event);
            case 'GET /admin/users':
                return await (0, adminListUsers_1.handler)(event);
            case 'POST /admin/users':
                return await (0, adminCreateUser_1.handler)(event);
            case 'GET /admin/audits':
                return await (0, adminAudits_1.handler)(event);
            case 'GET /user/documents':
                return await (0, getUserDocuments_1.handler)(event);
            case 'GET /user/profile':
                return await (0, getUserProfile_1.handler)(event);
            case 'PATCH /user/profile':
                return await (0, updateUserProfile_1.handler)(event);
            case 'GET /vendor/documents':
                return await (0, getVendorDocuments_1.handler)(event);
            case 'GET /vendor/users':
                return await (0, getVendorUsers_1.handler)(event);
            case 'GET /vendor/stats':
                return await (0, getVendorStats_1.handler)(event);
            default:
                if (httpMethod === 'GET' && path.match(/^\/files\/[^\/]+$/)) {
                    return await (0, getDocument_1.handler)(event);
                }
                if (httpMethod === 'PATCH' && path.match(/^\/files\/[^\/]+$/)) {
                    return await (0, updateDocument_1.handler)(event);
                }
                if (httpMethod === 'DELETE' && path.match(/^\/files\/[^\/]+$/)) {
                    return await (0, deleteDocument_1.handler)(event);
                }
                if (httpMethod === 'POST' && path.match(/^\/files\/[^\/]+\/restore$/)) {
                    return await (0, restoreDocument_1.handler)(event);
                }
                if (httpMethod === 'GET' && path.match(/^\/files\/[^\/]+\/versions$/)) {
                    return await (0, listVersions_1.handler)(event);
                }
                if (httpMethod === 'POST' && path.match(/^\/admin\/users\/[^\/]+\/roles$/)) {
                    return await (0, adminUpdateRoles_1.handler)(event);
                }
                if (httpMethod === 'POST' && path.match(/^\/admin\/users\/[^\/]+\/signout$/)) {
                    return await (0, adminSignOut_1.handler)(event);
                }
                logger_1.logger.warn('Route not found', { requestId, route });
                return {
                    statusCode: 404,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'Not Found' })
                };
        }
    }
    catch (error) {
        logger_1.logger.error('Request failed', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Internal Server Error' })
        };
    }
};
exports.handler = handler;
