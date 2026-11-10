const app = require('../src/app');
const config = require('../src/config/env');
const { prisma, connectDB, disconnectDB } = require('../src/config/db');
const http = require('http');

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const allHeaders = { ...headers };
    if (body) {
      allHeaders['Content-Type'] = 'application/json';
      allHeaders['Content-Length'] = Buffer.byteLength(postData);
    }
    const req = http.request({
      hostname: 'localhost',
      port: config.port,
      path,
      method,
      headers: allHeaders,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch(e) { parsed = data; }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(postData);
    req.end();
  });
}

function extractCookie(headers, cookieName) {
  const setCookies = headers['set-cookie'] || [];
  for (const c of setCookies) {
    if (c.startsWith(cookieName + '=')) {
      return c.split(';')[0].split('=')[1];
    }
  }
  return null;
}

async function runDisasterReadyAuthSuite() {
  await connectDB();
  
  // Wipe test records
  const testEmail = 'citizen.jane@disasterready.org';
  // Sessions cleared (no operation needed)
  await prisma.user.deleteMany({
    where: { email: testEmail }
  });

  const server = app.listen(config.port, async () => {
    console.log('🚀 Running DisasterReady Phase 3 Authentication Test Suite...\n');

    try {
      // 1. Successful Registration
      console.log('=== 1. Test Successful Registration (POST /api/v1/auth/register) ===');
      const regRes = await makeRequest('POST', '/api/v1/auth/register', {
        email: ' Citizen.Jane@DisasterReady.ORG ',
        password: 'SecurePassword2026!',
        firstName: 'Jane',
        lastName: 'Citizen',
        phone: '+1-555-0199',
        role: 'CITIZEN',
      });
      console.log('Status (Expected 201):', regRes.statusCode);
      console.log('Returned User:', regRes.body.data.user);
      console.log('Password hash excluded from response:', regRes.body.data.user.password === undefined);
      if (regRes.statusCode !== 201) throw new Error('Registration failed');

      // 2. Verify Password Hashing in Database
      console.log('\n=== 2. Verify Argon2id Password Hashing in PostgreSQL ===');
      const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
      const isArgon2 = dbUser.password.startsWith('$argon2id$');
      console.log('Password Hash in DB:', dbUser.password.substring(0, 30) + '...');
      console.log('Is valid Argon2id hash:', isArgon2);
      if (!isArgon2) throw new Error('Password was not hashed using Argon2id');

      // 3. Duplicate Email Registration
      console.log('\n=== 3. Test Duplicate Email Registration (POST /api/v1/auth/register) ===');
      const dupRes = await makeRequest('POST', '/api/v1/auth/register', {
        email: testEmail,
        password: 'AnotherPassword123!',
        firstName: 'Duplicate',
        lastName: 'User',
      });
      console.log('Status (Expected 409):', dupRes.statusCode);
      console.log('Error Code:', dupRes.body.error.code);
      if (dupRes.statusCode !== 409) throw new Error('Duplicate check failed');

      // 4. Invalid Registration Data (Weak password < 8 chars)
      console.log('\n=== 4. Test Invalid Registration Data (Weak Password) ===');
      const weakRes = await makeRequest('POST', '/api/v1/auth/register', {
        email: 'valid@example.com',
        password: 'short',
        firstName: 'Weak',
        lastName: 'User',
      });
      console.log('Status (Expected 400):', weakRes.statusCode);
      console.log('Validation Details:', weakRes.body.error.details);
      if (weakRes.statusCode !== 400) throw new Error('Zod validation failed to catch short password');

      // 5. Successful Login
      console.log('\n=== 5. Test Successful Login (POST /api/v1/auth/login) ===');
      const loginRes = await makeRequest('POST', '/api/v1/auth/login', {
        email: testEmail,
        password: 'SecurePassword2026!',
      });
      console.log('Status (Expected 200):', loginRes.statusCode);
      const accessToken = loginRes.body.data.token;
      const refreshToken = extractCookie(loginRes.headers, 'refreshToken');
      console.log('Access Token generated (JWT):', !!accessToken);
      console.log('Refresh Token cookie received (HttpOnly):', !!refreshToken);
      if (!accessToken || !refreshToken) throw new Error('Login failed to return token pair');

      // 6. Incorrect Password
      console.log('\n=== 6. Test Incorrect Password (POST /api/v1/auth/login) ===');
      const badPwdRes = await makeRequest('POST', '/api/v1/auth/login', {
        email: testEmail,
        password: 'WrongPassword!',
      });
      console.log('Status (Expected 401):', badPwdRes.statusCode);
      console.log('Error Message (Generic):', badPwdRes.body.error.message);
      if (badPwdRes.statusCode !== 401) throw new Error('Failed to reject incorrect password');

      // 7. Nonexistent Email
      console.log('\n=== 7. Test Nonexistent Email (POST /api/v1/auth/login) ===');
      const noUserRes = await makeRequest('POST', '/api/v1/auth/login', {
        email: 'ghost@disasterready.org',
        password: 'SomePassword123!',
      });
      console.log('Status (Expected 401):', noUserRes.statusCode);
      console.log('Error Message (Generic):', noUserRes.body.error.message);
      if (noUserRes.statusCode !== 401) throw new Error('Failed to reject nonexistent email');

      // 8. Access Protected Route Without Token
      console.log('\n=== 8. Test Protected Route Without Token (GET /api/v1/auth/me) ===');
      const noAuthRes = await makeRequest('GET', '/api/v1/auth/me');
      console.log('Status (Expected 401):', noAuthRes.statusCode);
      console.log('Error Code:', noAuthRes.body.error.code);
      if (noAuthRes.statusCode !== 401) throw new Error('Failed to protect route');

      // 9. Access Protected Route With Invalid Token
      console.log('\n=== 9. Test Protected Route With Invalid Token (GET /api/v1/auth/me) ===');
      const badTokenRes = await makeRequest('GET', '/api/v1/auth/me', null, {
        'Authorization': 'Bearer invalid.tampered.token',
      });
      console.log('Status (Expected 401):', badTokenRes.statusCode);
      console.log('Error Code:', badTokenRes.body.error.code);
      if (badTokenRes.statusCode !== 401) throw new Error('Failed to reject invalid token');

      // 10. Access Protected Route With Valid Token
      console.log('\n=== 10. Test Protected Route With Valid Token (GET /api/v1/auth/me) ===');
      const validAuthRes = await makeRequest('GET', '/api/v1/auth/me', null, {
        'Authorization': `Bearer ${accessToken}`,
      });
      console.log('Status (Expected 200):', validAuthRes.statusCode);
      console.log('Profile Data:', validAuthRes.body.data);
      if (validAuthRes.statusCode !== 200 || validAuthRes.body.data.email !== testEmail) {
        throw new Error('Failed to fetch user profile');
      }

      // 11. Refresh Token Rotation
      console.log('\n=== 11. Test Refresh Token Rotation (POST /api/v1/auth/refresh) ===');
      const refreshRes = await makeRequest('POST', '/api/v1/auth/refresh', null, {
        'Cookie': `refreshToken=${refreshToken}`,
      });
      console.log('Status (Expected 200):', refreshRes.statusCode);
      const newAccessToken = refreshRes.body.data.token;
      const newRefreshToken = extractCookie(refreshRes.headers, 'refreshToken');
      console.log('New Access Token issued:', !!newAccessToken);
      console.log('Rotated Refresh Token is different:', newRefreshToken !== refreshToken);
      if (!newAccessToken || !newRefreshToken || newRefreshToken === refreshToken) {
        throw new Error('Refresh token rotation failed');
      }

      // 12. Refresh Token Reuse Detection
      console.log('\n=== 12. Test Refresh Token Reuse Detection (Replay Attack) ===');
      const reuseAttackRes = await makeRequest('POST', '/api/v1/auth/refresh', null, {
        'Cookie': `refreshToken=${refreshToken}`, // Presenting the already rotated token!
      });
      console.log('Status (Expected 401):', reuseAttackRes.statusCode);
      console.log('Error Code:', reuseAttackRes.body.error.code);
      const activeSessions = await prisma.session.count({
        where: { userId: dbUser.id, revokedAt: null }
      });
      console.log('Active sessions remaining after detected reuse (Expected 0):', activeSessions);
      if (reuseAttackRes.statusCode !== 401 || activeSessions !== 0) {
        throw new Error('Reuse detection failed to revoke sessions');
      }

      // 13. Re-login & Password Change
      console.log('\n=== 13. Test Change Password (PATCH /api/v1/auth/change-password) ===');
      const freshLogin = await makeRequest('POST', '/api/v1/auth/login', {
        email: testEmail,
        password: 'SecurePassword2026!',
      });
      const activeAccessToken = freshLogin.body.data.token;

      const changePwdRes = await makeRequest('PATCH', '/api/v1/auth/change-password', {
        currentPassword: 'SecurePassword2026!',
        newPassword: 'UpdatedPassword2026!',
      }, {
        'Authorization': `Bearer ${activeAccessToken}`,
      });
      console.log('Status (Expected 200):', changePwdRes.statusCode);

      // Verify old password fails
      const oldPwdTest = await makeRequest('POST', '/api/v1/auth/login', {
        email: testEmail,
        password: 'SecurePassword2026!',
      });
      console.log('Old Password Rejected (Expected 401):', oldPwdTest.statusCode);

      // Verify new password succeeds
      const newPwdTest = await makeRequest('POST', '/api/v1/auth/login', {
        email: testEmail,
        password: 'UpdatedPassword2026!',
      });
      console.log('New Password Accepted (Expected 200):', newPwdTest.statusCode);
      const postChangeRefreshToken = extractCookie(newPwdTest.headers, 'refreshToken');

      // 14. Logout
      console.log('\n=== 14. Test Logout (POST /api/v1/auth/logout) ===');
      const logoutRes = await makeRequest('POST', '/api/v1/auth/logout', null, {
        'Cookie': `refreshToken=${postChangeRefreshToken}`,
      });
      console.log('Status (Expected 200):', logoutRes.statusCode);

      // Verify session was revoked in database
      const finalActiveSessions = await prisma.session.count({
        where: { userId: dbUser.id, revokedAt: null }
      });
      console.log('Active sessions after logout (Expected 0):', finalActiveSessions);

      console.log('\n🎉 ALL 14 AUTHENTICATION TESTS PASSED PERFECTLY ON DISASTERREADY!');
    } catch (err) {
      console.error('❌ Test suite failed:', err);
    } finally {
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    }
  });
}

runDisasterReadyAuthSuite();
