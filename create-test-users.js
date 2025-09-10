#!/usr/bin/env node

const AWS = require('aws-sdk');

// Configure AWS
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: 'us-east-1'
});

const USER_POOL_ID = 'us-east-1_example'; // Replace with actual pool ID

const testUsers = [
  {
    username: 'admin-test',
    email: 'admin@test.com',
    password: 'TempPass123!',
    role: 'admin',
    groups: ['admin']
  },
  {
    username: 'vendor-test', 
    email: 'vendor@test.com',
    password: 'TempPass123!',
    role: 'vendor',
    groups: ['vendor']
  },
  {
    username: 'user-test',
    email: 'user@test.com', 
    password: 'TempPass123!',
    role: 'user',
    groups: ['user']
  }
];

async function createTestUser(user) {
  try {
    console.log(`Creating user: ${user.username}`);
    
    const params = {
      UserPoolId: USER_POOL_ID,
      Username: user.username,
      UserAttributes: [
        { Name: 'email', Value: user.email },
        { Name: 'email_verified', Value: 'true' }
      ],
      TemporaryPassword: user.password,
      MessageAction: 'SUPPRESS'
    };
    
    await cognito.adminCreateUser(params).promise();
    
    // Set permanent password
    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: user.username,
      Password: user.password,
      Permanent: true
    }).promise();
    
    console.log(`✅ Created user: ${user.username}`);
    return true;
  } catch (error) {
    if (error.code === 'UsernameExistsException') {
      console.log(`⚠️  User already exists: ${user.username}`);
      return true;
    }
    console.error(`❌ Failed to create user ${user.username}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎭 Creating Test Users for 3 Roles\n');
  
  for (const user of testUsers) {
    await createTestUser(user);
  }
  
  console.log('\n📋 Test Users Created:');
  console.log('👤 Admin: admin-test / TempPass123!');
  console.log('👤 Vendor: vendor-test / TempPass123!'); 
  console.log('👤 User: user-test / TempPass123!');
  
  console.log('\n🚀 Ready to test at: http://localhost:3000');
}

if (require.main === module) {
  main().catch(console.error);
}
