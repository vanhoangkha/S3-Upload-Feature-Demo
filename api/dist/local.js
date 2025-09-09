"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
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
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const createLambdaEvent = (req) => {
    return {
        httpMethod: req.method,
        path: req.path,
        pathParameters: req.params,
        queryStringParameters: req.query,
        headers: req.headers,
        body: req.body ? JSON.stringify(req.body) : null,
        isBase64Encoded: false,
        requestContext: {
            requestId: Math.random().toString(36),
            stage: 'dev',
            httpMethod: req.method,
            path: req.path,
            accountId: '123456789012',
            resourceId: 'resource',
            resourcePath: req.path,
            apiId: 'local-api'
        },
        resource: req.path,
        stageVariables: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: {}
    };
};
const lambdaContext = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'local-dev',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:local-dev',
    memoryLimitInMB: '256',
    awsRequestId: 'local-request',
    logGroupName: '/aws/lambda/local-dev',
    logStreamName: 'local-stream',
    getRemainingTimeInMillis: () => 30000,
    done: () => { },
    fail: () => { },
    succeed: () => { }
};
const handleLambda = (handler) => async (req, res) => {
    try {
        const event = createLambdaEvent(req);
        const result = await handler(event, lambdaContext);
        res.status(result.statusCode);
        if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => {
                res.set(key, value);
            });
        }
        res.send(result.body);
    }
    catch (error) {
        console.error('Handler error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
app.get('/v1/me', handleLambda(whoAmI_1.handler));
app.get('/v1/files', handleLambda(listDocuments_1.handler));
app.post('/v1/files', handleLambda(createDocument_1.handler));
app.get('/v1/files/:id', handleLambda(getDocument_1.handler));
app.patch('/v1/files/:id', handleLambda(updateDocument_1.handler));
app.delete('/v1/files/:id', handleLambda(deleteDocument_1.handler));
app.post('/v1/files/:id/restore', handleLambda(restoreDocument_1.handler));
app.get('/v1/files/:id/versions', handleLambda(listVersions_1.handler));
app.post('/v1/files/presign/upload', handleLambda(presignUpload_1.handler));
app.post('/v1/files/presign/download', handleLambda(presignDownload_1.handler));
app.get('/v1/admin/users', handleLambda(adminListUsers_1.handler));
app.post('/v1/admin/users', handleLambda(adminCreateUser_1.handler));
app.post('/v1/admin/users/:id/roles', handleLambda(adminUpdateRoles_1.handler));
app.post('/v1/admin/users/:id/signout', handleLambda(adminSignOut_1.handler));
app.get('/v1/admin/audits', handleLambda(adminAudits_1.handler));
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log(`🚀 DMS API Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/v1`);
});
