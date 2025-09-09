const https = require('https');

const API_BASE = 'https://7o9lrh9and.execute-api.us-east-1.amazonaws.com/v1';
const TOKEN = 'eyJraWQiOiJ4SVBzSnA2d2dTNXRweFBSUDRSVW5jT3lIc0MyMkh0c3VoN3lzWkYwVGJjPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI1NDk4MDQ2OC01MDUxLTcwN2UtZjRiNy0xMDZiYTY0YzM0OTQiLCJjb2duaXRvOmdyb3VwcyI6WyJBZG1pbiJdLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9HY1BpZ2dBaVMiLCJjbGllbnRfaWQiOiI1a3BmbThuZnA0OGRraW5wcGh2bGhtNmZxdiIsIm9yaWdpbl9qdGkiOiJhN2U1NzVkYy0wYmUyLTQxZGMtOGViOS00Yzc5Mzg1YWM2NDgiLCJldmVudF9pZCI6ImQ0MzhmMzkxLTVkN2YtNGJhYS04YTJjLTlmNzYyNjlkYTA0MiIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3NTc0NTA5NDksImV4cCI6MTc1NzQ1NDU0OCwiaWF0IjoxNzU3NDUwOTQ5LCJqdGkiOiIzYmFkNTFiOS01MWFkLTRhMDQtOTY5YS02ZmQxOTA0ZjM2NGMiLCJ1c2VybmFtZSI6ImFkbWluQHRlc3QuY29tIn0.UJAzAzs6L6nohmtU6PQDS_kVAzGES1mnyquVJfP9LDrqcAht8Nwl8pUD1Xpab91_veYOloBshtAbUKGG-4NJCTQyWTJ5CrvO9I5g8C0SsrgfvFMF7RCxkgANJKIqQgb__wo8mTCM8ISydYJYE_2sNCL9hhmJMV_pKs8Hz5R8zBl9lxJkcquPB0tab-Y1etRYP73ITjSjNerLz3UHng_QV2xyWhLGEWIpyDF57W7hcokEAfzu_tw7cWYW5abjQPDGCi51W9D5nfswclM1xMA5qrPpDJ4eKion1dstkSJZH8a3bEc_Vj-CGLTEjRLTjKs3_zbxc0qaigjdXueqDiFXXg';

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

async function testAllFeatures() {
  console.log('🔍 KIỂM TRA TOÀN BỘ TÍNH NĂNG HỆ THỐNG DMS\n');
  console.log('=' .repeat(70));

  const tests = [
    // Authentication & User Info
    { category: '🔐 XÁC THỰC & THÔNG TIN USER', method: 'GET', path: '/me', name: 'Thông tin user hiện tại' },
    
    // Document Management
    { category: '📄 QUẢN LÝ TÀI LIỆU', method: 'GET', path: '/files', name: 'Danh sách tài liệu' },
    { category: '📄 QUẢN LÝ TÀI LIỆU', method: 'POST', path: '/files/presign/upload', name: 'Tạo URL upload', data: { filename: 'test.pdf', contentType: 'application/pdf' } },
    { category: '📄 QUẢN LÝ TÀI LIỆU', method: 'POST', path: '/files/presign/download', name: 'Tạo URL download', data: { documentId: 'test-id' } },
    
    // User Features
    { category: '👤 TÍNH NĂNG USER', method: 'GET', path: '/user/documents', name: 'Tài liệu của user' },
    { category: '👤 TÍNH NĂNG USER', method: 'GET', path: '/user/profile', name: 'Profile user' },
    { category: '👤 TÍNH NĂNG USER', method: 'PATCH', path: '/user/profile', name: 'Cập nhật profile', data: { name: 'Test User' } },
    
    // Vendor Features
    { category: '🏢 TÍNH NĂNG VENDOR', method: 'GET', path: '/vendor/documents', name: 'Tài liệu vendor' },
    { category: '🏢 TÍNH NĂNG VENDOR', method: 'GET', path: '/vendor/users', name: 'Users của vendor' },
    { category: '🏢 TÍNH NĂNG VENDOR', method: 'GET', path: '/vendor/stats', name: 'Thống kê vendor' },
    
    // Admin Features
    { category: '👑 TÍNH NĂNG ADMIN', method: 'GET', path: '/admin/users', name: 'Quản lý users' },
    { category: '👑 TÍNH NĂNG ADMIN', method: 'GET', path: '/admin/audits', name: 'Logs audit' },
  ];

  let currentCategory = '';
  let totalTests = 0;
  let passedTests = 0;
  let categoryResults = {};

  for (const test of tests) {
    if (test.category !== currentCategory) {
      if (currentCategory) {
        console.log('');
      }
      console.log(`\n${test.category}:`);
      currentCategory = test.category;
      categoryResults[currentCategory] = { total: 0, passed: 0 };
    }

    totalTests++;
    categoryResults[currentCategory].total++;

    try {
      const result = await makeRequest(test.method, test.path, test.data);
      const success = result.status === 200;
      const status = success ? '✅ HOẠT ĐỘNG' : '❌ LỖI';
      const details = success ? 'OK' : `HTTP ${result.status}`;
      
      console.log(`  ${status} ${test.name.padEnd(25)} (${details})`);
      
      if (success) {
        passedTests++;
        categoryResults[currentCategory].passed++;
      } else {
        console.log(`    └─ Chi tiết: ${JSON.stringify(result.data).substring(0, 80)}...`);
      }
      
    } catch (error) {
      console.log(`  ❌ LỖI ${test.name.padEnd(25)} (Lỗi mạng: ${error.message})`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 KẾT QUẢ TỔNG HỢP:');
  console.log('='.repeat(70));

  Object.entries(categoryResults).forEach(([category, result]) => {
    const percentage = Math.round((result.passed / result.total) * 100);
    const status = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️' : '❌';
    console.log(`${status} ${category}: ${result.passed}/${result.total} (${percentage}%)`);
  });

  const overallPercentage = Math.round((passedTests / totalTests) * 100);
  console.log('\n' + '='.repeat(70));
  console.log(`🎯 TỔNG KẾT: ${passedTests}/${totalTests} tính năng hoạt động (${overallPercentage}%)`);

  if (overallPercentage === 100) {
    console.log('🎉 TẤT CẢ TÍNH NĂNG ĐÃ HOẠT ĐỘNG HOÀN TOÀN!');
  } else if (overallPercentage >= 80) {
    console.log('⚠️  Hầu hết tính năng hoạt động, một số cần khắc phục');
  } else {
    console.log('❌ Nhiều tính năng chưa hoạt động, cần debug thêm');
  }

  console.log('\n🌐 THÔNG TIN TRUY CẬP:');
  console.log('• Web App: https://d1ljyycpkoybvj.cloudfront.net');
  console.log('• API: https://7o9lrh9and.execute-api.us-east-1.amazonaws.com/v1');
  console.log('• Login: admin@test.com / AdminPass123!');
}

testAllFeatures().catch(console.error);
