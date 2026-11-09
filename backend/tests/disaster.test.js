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
    const req = http.request(
      {
        hostname: 'localhost',
        port: config.port,
        path,
        method,
        headers: allHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(postData);
    req.end();
  });
}

async function runDisasterTests() {
  await connectDB();

  // Test emails and accounts
  const adminEmail = 'admin.disaster.test@disasterready.org';
  const citizenEmail = 'citizen.disaster.test@disasterready.org';

  // Wipe test users and disasters
  await prisma.session.deleteMany({
    where: { user: { email: { in: [adminEmail, citizenEmail] } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: [adminEmail, citizenEmail] } },
  });
  await prisma.disaster.deleteMany({
    where: {
      name: {
        in: [
          'Test Earthquake Alpha',
          'Test Flood Beta',
          'Test Cyclone Gamma',
          'Updated Earthquake Alpha',
        ],
      },
    },
  });

  const server = app.listen(config.port, async () => {
    console.log('🚀 Running DisasterReady Phase 4 Disaster Management Test Suite...\n');

    let adminToken = null;
    let citizenToken = null;
    let createdDisasterId = null;

    try {
      // Setup: Register a user, promote to ADMIN directly in DB, then login to get admin token
      console.log('=== Setup: Register & prepare ADMIN user ===');
      const adminReg = await makeRequest('POST', '/api/v1/auth/register', {
        email: adminEmail,
        password: 'AdminPassword2026!',
        firstName: 'Disaster',
        lastName: 'Admin',
      });
      console.log('Admin user registration status:', adminReg.statusCode);
      if (adminReg.statusCode !== 201) throw new Error('Admin user registration failed');

      // Promote to ADMIN role directly in the database
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'ADMIN' },
      });

      // Login as ADMIN to get a fresh token with ADMIN role
      const adminLogin = await makeRequest('POST', '/api/v1/auth/login', {
        email: adminEmail,
        password: 'AdminPassword2026!',
      });
      console.log('Admin login status:', adminLogin.statusCode);
      adminToken = adminLogin.body.data.token;

      // Setup: Register CITIZEN user
      console.log('=== Setup: Register CITIZEN user ===');
      const citizenReg = await makeRequest('POST', '/api/v1/auth/register', {
        email: citizenEmail,
        password: 'CitizenPassword2026!',
        firstName: 'Disaster',
        lastName: 'Citizen',
      });
      console.log('Citizen registration status:', citizenReg.statusCode);
      if (citizenReg.statusCode !== 201) throw new Error('Citizen registration failed');
      citizenToken = citizenReg.body.data.token;

      // 1. Create disaster (ADMIN, valid data) -> 201
      console.log('\n=== 1. Test Successful Disaster Creation (POST /api/v1/disasters) ===');
      const createRes = await makeRequest(
        'POST',
        '/api/v1/disasters',
        {
          name: 'Test Earthquake Alpha',
          type: 'EARTHQUAKE',
          description: 'A severe simulated seismic event.',
          guidelines: 'Drop, Cover, and Hold On.',
          iconUrl: 'https://example.com/icons/earthquake.svg',
        },
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log('Status (Expected 201):', createRes.statusCode);
      console.log('Created disaster name:', createRes.body.data.name);
      console.log('Created disaster ID:', createRes.body.data.id);
      if (createRes.statusCode !== 201) throw new Error('Disaster creation failed');
      createdDisasterId = createRes.body.data.id;

      // 2. Create disaster with missing required fields -> 400 VALIDATION_ERROR
      console.log('\n=== 2. Test Disaster Creation with Missing Required Fields ===');
      const missingFieldsRes = await makeRequest(
        'POST',
        '/api/v1/disasters',
        { name: 'Incomplete Disaster' },
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log('Status (Expected 400):', missingFieldsRes.statusCode);
      console.log('Error Code:', missingFieldsRes.body.error.code);
      if (missingFieldsRes.statusCode !== 400) throw new Error('Missing fields check failed');

      // 3. Create disaster with invalid type enum -> 400 VALIDATION_ERROR
      console.log('\n=== 3. Test Disaster Creation with Invalid Type Enum ===');
      const invalidTypeRes = await makeRequest(
        'POST',
        '/api/v1/disasters',
        {
          name: 'Invalid Type Disaster',
          type: 'ALIEN_INVASION',
          description: 'Not a real disaster type.',
        },
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log('Status (Expected 400):', invalidTypeRes.statusCode);
      console.log('Error Code:', invalidTypeRes.body.error.code);
      if (invalidTypeRes.statusCode !== 400) throw new Error('Invalid type check failed');

      // 4. Create disaster with duplicate name -> 409 CONFLICT
      console.log('\n=== 4. Test Duplicate Disaster Name (POST /api/v1/disasters) ===');
      const duplicateRes = await makeRequest(
        'POST',
        '/api/v1/disasters',
        {
          name: 'Test Earthquake Alpha',
          type: 'EARTHQUAKE',
          description: 'Another earthquake with same name.',
        },
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log('Status (Expected 409):', duplicateRes.statusCode);
      console.log('Error Code:', duplicateRes.body.error.code);
      if (duplicateRes.statusCode !== 409) throw new Error('Duplicate check failed');

      // 5. Create disaster as CITIZEN (unauthorized) -> 403 FORBIDDEN
      console.log('\n=== 5. Test Disaster Creation as CITIZEN (Role-based restriction) ===');
      const forbiddenRes = await makeRequest(
        'POST',
        '/api/v1/disasters',
        {
          name: 'Citizen Attempted Disaster',
          type: 'FLOOD',
          description: 'Citizen trying to create disaster.',
        },
        { Authorization: `Bearer ${citizenToken}` }
      );
      console.log('Status (Expected 403):', forbiddenRes.statusCode);
      console.log('Error Code:', forbiddenRes.body.error.code);
      if (forbiddenRes.statusCode !== 403) throw new Error('Role-based check failed');

      // 6. Create disaster without JWT -> 401 AUTHENTICATION_REQUIRED
      console.log('\n=== 6. Test Disaster Creation Without JWT ===');
      const noAuthRes = await makeRequest('POST', '/api/v1/disasters', {
        name: 'Unauthenticated Disaster',
        type: 'FLOOD',
        description: 'No token provided.',
      });
      console.log('Status (Expected 401):', noAuthRes.statusCode);
      console.log('Error Code:', noAuthRes.body.error.code);
      if (noAuthRes.statusCode !== 401) throw new Error('Auth check failed');

      // Create a second disaster for filtering/search tests
      await makeRequest(
        'POST',
        '/api/v1/disasters',
        {
          name: 'Test Flood Beta',
          type: 'FLOOD',
          description: 'A major river overflow event.',
          guidelines: 'Move to higher ground.',
        },
        { Authorization: `Bearer ${adminToken}` }
      );

      // 7. Get all disasters (public, no auth) -> 200
      console.log('\n=== 7. Test Get All Disasters (Public, GET /api/v1/disasters) ===');
      const getAllRes = await makeRequest('GET', '/api/v1/disasters');
      console.log('Status (Expected 200):', getAllRes.statusCode);
      console.log('Disasters count:', getAllRes.body.data.length);
      console.log('Pagination info:', getAllRes.body.pagination);
      if (getAllRes.statusCode !== 200 || !Array.isArray(getAllRes.body.data)) {
        throw new Error('Get all disasters failed');
      }

      // 8. Filter disasters by type -> 200
      console.log('\n=== 8. Test Filter Disasters by Type (?type=FLOOD) ===');
      const filterRes = await makeRequest('GET', '/api/v1/disasters?type=FLOOD');
      console.log('Status (Expected 200):', filterRes.statusCode);
      const allFloods = filterRes.body.data.every((d) => d.type === 'FLOOD');
      console.log('All returned items have type FLOOD:', allFloods);
      if (filterRes.statusCode !== 200 || !allFloods) {
        throw new Error('Filter by type failed');
      }

      // 9. Search disasters -> 200
      console.log('\n=== 9. Test Search Disasters (?search=Alpha) ===');
      const searchRes = await makeRequest('GET', '/api/v1/disasters?search=Alpha');
      console.log('Status (Expected 200):', searchRes.statusCode);
      console.log('Found matching count:', searchRes.body.data.length);
      const matchesSearch = searchRes.body.data.some((d) => d.name.includes('Alpha'));
      console.log('Matches search query:', matchesSearch);
      if (searchRes.statusCode !== 200 || !matchesSearch) {
        throw new Error('Search failed');
      }

      // 10. Pagination -> 200
      console.log('\n=== 10. Test Pagination (?page=1&limit=1) ===');
      const pageRes = await makeRequest('GET', '/api/v1/disasters?page=1&limit=1');
      console.log('Status (Expected 200):', pageRes.statusCode);
      console.log('Items returned (Expected 1):', pageRes.body.data.length);
      console.log('Total items in DB:', pageRes.body.pagination.total);
      console.log('Total pages calculated:', pageRes.body.pagination.totalPages);
      if (
        pageRes.statusCode !== 200 ||
        pageRes.body.data.length !== 1 ||
        pageRes.body.pagination.page !== 1 ||
        pageRes.body.pagination.limit !== 1
      ) {
        throw new Error('Pagination failed');
      }

      // 11. Get disaster by ID -> 200
      console.log('\n=== 11. Test Get Disaster by ID (GET /api/v1/disasters/:id) ===');
      const getByIdRes = await makeRequest('GET', `/api/v1/disasters/${createdDisasterId}`);
      console.log('Status (Expected 200):', getByIdRes.statusCode);
      console.log('Retrieved name:', getByIdRes.body.data.name);
      console.log('Retrieved type:', getByIdRes.body.data.type);
      if (getByIdRes.statusCode !== 200 || getByIdRes.body.data.id !== createdDisasterId) {
        throw new Error('Get by ID failed');
      }

      // 12. Get disaster by nonexistent ID -> 404 NOT_FOUND
      console.log('\n=== 12. Test Get Disaster by Nonexistent ID ===');
      const notFoundRes = await makeRequest(
        'GET',
        '/api/v1/disasters/00000000-0000-0000-0000-000000000000'
      );
      console.log('Status (Expected 404):', notFoundRes.statusCode);
      console.log('Error Code:', notFoundRes.body.error.code);
      if (notFoundRes.statusCode !== 404) throw new Error('Not found check failed');

      // 13. Update disaster (ADMIN) -> 200
      console.log('\n=== 13. Test Update Disaster (PATCH /api/v1/disasters/:id) ===');
      const updateRes = await makeRequest(
        'PATCH',
        `/api/v1/disasters/${createdDisasterId}`,
        {
          name: 'Updated Earthquake Alpha',
          guidelines: 'Updated guidelines: Stay calm and duck under a table.',
        },
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log('Status (Expected 200):', updateRes.statusCode);
      console.log('Updated name:', updateRes.body.data.name);
      console.log('Updated guidelines:', updateRes.body.data.guidelines);
      if (
        updateRes.statusCode !== 200 ||
        updateRes.body.data.name !== 'Updated Earthquake Alpha'
      ) {
        throw new Error('Update failed');
      }

      // 14. Update disaster as CITIZEN (forbidden) -> 403
      console.log('\n=== 14. Test Update Disaster as CITIZEN (Forbidden) ===');
      const citizenUpdateRes = await makeRequest(
        'PATCH',
        `/api/v1/disasters/${createdDisasterId}`,
        { name: 'Unauthorized Change' },
        { Authorization: `Bearer ${citizenToken}` }
      );
      console.log('Status (Expected 403):', citizenUpdateRes.statusCode);
      if (citizenUpdateRes.statusCode !== 403) throw new Error('Citizen update check failed');

      // 15. Delete disaster (ADMIN) -> 200
      console.log('\n=== 15. Test Delete Disaster (DELETE /api/v1/disasters/:id) ===');
      const deleteRes = await makeRequest(
        'DELETE',
        `/api/v1/disasters/${createdDisasterId}`,
        null,
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log('Status (Expected 200):', deleteRes.statusCode);
      console.log('Message:', deleteRes.body.message);
      if (deleteRes.statusCode !== 200) throw new Error('Delete failed');

      // Verify deletion
      const verifyDelete = await makeRequest('GET', `/api/v1/disasters/${createdDisasterId}`);
      console.log('Verification status (Expected 404):', verifyDelete.statusCode);
      if (verifyDelete.statusCode !== 404) throw new Error('Disaster was not deleted');

      // 16. Delete nonexistent disaster -> 404
      console.log('\n=== 16. Test Delete Nonexistent Disaster ===');
      const deleteNotFound = await makeRequest(
        'DELETE',
        `/api/v1/disasters/${createdDisasterId}`,
        null,
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log('Status (Expected 404):', deleteNotFound.statusCode);
      if (deleteNotFound.statusCode !== 404) throw new Error('Delete 404 check failed');

      // Cleanup
      await prisma.disaster.deleteMany({
        where: { name: { in: ['Test Flood Beta', 'Updated Earthquake Alpha'] } },
      });
      await prisma.session.deleteMany({
        where: { user: { email: { in: [adminEmail, citizenEmail] } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [adminEmail, citizenEmail] } },
      });

      console.log('\n🎉 ALL 16 DISASTER MANAGEMENT TESTS PASSED PERFECTLY!');
    } catch (err) {
      console.error('❌ Test suite failed:', err);
      process.exitCode = 1;
    } finally {
      server.close(async () => {
        await disconnectDB();
        process.exit(process.exitCode || 0);
      });
    }
  });
}

runDisasterTests();
