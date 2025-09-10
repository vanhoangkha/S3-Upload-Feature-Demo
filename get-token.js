const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });

async function getToken(username, password) {
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: '6du5l9nn54dpvgand5t86g8agb',
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password
    }
  });

  try {
    const response = await client.send(command);
    return response.AuthenticationResult.AccessToken;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Get tokens for both test users
(async () => {
  console.log('Admin token:');
  const adminToken = await getToken('admin', 'AdminPass123!');
  console.log(adminToken);
  
  console.log('\nVendor token:');
  const vendorToken = await getToken('vendor1', 'VendorPass123!');
  console.log(vendorToken);
})();
