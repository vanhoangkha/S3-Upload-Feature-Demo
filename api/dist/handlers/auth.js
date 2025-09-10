"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.signIn = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const security_1 = require("../lib/security");
const logger_1 = require("../lib/logger");
const cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_GcPiggAiS';
const CLIENT_ID = process.env.CLIENT_ID || '5kpfm8nfp48dkinpphvlhm6fqv';
const signIn = async (event) => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;
    try {
        const validatedEvent = (0, security_1.sanitizeEvent)(event);
        const { username, password } = (0, security_1.safeJsonParse)(validatedEvent.body);
        if (!username || !password) {
            return (0, security_1.createSafeResponse)(400, {
                error: { code: 400, message: 'Username and password are required' }
            });
        }
        const command = new client_cognito_identity_provider_1.AdminInitiateAuthCommand({
            UserPoolId: USER_POOL_ID,
            ClientId: CLIENT_ID,
            AuthFlow: 'ADMIN_NO_SRP_AUTH',
            AuthParameters: {
                USERNAME: String(username).trim(),
                PASSWORD: String(password)
            }
        });
        const response = await cognitoClient.send(command);
        if (response.AuthenticationResult) {
            logger_1.logger.info('Authentication successful', {
                requestId,
                username: String(username).trim(),
                latency_ms: Date.now() - startTime
            });
            return (0, security_1.createSafeResponse)(200, {
                accessToken: response.AuthenticationResult.AccessToken,
                idToken: response.AuthenticationResult.IdToken,
                refreshToken: response.AuthenticationResult.RefreshToken
            });
        }
        else {
            logger_1.logger.warn('Authentication failed - no result', {
                requestId,
                username: String(username).trim(),
                latency_ms: Date.now() - startTime
            });
            return (0, security_1.createSafeResponse)(401, {
                error: { code: 401, message: 'Authentication failed' }
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Authentication error', {
            requestId,
            error: error.message,
            latency_ms: Date.now() - startTime
        });
        return (0, security_1.createSafeResponse)(401, {
            error: { code: 401, message: 'Authentication failed' }
        });
    }
};
exports.signIn = signIn;
exports.handler = exports.signIn;
