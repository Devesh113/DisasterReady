const app = require('../src/app');
const config = require('../src/config/env');
const { prisma, connectDB, disconnectDB } = require('../src/config/db');
const http = require('http');
const {
  calculateHaversineDistance,
  getBoundingBox,
  isWithinRadius,
  isValidCoordinates,
  isValidRadius,
} = require('../src/utils/geo');

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

async function runAlertTestSuite() {
  await connectDB();

  // Test accounts
  const adminEmail = 'alert.admin.test@disasterready.org';
  const authorityEmail = 'alert.authority.test@disasterready.org';
  const authority2Email = 'alert.authority2.test@disasterready.org';
  const citizenEmail = 'alert.citizen.test@disasterready.org';
  const allTestEmails = [adminEmail, authorityEmail, authority2Email, citizenEmail];

  // Test disasters
  const testDisasterFloodName = 'Test Alert Disaster Flood';
  const testDisasterQuakeName = 'Test Alert Disaster Earthquake';
  const allTestDisasterNames = [testDisasterFloodName, testDisasterQuakeName];

  // Safe pre-test cleanup
  await prisma.session.deleteMany({
    where: { user: { email: { in: allTestEmails } } },
  });
  await prisma.alert.deleteMany({
    where: {
      OR: [
        { issuedBy: { email: { in: allTestEmails } } },
        { disaster: { name: { in: allTestDisasterNames } } },
      ],
    },
  });
  await prisma.disaster.deleteMany({
    where: { name: { in: allTestDisasterNames } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: allTestEmails } },
  });

  const server = app.listen(config.port, async () => {
    console.log('🚀 Running DisasterReady Phase 5 Alert Management Test Suite...\n');

    let adminToken = null;
    let authorityToken = null;
    let authority2Token = null;
    let citizenToken = null;
    let authorityUserId = null;
    let floodDisasterId = null;
    let quakeDisasterId = null;

    let createdAlertId = null;
    let secondAlertId = null;

    try {
      // ======================================================================
      // 0. Geospatial Utility Unit Tests
      // ======================================================================
      console.log('=== 0. Geospatial Helper Tests ===');

      // London to Paris ~343-344 km
      const distanceLondonParis = calculateHaversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
      console.log('Calculated London-Paris distance (km):', Math.round(distanceLondonParis));
      if (distanceLondonParis < 340 || distanceLondonParis > 350) {
        throw new Error('Haversine distance calculation inaccurate');
      }

      // Same point distance should be 0
      const distanceSelf = calculateHaversineDistance(18.5204, 73.8567, 18.5204, 73.8567);
      console.log('Same point distance (km):', distanceSelf);
      if (distanceSelf !== 0) throw new Error('Same-point distance must be 0');

      // Invalid coordinates check
      if (isValidCoordinates(95, 0) || isValidCoordinates(0, -190) || !isValidCoordinates(18.5, 73.8)) {
        throw new Error('Coordinate validation failed');
      }

      // Invalid radius check
      if (isValidRadius(-5) || isValidRadius(0) || !isValidRadius(10)) {
        throw new Error('Radius validation failed');
      }

      // Bounding box test
      const bbox = getBoundingBox(18.5204, 73.8567, 15);
      console.log('Calculated bounding box:', bbox);
      if (bbox.minLat >= bbox.maxLat || bbox.minLon >= bbox.maxLon) {
        throw new Error('Bounding box calculation invalid');
      }

      // Proximity check
      const within15 = isWithinRadius(18.5204, 73.8567, 18.525, 73.86, 15);
      const outside15 = isWithinRadius(18.5204, 73.8567, 28.6139, 77.209, 15);
      console.log('Nearby point within 15km:', within15);
      console.log('Far point within 15km:', outside15);
      if (!within15 || outside15) throw new Error('isWithinRadius check failed');

      console.log('✅ Geospatial utility tests passed successfully!\n');

      // ======================================================================
      // Setup: Disasters & Users
      // ======================================================================
      console.log('=== Setup: Seed Test Disasters & Users ===');

      // Seed Flood Disaster
      const floodDisaster = await prisma.disaster.create({
        data: {
          name: testDisasterFloodName,
          type: 'FLOOD',
          description: 'Riverine and urban flash flooding reference model.',
        },
      });
      floodDisasterId = floodDisaster.id;

      // Seed Earthquake Disaster
      const quakeDisaster = await prisma.disaster.create({
        data: {
          name: testDisasterQuakeName,
          type: 'EARTHQUAKE',
          description: 'Tectonic rupture and seismic advisory model.',
        },
      });
      quakeDisasterId = quakeDisaster.id;

      // Register & elevate ADMIN user
      await makeRequest('POST', '/api/v1/auth/register', {
        email: adminEmail,
        password: 'AdminPassword2026!',
        firstName: 'Alert',
        lastName: 'Admin',
      });
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'ADMIN' },
      });
      const adminLogin = await makeRequest('POST', '/api/v1/auth/login', {
        email: adminEmail,
        password: 'AdminPassword2026!',
      });
      adminToken = adminLogin.body.data.token;

      // Register & elevate AUTHORITY user
      await makeRequest('POST', '/api/v1/auth/register', {
        email: authorityEmail,
        password: 'AuthorityPassword2026!',
        firstName: 'Primary',
        lastName: 'Authority',
      });
      const updatedAuthUser = await prisma.user.update({
        where: { email: authorityEmail },
        data: { role: 'AUTHORITY' },
      });
      authorityUserId = updatedAuthUser.id;
      const authLogin = await makeRequest('POST', '/api/v1/auth/login', {
        email: authorityEmail,
        password: 'AuthorityPassword2026!',
      });
      authorityToken = authLogin.body.data.token;

      // Register & elevate second AUTHORITY user
      await makeRequest('POST', '/api/v1/auth/register', {
        email: authority2Email,
        password: 'AuthorityPassword2026!',
        firstName: 'Second',
        lastName: 'Authority',
      });
      await prisma.user.update({
        where: { email: authority2Email },
        data: { role: 'AUTHORITY' },
      });
      const auth2Login = await makeRequest('POST', '/api/v1/auth/login', {
        email: authority2Email,
        password: 'AuthorityPassword2026!',
      });
      authority2Token = auth2Login.body.data.token;

      // Register CITIZEN user
      const citReg = await makeRequest('POST', '/api/v1/auth/register', {
        email: citizenEmail,
        password: 'CitizenPassword2026!',
        firstName: 'Ordinary',
        lastName: 'Citizen',
      });
      citizenToken = citReg.body.data.token;

      console.log('Setup completed successfully.\n');

      // ======================================================================
      // 1. Create alert successfully as AUTHORITY
      // ======================================================================
      console.log('=== 1. Test Create Alert as AUTHORITY (POST /api/v1/alerts) ===');
      const createRes = await makeRequest(
        'POST',
        '/api/v1/alerts',
        {
          title: 'Flash Flood Warning — Downtown River Basin',
          description: 'Water levels rising rapidly along riverside districts. Immediate evacuation advised.',
          severity: 'HIGH',
          status: 'ACTIVE',
          latitude: 18.5204,
          longitude: 73.8567,
          radius: 12.5,
          expiresAt: '2026-12-31T23:59:59.000Z',
          disasterId: floodDisasterId,
        },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 201):', createRes.statusCode);
      console.log('Created Alert Title:', createRes.body.data?.title);
      console.log('Created Alert ID:', createRes.body.data?.id);
      if (createRes.statusCode !== 201) throw new Error('Create alert as AUTHORITY failed');
      createdAlertId = createRes.body.data.id;

      // ======================================================================
      // 2. Create alert successfully as ADMIN
      // ======================================================================
      console.log('\n=== 2. Test Create Alert as ADMIN (POST /api/v1/alerts) ===');
      const adminAlertRes = await makeRequest(
        'POST',
        '/api/v1/alerts',
        {
          title: 'Critical Earthquake Alarm — Western Faultline',
          description: 'Major seismic shockwave observed. Prepare for severe tremors.',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          latitude: 28.6139,
          longitude: 77.209,
          radius: 50.0,
          disasterId: quakeDisasterId,
        },
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log('Status (Expected 201):', adminAlertRes.statusCode);
      if (adminAlertRes.statusCode !== 201) throw new Error('Create alert as ADMIN failed');
      secondAlertId = adminAlertRes.body.data.id;

      // ======================================================================
      // 3. Reject creation by CITIZEN
      // ======================================================================
      console.log('\n=== 3. Test Reject Creation by CITIZEN ===');
      const citizenCreateRes = await makeRequest(
        'POST',
        '/api/v1/alerts',
        {
          title: 'Unauthorized Citizen Alert',
          description: 'Citizen trying to trigger panic.',
          severity: 'CRITICAL',
          disasterId: floodDisasterId,
        },
        { Authorization: `Bearer ${citizenToken}` }
      );
      console.log('Status (Expected 403):', citizenCreateRes.statusCode);
      if (citizenCreateRes.statusCode !== 403) throw new Error('Citizen alert creation was not rejected');

      // ======================================================================
      // 4. Reject creation without authentication
      // ======================================================================
      console.log('\n=== 4. Test Reject Creation Without Authentication ===');
      const unauthRes = await makeRequest('POST', '/api/v1/alerts', {
        title: 'Unauthenticated Alert',
        description: 'No token passed.',
        severity: 'LOW',
        disasterId: floodDisasterId,
      });
      console.log('Status (Expected 401):', unauthRes.statusCode);
      if (unauthRes.statusCode !== 401) throw new Error('Unauthenticated creation was not rejected');

      // ======================================================================
      // 5. Reject missing required fields
      // ======================================================================
      console.log('\n=== 5. Test Reject Missing Required Fields ===');
      const missingFieldsRes = await makeRequest(
        'POST',
        '/api/v1/alerts',
        { title: 'Incomplete Alert' },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 400):', missingFieldsRes.statusCode);
      console.log('Error Code:', missingFieldsRes.body.error?.code);
      if (missingFieldsRes.statusCode !== 400) throw new Error('Missing fields check failed');

      // ======================================================================
      // 6. Reject invalid severity
      // ======================================================================
      console.log('\n=== 6. Test Reject Invalid Severity ===');
      const invalidSevRes = await makeRequest(
        'POST',
        '/api/v1/alerts',
        {
          title: 'Invalid Severity Alert',
          description: 'Has fake severity.',
          severity: 'SUPER_CRITICAL',
          disasterId: floodDisasterId,
        },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 400):', invalidSevRes.statusCode);
      if (invalidSevRes.statusCode !== 400) throw new Error('Invalid severity check failed');

      // ======================================================================
      // 7. Reject invalid status
      // ======================================================================
      console.log('\n=== 7. Test Reject Invalid Status ===');
      const invalidStatusRes = await makeRequest(
        'POST',
        '/api/v1/alerts',
        {
          title: 'Invalid Status Alert',
          description: 'Has fake status.',
          severity: 'LOW',
          status: 'PENDING_REVIEW',
          disasterId: floodDisasterId,
        },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 400):', invalidStatusRes.statusCode);
      if (invalidStatusRes.statusCode !== 400) throw new Error('Invalid status check failed');

      // ======================================================================
      // 8. Reject invalid coordinates
      // ======================================================================
      console.log('\n=== 8. Test Reject Invalid Coordinates ===');
      const invalidCoordsRes = await makeRequest(
        'POST',
        '/api/v1/alerts',
        {
          title: 'Invalid Coordinates Alert',
          description: 'Has impossible latitude.',
          severity: 'LOW',
          latitude: 195.0,
          longitude: 73.0,
          disasterId: floodDisasterId,
        },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 400):', invalidCoordsRes.statusCode);
      if (invalidCoordsRes.statusCode !== 400) throw new Error('Invalid coordinates check failed');

      // ======================================================================
      // 9. Reject invalid radius
      // ======================================================================
      console.log('\n=== 9. Test Reject Invalid Radius ===');
      const invalidRadiusRes = await makeRequest(
        'POST',
        '/api/v1/alerts',
        {
          title: 'Invalid Radius Alert',
          description: 'Has negative radius.',
          severity: 'LOW',
          radius: -10,
          disasterId: floodDisasterId,
        },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 400):', invalidRadiusRes.statusCode);
      if (invalidRadiusRes.statusCode !== 400) throw new Error('Invalid radius check failed');

      // ======================================================================
      // 10. Reject nonexistent disaster
      // ======================================================================
      console.log('\n=== 10. Test Reject Nonexistent Disaster ===');
      const fakeDisasterRes = await makeRequest(
        'POST',
        '/api/v1/alerts',
        {
          title: 'Ghost Disaster Alert',
          description: 'Points to missing disaster UUID.',
          severity: 'LOW',
          disasterId: '00000000-0000-0000-0000-000000000000',
        },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 404):', fakeDisasterRes.statusCode);
      if (fakeDisasterRes.statusCode !== 404) throw new Error('Nonexistent disaster check failed');

      // ======================================================================
      // 11. Verify authority association (derived securely from req.user)
      // ======================================================================
      console.log('\n=== 11. Test Authority Association Security ===');
      // Even if an attacker injects a fake authorityId, it must be ignored or bound to req.user.id
      const spoofedRes = await makeRequest(
        'POST',
        '/api/v1/alerts',
        {
          title: 'Spoofed Authority Attempt',
          description: 'Attempting to impersonate someone else.',
          severity: 'LOW',
          disasterId: floodDisasterId,
          issuedById: '11111111-1111-1111-1111-111111111111',
          authorityId: '11111111-1111-1111-1111-111111111111',
        },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Associated Authority ID in DB:', spoofedRes.body.data?.issuedBy?.id);
      console.log('Matches actual Authenticated User ID:', spoofedRes.body.data?.issuedBy?.id === authorityUserId);
      if (spoofedRes.body.data?.issuedBy?.id !== authorityUserId) {
        throw new Error('Authority impersonation vulnerability detected!');
      }

      // ======================================================================
      // 12. Public listing (GET /api/v1/alerts)
      // ======================================================================
      console.log('\n=== 12. Test Public Listing (GET /api/v1/alerts) ===');
      const publicListRes = await makeRequest('GET', '/api/v1/alerts');
      console.log('Status (Expected 200):', publicListRes.statusCode);
      console.log('Alerts returned:', publicListRes.body.data?.length);
      console.log('Pagination info:', publicListRes.body.pagination);
      if (publicListRes.statusCode !== 200 || !Array.isArray(publicListRes.body.data)) {
        throw new Error('Public alert listing failed');
      }

      // ======================================================================
      // 13. Filter by severity
      // ======================================================================
      console.log('\n=== 13. Test Filter by Severity (?severity=CRITICAL) ===');
      const critRes = await makeRequest('GET', '/api/v1/alerts?severity=CRITICAL');
      console.log('Status (Expected 200):', critRes.statusCode);
      const allCritical = critRes.body.data.every((a) => a.severity === 'CRITICAL');
      console.log('All returned items have severity CRITICAL:', allCritical);
      if (critRes.statusCode !== 200 || !allCritical) throw new Error('Filter by severity failed');

      // ======================================================================
      // 14. Filter by status
      // ======================================================================
      console.log('\n=== 14. Test Filter by Status (?status=ACTIVE) ===');
      const activeRes = await makeRequest('GET', '/api/v1/alerts?status=ACTIVE');
      console.log('Status (Expected 200):', activeRes.statusCode);
      const allActive = activeRes.body.data.every((a) => a.status === 'ACTIVE');
      console.log('All returned items have status ACTIVE:', allActive);
      if (activeRes.statusCode !== 200 || !allActive) throw new Error('Filter by status failed');

      // ======================================================================
      // 15. Filter by disaster type
      // ======================================================================
      console.log('\n=== 15. Test Filter by Disaster Type (?disasterType=FLOOD) ===');
      const floodRes = await makeRequest('GET', '/api/v1/alerts?disasterType=FLOOD');
      console.log('Status (Expected 200):', floodRes.statusCode);
      const allFloods = floodRes.body.data.every((a) => a.disaster?.type === 'FLOOD');
      console.log('All returned alerts are tied to FLOOD disaster:', allFloods);
      if (floodRes.statusCode !== 200 || !allFloods) throw new Error('Filter by disaster type failed');

      // ======================================================================
      // 16. Geographic filtering
      // ======================================================================
      console.log('\n=== 16. Test Geographic Filtering (Pune Center radius 15km) ===');
      // Pune coordinates (18.5204, 73.8567) with radius 15km should include Pune Flood Alert, exclude Delhi Quake Alert
      const geoRes = await makeRequest('GET', '/api/v1/alerts?latitude=18.5204&longitude=73.8567&radius=15');
      console.log('Status (Expected 200):', geoRes.statusCode);
      console.log('Matching alerts within 15km:', geoRes.body.data?.length);
      const containsCreatedAlert = geoRes.body.data.some((a) => a.id === createdAlertId);
      const excludesFarAlert = !geoRes.body.data.some((a) => a.id === secondAlertId);
      console.log('Includes local Pune alert:', containsCreatedAlert);
      console.log('Excludes far Delhi alert:', excludesFarAlert);
      if (geoRes.statusCode !== 200 || !containsCreatedAlert || !excludesFarAlert) {
        throw new Error('Geographic proximity filtering failed');
      }

      // ======================================================================
      // 17. Combined filters
      // ======================================================================
      console.log('\n=== 17. Test Combined Filters (severity=CRITICAL & disasterType=EARTHQUAKE) ===');
      const combinedRes = await makeRequest('GET', '/api/v1/alerts?severity=CRITICAL&disasterType=EARTHQUAKE');
      console.log('Status (Expected 200):', combinedRes.statusCode);
      const matchBoth = combinedRes.body.data.every(
        (a) => a.severity === 'CRITICAL' && a.disaster?.type === 'EARTHQUAKE'
      );
      console.log('All matches meet combined criteria:', matchBoth);
      if (combinedRes.statusCode !== 200 || !matchBoth) throw new Error('Combined filter failed');

      // ======================================================================
      // 18. Pagination
      // ======================================================================
      console.log('\n=== 18. Test Pagination (?page=1&limit=1) ===');
      const pageRes = await makeRequest('GET', '/api/v1/alerts?page=1&limit=1');
      console.log('Status (Expected 200):', pageRes.statusCode);
      console.log('Count returned (Expected 1):', pageRes.body.data?.length);
      console.log('Pagination total:', pageRes.body.pagination?.total);
      if (pageRes.statusCode !== 200 || pageRes.body.data?.length !== 1 || pageRes.body.pagination?.limit !== 1) {
        throw new Error('Pagination failed');
      }

      // ======================================================================
      // 19. Get alert by ID
      // ======================================================================
      console.log('\n=== 19. Test Get Alert by ID (GET /api/v1/alerts/:id) ===');
      const getByIdRes = await makeRequest('GET', `/api/v1/alerts/${createdAlertId}`);
      console.log('Status (Expected 200):', getByIdRes.statusCode);
      console.log('Retrieved title:', getByIdRes.body.data?.title);
      console.log('Includes disaster:', !!getByIdRes.body.data?.disaster?.name);
      console.log('Includes authority:', !!getByIdRes.body.data?.issuedBy?.firstName);
      if (getByIdRes.statusCode !== 200 || getByIdRes.body.data?.id !== createdAlertId) {
        throw new Error('Get alert by ID failed');
      }

      // ======================================================================
      // 20. Get nonexistent alert
      // ======================================================================
      console.log('\n=== 20. Test Get Nonexistent Alert ===');
      const nonExistentRes = await makeRequest('GET', '/api/v1/alerts/00000000-0000-0000-0000-000000000000');
      console.log('Status (Expected 404):', nonExistentRes.statusCode);
      if (nonExistentRes.statusCode !== 404) throw new Error('Nonexistent alert check failed');

      // ======================================================================
      // 21. Update description
      // ======================================================================
      console.log('\n=== 21. Test Update Description (PATCH /api/v1/alerts/:id) ===');
      const updatedDescText = 'Updated flood situation: Water receding slowly, exercise caution.';
      const updateDescRes = await makeRequest(
        'PATCH',
        `/api/v1/alerts/${createdAlertId}`,
        { description: updatedDescText },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 200):', updateDescRes.statusCode);
      console.log('Updated description matches:', updateDescRes.body.data?.description === updatedDescText);
      if (updateDescRes.statusCode !== 200 || updateDescRes.body.data?.description !== updatedDescText) {
        throw new Error('Update description failed');
      }

      // ======================================================================
      // 22. Update status to EXPIRED
      // ======================================================================
      console.log('\n=== 22. Test Update Status to EXPIRED ===');
      const expireRes = await makeRequest(
        'PATCH',
        `/api/v1/alerts/${createdAlertId}`,
        { status: 'EXPIRED' },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 200):', expireRes.statusCode);
      console.log('New status in DB:', expireRes.body.data?.status);
      if (expireRes.statusCode !== 200 || expireRes.body.data?.status !== 'EXPIRED') {
        throw new Error('Update status to EXPIRED failed');
      }

      // ======================================================================
      // 23. Update status to CANCELLED
      // ======================================================================
      console.log('\n=== 23. Test Update Status to CANCELLED ===');
      const cancelRes = await makeRequest(
        'PATCH',
        `/api/v1/alerts/${createdAlertId}`,
        { status: 'CANCELLED' },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 200):', cancelRes.statusCode);
      console.log('New status in DB:', cancelRes.body.data?.status);
      if (cancelRes.statusCode !== 200 || cancelRes.body.data?.status !== 'CANCELLED') {
        throw new Error('Update status to CANCELLED failed');
      }

      // ======================================================================
      // 24. Reject unauthorized updates
      // ======================================================================
      console.log('\n=== 24. Test Reject Unauthorized Updates ===');
      // Citizen attempting update
      const citUpdate = await makeRequest(
        'PATCH',
        `/api/v1/alerts/${createdAlertId}`,
        { description: 'Citizen hacked description' },
        { Authorization: `Bearer ${citizenToken}` }
      );
      console.log('Citizen update status (Expected 403):', citUpdate.statusCode);

      // Non-creator authority attempting update
      const otherAuthUpdate = await makeRequest(
        'PATCH',
        `/api/v1/alerts/${createdAlertId}`,
        { description: 'Different authority trying to edit' },
        { Authorization: `Bearer ${authority2Token}` }
      );
      console.log('Non-creator Authority update status (Expected 403):', otherAuthUpdate.statusCode);

      if (citUpdate.statusCode !== 403 || otherAuthUpdate.statusCode !== 403) {
        throw new Error('Unauthorized update restrictions failed');
      }

      // ======================================================================
      // 25. Reject invalid updates
      // ======================================================================
      console.log('\n=== 25. Test Reject Invalid Updates ===');
      const invalidUpdate = await makeRequest(
        'PATCH',
        `/api/v1/alerts/${createdAlertId}`,
        { severity: 'NOT_A_SEVERITY' },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 400):', invalidUpdate.statusCode);
      if (invalidUpdate.statusCode !== 400) throw new Error('Invalid update check failed');

      // ======================================================================
      // 26. Delete as ADMIN
      // ======================================================================
      console.log('\n=== 26. Test Delete as ADMIN (DELETE /api/v1/alerts/:id) ===');
      const deleteAdminRes = await makeRequest(
        'DELETE',
        `/api/v1/alerts/${createdAlertId}`,
        null,
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log('Status (Expected 200):', deleteAdminRes.statusCode);
      const verifyDeleted = await makeRequest('GET', `/api/v1/alerts/${createdAlertId}`);
      console.log('Subsequent GET status (Expected 404):', verifyDeleted.statusCode);
      if (deleteAdminRes.statusCode !== 200 || verifyDeleted.statusCode !== 404) {
        throw new Error('Admin delete alert failed');
      }

      // ======================================================================
      // 27. Reject deletion by non-admin
      // ======================================================================
      console.log('\n=== 27. Test Reject Deletion by Non-Admin ===');
      const citDelete = await makeRequest(
        'DELETE',
        `/api/v1/alerts/${secondAlertId}`,
        null,
        { Authorization: `Bearer ${citizenToken}` }
      );
      console.log('Citizen delete status (Expected 403):', citDelete.statusCode);

      const authDelete = await makeRequest(
        'DELETE',
        `/api/v1/alerts/${secondAlertId}`,
        null,
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Authority delete status (Expected 403):', authDelete.statusCode);

      if (citDelete.statusCode !== 403 || authDelete.statusCode !== 403) {
        throw new Error('Non-admin deletion was not blocked');
      }

      // ======================================================================
      // 28. Handle nonexistent alert deletion
      // ======================================================================
      console.log('\n=== 28. Test Handle Nonexistent Alert Deletion ===');
      const nonExistentDelete = await makeRequest(
        'DELETE',
        `/api/v1/alerts/00000000-0000-0000-0000-000000000000`,
        null,
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log('Status (Expected 404):', nonExistentDelete.statusCode);
      if (nonExistentDelete.statusCode !== 404) throw new Error('Nonexistent delete check failed');

      // ======================================================================
      // 29. Verify database relationship integrity
      // ======================================================================
      console.log('\n=== 29. Test Database Relationship Integrity ===');
      // Attempting to delete a Disaster that has dependent alerts attached must be rejected by foreign key constraint
      let disasterDeleteFailedWithConflict = false;
      try {
        await prisma.disaster.delete({
          where: { id: quakeDisasterId }, // secondAlertId is still connected to quakeDisasterId!
        });
      } catch (err) {
        if (err.code === 'P2003') {
          disasterDeleteFailedWithConflict = true;
          console.log('Prisma correctly blocked cascade deletion of parent Disaster with P2003 foreign key error.');
        }
      }
      if (!disasterDeleteFailedWithConflict) {
        throw new Error('Foreign key constraint verification failed: Alert was silently detached or orphaned!');
      }

      // Clean up remaining test records
      await prisma.alert.deleteMany({
        where: {
          OR: [
            { issuedBy: { email: { in: allTestEmails } } },
            { disaster: { name: { in: allTestDisasterNames } } },
          ],
        },
      });
      await prisma.disaster.deleteMany({
        where: { name: { in: allTestDisasterNames } },
      });
      await prisma.session.deleteMany({
        where: { user: { email: { in: allTestEmails } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: allTestEmails } },
      });

      console.log('\n🎉 ALL 29 ALERT MANAGEMENT & GEOSPATIAL TESTS PASSED PERFECTLY!');
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

runAlertTestSuite();

