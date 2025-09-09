const https = require('https');

const API_BASE = 'https://7o9lrh9and.execute-api.us-east-1.amazonaws.com/v1';
const TOKEN = 'eyJraWQiOiJ4SVBzSnA2d2dTNXRweFBSUDRSVW5jT3lIc0MyMkh0c3VoN3lzWkYwVGJjPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI1NDk4MDQ2OC01MDUxLTcwN2UtZjRiNy0xMDZiYTY0YzM0OTQiLCJjb2duaXRvOmdyb3VwcyI6WyJBZG1pbiJdLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9HY1BpZ2dBaVMiLCJjbGllbnRfaWQiOiI1a3BmbThuZnA0OGRraW5wcGh2bGhtNmZxdiIsIm9yaWdpbl9qdGkiOiI3NDg4NDgwNS04ZGUyLTQ4MTQtYWM2NS1hYzRmZTliOTA2YjAiLCJldmVudF9pZCI6ImVhMGViNDdkLTM1ZGEtNDVkNC05NmU3LWYwMTczMTg0ZjJkMyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3NTc0NTIxNjEsImV4cCI6MTc1NzQ1NTc2MSwiaWF0IjoxNzU3NDUyMTYxLCJqdGkiOiJjMGIwZDhkOS00MWFmLTRiZmUtOGFlMy1jMjE2MGM1MjljOWIiLCJ1c2VybmFtZSI6ImFkbWluQHRlc3QuY29tIn0.MzyLULzA-32CbMjvIIIZFNEG1wPWlZ_m_IJyw0DPgsTcBbQ9ckcedRN17kp9GeI2u6DBLAdeN_gjVqtoGSigr-y6pa4_pOQn6PcUrHTn9b4-Ig2P9O4ODDCfuA6iEyT_v5T1kFvtUcZsF29DD4avsG-JlMNCJpiOWRteCzJ-hiLFceBtidRas_Mbdixm99zWc15A9vZyHmjWu6vkTLNn1Y8OZyXYQqW0CTD_STRggLOcJOYF4sM9XP0T9cYl9-Lff-6Skqn-HnAli0jKsHDdec5mYl7hPwiXyWlDRpbn7T55wlzdsiuT1UyGaasv9zOEG-h4YFg5-ANXNXVHgDI9sA';

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
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

async function finalTest() {
  console.log('🎯 KIỂM TRA CUỐI CÙNG - 100% REAL?\n');

  const tests = [
    { method: 'GET', path: '/me', name: 'User Info' },
    { method: 'GET', path: '/files', name: 'List Documents' },
    { method: 'POST', path: '/files/presign/upload', name: 'Upload URL', data: { filename: 'test.pdf', contentType: 'application/pdf' } },
    { method: 'POST', path: '/files/presign/download', name: 'Download URL', data: { documentId: 'b4b18f4f-9f8c-4813-ad6a-693c05a9e3cd' } },
    { method: 'GET', path: '/user/documents', name: 'User Docs' },
    { method: 'GET', path: '/user/profile', name: 'User Profile' },
    { method: 'GET', path: '/vendor/documents', name: 'Vendor Docs' },
    { method: 'GET', path: '/vendor/users', name: 'Vendor Users' },
    { method: 'GET', path: '/vendor/stats', name: 'Vendor Stats' },
    { method: 'GET', path: '/admin/users', name: 'Admin Users' },
    { method: 'GET', path: '/admin/audits', name: 'Admin Audits' }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      const result = await makeRequest(test.method, test.path, test.data);
      const success = result.status === 200;
      const status = success ? '✅' : '❌';
      
      console.log(`${status} ${test.name.padEnd(15)} (${result.status})`);
      if (success) passed++;
      
    } catch (error) {
      console.log(`❌ ${test.name.padEnd(15)} (Error)`);
    }
  }

  const percentage = Math.round((passed / total) * 100);
  console.log('\n' + '='.repeat(40));
  console.log(`🎯 KẾT QUẢ: ${passed}/${total} (${percentage}%)`);
  
  if (percentage === 100) {
    console.log('🎉 100% REAL - TẤT CẢ HOẠT ĐỘNG!');
  } else {
    console.log(`⚠️  ${percentage}% REAL - Còn ${total - passed} lỗi`);
  }
}

finalTest().catch(console.error);
