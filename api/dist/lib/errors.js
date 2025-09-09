"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = exports.createSuccessResponse = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.HttpError = void 0;
class HttpError extends Error {
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'HttpError';
    }
}
exports.HttpError = HttpError;
class BadRequestError extends HttpError {
    constructor(message, details) {
        super(400, 400, message, details);
        this.name = 'BadRequestError';
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends HttpError {
    constructor(message = 'Unauthorized') {
        super(401, 401, message);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends HttpError {
    constructor(message = 'Forbidden') {
        super(403, 403, message);
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends HttpError {
    constructor(message = 'Not found') {
        super(404, 404, message);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends HttpError {
    constructor(message, details) {
        super(409, 409, message, details);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
const createSuccessResponse = (data, statusCode = 200) => {
    return {
        statusCode,
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
        }
    };
};
exports.createSuccessResponse = createSuccessResponse;
const createErrorResponse = (error) => {
    if (error instanceof HttpError) {
        return {
            statusCode: error.statusCode,
            body: JSON.stringify({
                error: {
                    code: error.code,
                    message: error.message,
                    ...(error.details && { details: error.details })
                }
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
            }
        };
    }
    return {
        statusCode: 500,
        body: JSON.stringify({
            error: {
                code: 500,
                message: 'Internal server error'
            }
        }),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
        }
    };
};
exports.createErrorResponse = createErrorResponse;
