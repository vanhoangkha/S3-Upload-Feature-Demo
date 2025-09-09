const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });

const USER_POOL_ID = 'us-east-1_GcPiggAiS';
const ADMIN_TOKEN = 'eyJraWQiOiJ4SVBzSnA2d2dTNXRweFBSUDRSVW5jT3lIc0MyMkh0c3VoN3lzWkYwVGJjPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI1NDk4MDQ2OC01MDUxLTcwN2UtZjRiNy0xMDZiYTY0YzM0OTQiLCJjb2duaXRvOmdyb3VwcyI6WyJBZG1pbiJdLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9HY1BpZ2dBaVMiLCJjbGllbnRfaWQiOiI1a3BmbThuZnA0OGRraW5wcGh2bGhtNmZxdiIsIm9yaWdpbl9qdGkiOiI3OWQ1NTk5MS1jYjI5LTQ1MzYtODZmMC1hNjdmNjc0YTdjNDciLCJldmVudF9pZCI6IjFlMjNmOGY5LTZlMjctNDU0NC1iNDc5LWQ2NWJhN2ZhZmU2MiIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3NTc0NTMzNTAsImV4cCI6MTc1NzQ1Njk0OSwiaWF0IjoxNzU3NDUzMzUwLCJqdGkiOiIwNTlmZGIzMi01MzQyLTQ4YjktODE3MS0xOGFjMDc2ZDIzZTIiLCJ1c2VybmFtZSI6ImFkbWluQHRlc3QuY29tIn0.ErgezSvOXpJWW7nqjFHqVx-H6ACDBdLL27x-a_Iawj8R1NKSt4ajMebcsOe16U5YRuf_c4fz_dJF_2gQS-0ZiD8OVSZr8XlJGkvSCP-eQwTBPKU9Q__pIwi1d27rLmZcutPFr68mg7PyaysNRMYlYcwb_QG0TUjK9aX_i2O-OdjFoXBFbCx0Pi8Vr2IPDahi-R-T9wkZVQokc8qUaYnke6ssdkzReZKFXoVCf4GJIcv8HvbFy24qD2t2fd9H0hBWus61L34BT-xT3a3xIhO9OsfxnuKDH4ulzmL2zgxNlRWqwTjpnW44VhfN1-m8UdJisjo1aNJtvruyMga_xqEafQ';

const users = [
  { email: 'vendor@test.com', password: 'VendorPass123!', group: 'Vendor', vendorId: 'vendor1' },
  { email: 'user@test.com', password: 'UserPass123!', group: 'User', vendorId: 'vendor1' }
];

async function createUser(userData) {
  try {
    // Create user
    const createParams = {
      UserPoolId: USER_POOL_ID,
      Username: userData.email,
      TemporaryPassword: userData.password,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: userData.email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'custom:vendor_id', Value: userData.vendorId }
      ]
    };

    await cognito.adminCreateUser(createParams).promise();
    console.log(`✅ Created user: ${userData.email}`);

    // Set permanent password
    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: userData.email,
      Password: userData.password,
      Permanent: true
    }).promise();
    console.log(`✅ Set password for: ${userData.email}`);

    // Add to group
    await cognito.adminAddUserToGroup({
      UserPoolId: USER_POOL_ID,
      Username: userData.email,
      GroupName: userData.group
    }).promise();
    console.log(`✅ Added ${userData.email} to ${userData.group} group`);

  } catch (error) {
    if (error.code === 'UsernameExistsException') {
      console.log(`⚠️  User ${userData.email} already exists`);
    } else {
      console.error(`❌ Error creating ${userData.email}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Creating test users for all 3 roles...\n');
  
  for (const user of users) {
    await createUser(user);
    console.log('');
  }

  console.log('📋 TEST ACCOUNTS SUMMARY:');
  console.log('='.repeat(50));
  console.log('👑 ADMIN: admin@test.com / AdminPass123!');
  console.log('🏢 VENDOR: vendor@test.com / VendorPass123!');
  console.log('👤 USER: user@test.com / UserPass123!');
  console.log('');
  console.log('🔗 Login URL: https://d1ljyycpkoybvj.cloudfront.net/login');
}

main().catch(console.error);
