const https = require('https');
const AWS = require('aws-sdk');

const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });
const CLIENT_ID = '5kpfm8nfp48dkinpphvlhm6fqv';
const API_BASE = 'https://7o9lrh9and.execute-api.us-east-1.amazonaws.com/v1';

const testAccounts = [
  { email: 'admin@test.com', password: 'AdminPass123!', role: 'Admin', emoji: '👑' },
  { email: 'vendor@test.com', password: 'VendorPass123!', role: 'Vendor', emoji: '🏢' },
  { email: 'user@test.com', password: 'UserPass123!', role: 'User', emoji: '👤' }
];

async function getToken(email, password) {
  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  };

  try {
    const result = await cognito.initiateAuth(params).promise();
    return result.AuthenticationResult.AccessToken;
  } catch (error) {
    throw new Error(`Login failed for ${email}: ${error.message}`);
  }
}

async function makeRequest(method, path, token, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testRole(account) {
  console.log(`\n${account.emoji} TESTING ${account.role.toUpperCase()} ROLE (${account.email})`);
  console.log('='.repeat(60));

  try {
    // Get token
    const token = await getToken(account.email, account.password);
    console.log('✅ Authentication successful');

    // Test endpoints based on role
    const tests = [
      { method: 'GET', path: '/me', name: 'User Info', expected: 200 },
      { method: 'GET', path: '/files', name: 'List Documents', expected: 200 },
      { method: 'POST', path: '/files/presign/upload', name: 'Upload URL', expected: 200, data: { filename: 'test.pdf', contentType: 'application/pdf' } }
    ];

    // Role-specific tests
    if (account.role === 'Admin') {
      tests.push(
        { method: 'GET', path: '/admin/users', name: 'Admin: List Users', expected: 200 },
        { method: 'GET', path: '/admin/audits', name: 'Admin: Audit Logs', expected: 200 }
      );
    }

    if (account.role === 'Vendor' || account.role === 'Admin') {
      tests.push(
        { method: 'GET', path: '/vendor/documents', name: 'Vendor: Documents', expected: 200 },
        { method: 'GET', path: '/vendor/users', name: 'Vendor: Users', expected: 200 }
      );
    }

    let passed = 0;
    let total = tests.length;

    for (const test of tests) {
      try {
        const result = await makeRequest(test.method, test.path, token, test.data);
        const success = result.status === test.expected;
        const status = success ? '✅' : '❌';
        
        console.log(`  ${status} ${test.name.padEnd(25)} (${result.status})`);
        if (success) passed++;
        
      } catch (error) {
        console.log(`  ❌ ${test.name.padEnd(25)} (Error: ${error.message})`);
      }
    }

    const percentage = Math.round((passed / total) * 100);
    console.log(`\n📊 ${account.role} Result: ${passed}/${total} (${percentage}%)`);
    
    return { role: account.role, passed, total, percentage };

  } catch (error) {
    console.log(`❌ Failed to test ${account.role}: ${error.message}`);
    return { role: account.role, passed: 0, total: 1, percentage: 0 };
  }
}

async function main() {
  console.log('🧪 TESTING ALL 3 ROLES WITH RBAC');
  console.log('='.repeat(60));

  const results = [];
  
  for (const account of testAccounts) {
    const result = await testRole(account);
    results.push(result);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 FINAL RBAC TEST RESULTS');
  console.log('='.repeat(60));

  let totalPassed = 0;
  let totalTests = 0;

  results.forEach(result => {
    const status = result.percentage === 100 ? '✅' : result.percentage >= 80 ? '⚠️' : '❌';
    console.log(`${status} ${result.role.padEnd(8)}: ${result.passed}/${result.total} (${result.percentage}%)`);
    totalPassed += result.passed;
    totalTests += result.total;
  });

  const overallPercentage = Math.round((totalPassed / totalTests) * 100);
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 OVERALL: ${totalPassed}/${totalTests} (${overallPercentage}%)`);

  if (overallPercentage === 100) {
    console.log('🎉 ALL ROLES WORKING PERFECTLY!');
  } else if (overallPercentage >= 90) {
    console.log('✅ RBAC SYSTEM WORKING WELL!');
  } else {
    console.log('⚠️  RBAC NEEDS SOME FIXES');
  }

  console.log('\n🌐 TEST ACCOUNTS:');
  testAccounts.forEach(account => {
    console.log(`${account.emoji} ${account.role}: ${account.email} / ${account.password}`);
  });
  console.log('\n🔗 Login: https://d1ljyycpkoybvj.cloudfront.net/login');
}

main().catch(console.error);
