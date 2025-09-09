const { CognitoIdentityProviderClient, AdminInitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });

async function getToken() {
  try {
    const command = new AdminInitiateAuthCommand({
      UserPoolId: 'us-east-1_GcPiggAiS',
      ClientId: '5kpfm8nfp48dkinpphvlhm6fqv',
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: 'admin@test.com',
        PASSWORD: 'AdminPass123!'
      }
    });

    const response = await client.send(command);
    
    console.log('✅ Authentication successful!');
    console.log('Access Token:', response.AuthenticationResult.AccessToken);
    console.log('\n🔗 Copy this token to use in the frontend:');
    console.log(response.AuthenticationResult.AccessToken);
    
    return response.AuthenticationResult;
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getToken();
