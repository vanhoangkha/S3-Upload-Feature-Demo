const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const cognito = new AWS.CognitoIdentityServiceProvider();

const USER_POOL_ID = 'us-east-1_GcPiggAiS';
const CLIENT_ID = 'YOUR_CLIENT_ID'; // We need to get this

async function generateToken(username, password) {
  try {
    // First, get the client ID
    const userPool = await cognito.describeUserPool({
      UserPoolId: USER_POOL_ID
    }).promise();
    
    console.log('User Pool:', userPool.UserPool.Name);
    
    // List user pool clients
    const clients = await cognito.listUserPoolClients({
      UserPoolId: USER_POOL_ID
    }).promise();
    
    console.log('Available clients:', clients.UserPoolClients);
    
    if (clients.UserPoolClients.length > 0) {
      const clientId = clients.UserPoolClients[0].ClientId;
      console.log('Using client ID:', clientId);
      
      // Authenticate user
      const authResult = await cognito.adminInitiateAuth({
        UserPoolId: USER_POOL_ID,
        ClientId: clientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password
        }
      }).promise();
      
      console.log('Access Token:', authResult.AuthenticationResult.AccessToken);
      console.log('ID Token:', authResult.AuthenticationResult.IdToken);
      
      return authResult.AuthenticationResult;
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Usage
if (process.argv.length < 4) {
  console.log('Usage: node generate-token.js <username> <password>');
  console.log('Example: node generate-token.js admin-test password123');
} else {
  const username = process.argv[2];
  const password = process.argv[3];
  generateToken(username, password);
}
