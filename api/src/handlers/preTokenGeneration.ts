import { PreTokenGenerationTriggerEvent, PreTokenGenerationTriggerHandler } from 'aws-lambda';

export const handler: PreTokenGenerationTriggerHandler = async (event: PreTokenGenerationTriggerEvent) => {
  try {
    // Get user attributes from Cognito
    const { sub: userId, email } = event.request.userAttributes;
    const vendorId = event.request.userAttributes['custom:vendor_id'] || '';
    
    // Add vendor_id to token claims for easier access in Lambda functions
    event.response.claimsOverrideDetails = {
      claimsToAddOrOverride: {
        vendor_id: vendorId,
        email: email
      }
    };
    
    console.log(`Token generated for user ${userId} with vendor ${vendorId}`);
    return event;
  } catch (error) {
    console.error('Pre-token generation error:', error);
    return event; // Don't fail auth on errors
  }
};
