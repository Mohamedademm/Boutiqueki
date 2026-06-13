const http = require('http');

function request(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testApi() {
  try {
    console.log('Testing /api/auth/register...');
    const registerRes = await request('/api/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'client'
    });
    if (registerRes.status === 201 && registerRes.data.success) {
      console.log('✅ Register API working! Token received:', registerRes.data.data.token.substring(0, 20) + '...');
    } else {
      console.error('❌ Register API failed:', registerRes.data);
    }

    console.log('Testing /api/auth/login...');
    const loginRes = await request('/api/auth/login', {
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    if (loginRes.status === 200 && loginRes.data.success) {
      console.log('✅ Login API working! Token received:', loginRes.data.data.token.substring(0, 20) + '...');
      console.log('   User:', loginRes.data.data.data.email);
    } else {
      console.error('❌ Login API failed:', loginRes.data);
    }
  } catch (err) {
    console.error('Test API error:', err);
  }
}

testApi();
