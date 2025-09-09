const https = require('https');

const API_BASE = 'https://7o9lrh9and.execute-api.us-east-1.amazonaws.com/v1';

async function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

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

async function testAllEndpoints() {
  console.log('🧪 Complete API Endpoint Testing\n');
  console.log('API Base URL:', API_BASE);
  console.log('=' .repeat(60));

  // Test all endpoints without authentication
  const endpoints = [
    { method: 'GET', path: '/me', name: 'Who Am I' },
    { method: 'GET', path: '/files', name: 'List Documents' },
    { method: 'POST', path: '/files', name: 'Create Document', data: { filename: 'test.pdf', contentType: 'application/pdf' } },
    { method: 'GET', path: '/files/test-id', name: 'Get Document' },
    { method: 'PATCH', path: '/files/test-id', name: 'Update Document', data: { name: 'updated.pdf' } },
    { method: 'DELETE', path: '/files/test-id', name: 'Delete Document' },
    { method: 'POST', path: '/files/test-id/restore', name: 'Restore Document' },
    { method: 'GET', path: '/files/test-id/versions', name: 'List Versions' },
    { method: 'POST', path: '/files/presign/upload', name: 'Presign Upload', data: { filename: 'test.pdf', contentType: 'application/pdf' } },
    { method: 'POST', path: '/files/presign/download', name: 'Presign Download', data: { documentId: 'test-id' } },
    { method: 'GET', path: '/user/documents', name: 'User Documents' },
    { method: 'GET', path: '/user/profile', name: 'User Profile' },
    { method: 'PATCH', path: '/user/profile', name: 'Update User Profile', data: { name: 'Test User' } },
    { method: 'GET', path: '/vendor/documents', name: 'Vendor Documents' },
    { method: 'GET', path: '/vendor/users', name: 'Vendor Users' },
    { method: 'GET', path: '/vendor/stats', name: 'Vendor Stats' },
    { method: 'GET', path: '/admin/users', name: 'Admin List Users' },
    { method: 'POST', path: '/admin/users', name: 'Admin Create User', data: { username: 'test', email: 'test@example.com', vendor_id: 'vendor1', groups: ['User'] } },
    { method: 'POST', path: '/admin/users/test-id/roles', name: 'Admin Update Roles', data: { roles: ['User'] } },
    { method: 'POST', path: '/admin/users/test-id/signout', name: 'Admin Sign Out User' },
    { method: 'GET', path: '/admin/audits', name: 'Admin Audit Logs' }
  ];

  console.log('\n📋 Testing All Endpoints (Unauthorized - Should Return 401):\n');

  let passCount = 0;
  let totalCount = endpoints.length;

  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest(endpoint.method, endpoint.path, endpoint.data);
      const status = result.status === 401 ? '✅ PASS' : '❌ FAIL';
      const expected = result.status === 401 ? '(Correctly requires auth)' : `(Got ${result.status}, expected 401)`;
      
      console.log(`${status} ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(30)} ${endpoint.name} ${expected}`);
      
      if (result.status === 401) passCount++;
      
    } catch (error) {
      console.log(`❌ FAIL ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(30)} ${endpoint.name} (Network error: ${error.message})`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Results: ${passCount}/${totalCount} endpoints correctly require authentication`);
  
  if (passCount === totalCount) {
    console.log('🎉 All endpoints are properly secured!');
  } else {
    console.log('⚠️  Some endpoints may have security issues');
  }

  console.log('\n🔐 Authentication Test Instructions:');
  console.log('1. Open: https://d1ljyycpkoybvj.cloudfront.net');
  console.log('2. Login with: admin@test.com / AdminPass123!');
  console.log('3. Test the web interface functionality');
  console.log('4. Check browser network tab for API calls');

  console.log('\n🌐 System URLs:');
  console.log('• Web App: https://d1ljyycpkoybvj.cloudfront.net');
  console.log('• API: https://7o9lrh9and.execute-api.us-east-1.amazonaws.com/v1');
  console.log('• Cognito: https://dms-dev-9jnusleq.auth.us-east-1.amazoncognito.com');
}

testAllEndpoints().catch(console.error);
