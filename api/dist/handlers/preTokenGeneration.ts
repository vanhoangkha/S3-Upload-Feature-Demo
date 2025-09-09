import { PreTokenGenerationTriggerEvent, PreTokenGenerationTriggerHandler } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  AdminListGroupsForUserCommand 
} from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '../lib/logger';

const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });

export const handler: PreTokenGenerationTriggerHandler = async (event) => {
  try {
    const { userPoolId, userName } = event;

    logger.info('Pre token generation triggered', {
      userPoolId,
      userName,
      triggerSource: event.triggerSource
    });

    // Get user's groups
    const command = new AdminListGroupsForUserCommand({
      UserPoolId: userPoolId,
      Username: userName
    });

    const response = await cognitoClient.send(command);
    const groups = response.Groups?.map(group => group.GroupName!) || [];

    // Get vendor_id from user attributes
    const vendorId = event.request.userAttributes['custom:vendor_id'];

    // Inject roles and vendor_id into ID token
    event.response.claimsOverrideDetails = {
      claimsToAddOrOverride: {
        'cognito:groups': groups.join(','),
        'vendor_id': vendorId || ''
      }
    };

    logger.info('Token claims injected', {
      userName,
      groups,
      vendorId
    });

    return event;

  } catch (error) {
    logger.error('Pre token generation failed', {
      userName: event.userName,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Don't throw - let Cognito continue with default behavior
    return event;
  }
};
