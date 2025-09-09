const https = require('https');

const API_BASE = 'https://7o9lrh9and.execute-api.us-east-1.amazonaws.com/v1';

// Test token (you'll need to get this from Cognito login)
let authToken = null;

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

async function testEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');

  // Test public endpoints (no auth required)
  console.log('📋 Testing Public Endpoints:');
  
  // Test protected endpoints (require auth)
  console.log('\n🔐 Testing Protected Endpoints (without token):');
  
  const protectedEndpoints = [
    { method: 'GET', path: '/me', name: 'Who Am I' },
    { method: 'GET', path: '/files', name: 'List Documents' },
    { method: 'POST', path: '/files', name: 'Create Document' },
    { method: 'POST', path: '/files/presign/upload', name: 'Presign Upload' },
    { method: 'GET', path: '/admin/users', name: 'Admin List Users' }
  ];

  for (const endpoint of protectedEndpoints) {
    try {
      const result = await makeRequest(endpoint.method, endpoint.path);
      console.log(`${endpoint.name}: ${result.status} - ${result.status === 401 ? '✅ Correctly requires auth' : '❌ Should require auth'}`);
    } catch (error) {
      console.log(`${endpoint.name}: ❌ Error - ${error.message}`);
    }
  }

  console.log('\n📝 To test with authentication:');
  console.log('1. Go to: https://dms-dev-9jnusleq.auth.us-east-1.amazoncognito.com/login?client_id=5kpfm8nfp48dkinpphvlhm6fqv&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:3000');
  console.log('2. Login with: admin@test.com / AdminPass123!');
  console.log('3. Extract the JWT token from the callback');
  console.log('4. Set authToken variable and run authenticated tests');
}

testEndpoints().catch(console.error);
