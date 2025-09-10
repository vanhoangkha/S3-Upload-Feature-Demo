import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { config } from '../lib/config';

// Create verifier instance (cached across invocations)
const verifier = CognitoJwtVerifier.create({
  userPoolId: config.cognito.userPoolId,
  tokenUse: 'access',
  clientId: config.cognito.clientId,
});

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  try {
    const token = event.authorizationToken.replace('Bearer ', '');
    
    // Verify JWT token
    const payload = await verifier.verify(token);
    
    // Extract groups and roles
    const groups = payload['cognito:groups'] as string[] || [];
    const roles = groups; // Groups are roles in Cognito
    
    // Build policy
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: 'Allow' as const,
        Resource: event.methodArn
      }]
    };

    return {
      principalId: payload.sub,
      policyDocument,
      context: {
        userId: String(payload.sub),
        email: String(payload.email || ''),
        vendorId: String(payload['custom:vendor_id'] || ''),
        roles: roles.join(','),
        groups: groups.join(',')
      }
    };

  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error('Unauthorized');
  }
};
