import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { requireAuth } from '../lib/auth';
import { createSuccessResponse, createErrorResponse } from '../lib/errors';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const auth = requireAuth(event);
    
    return createSuccessResponse({
      userId: auth.userId,
      vendorId: auth.vendorId,
      roles: auth.roles,
      email: auth.email,
      message: 'User profile endpoint - implementation pending'
    });
  } catch (error) {
    return createErrorResponse(error);
  }
};
