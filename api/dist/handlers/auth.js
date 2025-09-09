"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.signIn = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({ region: 'us-east-1' });
const signIn = async (event) => {
    try {
        const { username, password } = JSON.parse(event.body || '{}');
        if (!username || !password) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                body: JSON.stringify({
                    message: 'Username and password are required'
                })
            };
        }
        const command = new client_cognito_identity_provider_1.InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: process.env.COGNITO_CLIENT_ID,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password
            }
        });
        const response = await cognitoClient.send(command);
        if (response.AuthenticationResult) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                body: JSON.stringify({
                    accessToken: response.AuthenticationResult.AccessToken,
                    idToken: response.AuthenticationResult.IdToken,
                    refreshToken: response.AuthenticationResult.RefreshToken
                })
            };
        }
        else {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                body: JSON.stringify({
                    message: 'Authentication failed'
                })
            };
        }
    }
    catch (error) {
        console.error('Sign in error:', error);
        return {
            statusCode: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            body: JSON.stringify({
                message: error.message || 'Authentication failed'
            })
        };
    }
};
exports.signIn = signIn;
exports.handler = exports.signIn;
