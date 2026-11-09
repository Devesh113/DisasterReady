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

async function runIncidentTestSuite() {
  await connectDB();

  // Test account emails
  const adminEmail = 'incident.admin.test@disasterready.org';
  const authorityEmail = 'incident.authority.test@disasterready.org';
  const citizenAEmail = 'incident.citizena.test@disasterready.org';
  const citizenBEmail = 'incident.citizenb.test@disasterready.org';
  const allTestEmails = [adminEmail, authorityEmail, citizenAEmail, citizenBEmail];

  // Pre-test cleanup of test data
  await prisma.session.deleteMany({
    where: { user: { email: { in: allTestEmails } } },
  });
  await prisma.incidentReport.deleteMany({
    where: { reportedBy: { email: { in: allTestEmails } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: allTestEmails } },
  });

  const server = app.listen(config.port, async () => {
    console.log('🚀 Running DisasterReady Phase 6 Incident Reporting Test Suite...\n');

    let adminToken = null;
    let authorityToken = null;
    let citizenAToken = null;
    let citizenBToken = null;
    let citizenAUserId = null;

    let report1Id = null;
    let report2Id = null;

    try {
      // ======================================================================
      // Setup: Register and seed test users
      // ======================================================================
      console.log('=== Setup: Register & Seed Test Accounts ===');

      // Admin
      await makeRequest('POST', '/api/v1/auth/register', {
        email: adminEmail,
        password: 'AdminPassword2026!',
        firstName: 'Incident',
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

      // Authority
      await makeRequest('POST', '/api/v1/auth/register', {
        email: authorityEmail,
        password: 'AuthorityPassword2026!',
        firstName: 'Inspector',
        lastName: 'Authority',
      });
      await prisma.user.update({
        where: { email: authorityEmail },
        data: { role: 'AUTHORITY' },
      });
      const authLogin = await makeRequest('POST', '/api/v1/auth/login', {
        email: authorityEmail,
        password: 'AuthorityPassword2026!',
      });
      authorityToken = authLogin.body.data.token;

      // Citizen A
      const citAReg = await makeRequest('POST', '/api/v1/auth/register', {
        email: citizenAEmail,
        password: 'CitizenPassword2026!',
        firstName: 'Alice',
        lastName: 'Citizen',
      });
      citizenAToken = citAReg.body.data.token;
      citizenAUserId = citAReg.body.data.user.id;

      // Citizen B
      const citBReg = await makeRequest('POST', '/api/v1/auth/register', {
        email: citizenBEmail,
        password: 'CitizenPassword2026!',
        firstName: 'Bob',
        lastName: 'Citizen',
      });
      citizenBToken = citBReg.body.data.token;

      console.log('Test accounts registered and authenticated.\n');

      // ======================================================================
      // 1. Citizen report creation
      // ======================================================================
      console.log('=== 1. Test Citizen Report Creation (POST /api/v1/incidents) ===');
      const createRes = await makeRequest(
        'POST',
        '/api/v1/incidents',
        {
          title: 'Downed Power Line on Oak Street',
          description: 'A large tree has fallen and brought down high-voltage power lines. Sparks visible.',
          latitude: 18.5204,
          longitude: 73.8567,
          address: '400 Oak St, Pune, Maharashtra',
          imageUrl: 'https://cdn.disasterready.app/reports/img_2026_001.jpg',
        },
        { Authorization: `Bearer ${citizenAToken}` }
      );
      console.log('Status (Expected 201):', createRes.statusCode);
      console.log('Created report title:', createRes.body.data?.title);
      console.log('Initial report status (Expected SUBMITTED):', createRes.body.data?.status);
      if (createRes.statusCode !== 201 || createRes.body.data?.status !== 'SUBMITTED') {
        throw new Error('Citizen report creation failed');
      }
      report1Id = createRes.body.data.id;

      // ======================================================================
      // 2. Missing and invalid fields
      // ======================================================================
      console.log('\n=== 2. Test Missing Required Fields ===');
      const missingFields = await makeRequest(
        'POST',
        '/api/v1/incidents',
        { title: 'Incomplete Report' },
        { Authorization: `Bearer ${citizenAToken}` }
      );
      console.log('Status (Expected 400):', missingFields.statusCode);
      if (missingFields.statusCode !== 400) throw new Error('Missing fields check failed');

      // ======================================================================
      // 3. Invalid coordinates
      // ======================================================================
      console.log('\n=== 3. Test Invalid Coordinates ===');
      const invalidCoords = await makeRequest(
        'POST',
        '/api/v1/incidents',
        {
          title: 'Invalid Coordinates Report',
          description: 'Has impossible latitude of 150 degrees.',
          latitude: 150.0,
          longitude: 73.0,
        },
        { Authorization: `Bearer ${citizenAToken}` }
      );
      console.log('Status (Expected 400):', invalidCoords.statusCode);
      if (invalidCoords.statusCode !== 400) throw new Error('Invalid coordinates check failed');

      // ======================================================================
      // 4. Image URL validation (protocol & safe URLs)
      // ======================================================================
      console.log('\n=== 4. Test Image URL Validation (Reject local file paths & unsafe protocols) ===');
      const unsafeImageRes = await makeRequest(
        'POST',
        '/api/v1/incidents',
        {
          title: 'Unsafe File Path Report',
          description: 'Attempting to inject local file path.',
          latitude: 18.5,
          longitude: 73.8,
          imageUrl: 'file:///etc/passwd',
        },
        { Authorization: `Bearer ${citizenAToken}` }
      );
      console.log('Unsafe Image Status (Expected 400):', unsafeImageRes.statusCode);
      if (unsafeImageRes.statusCode !== 400) throw new Error('Unsafe image path was not rejected');

      // ======================================================================
      // 5. Authentication requirement
      // ======================================================================
      console.log('\n=== 5. Test Authentication Requirement ===');
      const unauthCreate = await makeRequest('POST', '/api/v1/incidents', {
        title: 'Unauthenticated Report',
        description: 'Should be rejected without token.',
        latitude: 18.5,
        longitude: 73.8,
      });
      console.log('Status (Expected 401):', unauthCreate.statusCode);
      if (unauthCreate.statusCode !== 401) throw new Error('Unauthenticated report creation was not blocked');

      // ======================================================================
      // 6. Reporter ID security (prevent impersonation)
      // ======================================================================
      console.log('\n=== 6. Test Reporter ID Security (Prevent user impersonation) ===');
      const spoofRes = await makeRequest(
        'POST',
        '/api/v1/incidents',
        {
          title: 'Spoofed Reporter Report',
          description: 'Attempting to forge another user ID in payload.',
          latitude: 28.6139,
          longitude: 77.209,
          reportedById: '11111111-1111-1111-1111-111111111111',
          userId: '11111111-1111-1111-1111-111111111111',
        },
        { Authorization: `Bearer ${citizenAToken}` }
      );
      console.log('Created Reporter ID in DB:', spoofRes.body.data?.reportedBy?.id);
      console.log('Matches actual Authenticated User ID:', spoofRes.body.data?.reportedBy?.id === citizenAUserId);
      if (spoofRes.body.data?.reportedBy?.id !== citizenAUserId) {
        throw new Error('Reporter ID impersonation detected!');
      }
      report2Id = spoofRes.body.data.id;

      // ======================================================================
      // 7. Citizen listing own reports (GET /api/v1/users/me/incident-reports)
      // ======================================================================
      console.log('\n=== 7. Test Citizen Listing Own Reports ===');
      const myReportsRes = await makeRequest(
        'GET',
        '/api/v1/users/me/incident-reports',
        null,
        { Authorization: `Bearer ${citizenAToken}` }
      );
      console.log('Status (Expected 200):', myReportsRes.statusCode);
      console.log('Citizen A reports count (Expected 2):', myReportsRes.body.data?.length);
      if (myReportsRes.statusCode !== 200 || myReportsRes.body.data?.length < 2) {
        throw new Error('Citizen own reports listing failed');
      }

      // ======================================================================
      // 8. Authority review: Authority lists all incident reports
      // ======================================================================
      console.log('\n=== 8. Test Authority Listing All Reports (GET /api/v1/incidents) ===');
      const authListRes = await makeRequest(
        'GET',
        '/api/v1/incidents',
        null,
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 200):', authListRes.statusCode);
      console.log('Total reports retrieved:', authListRes.body.data?.length);
      if (authListRes.statusCode !== 200 || !Array.isArray(authListRes.body.data)) {
        throw new Error('Authority reports listing failed');
      }

      // ======================================================================
      // 9. Citizen forbidden from listing all reports (GET /api/v1/incidents)
      // ======================================================================
      console.log('\n=== 9. Test Citizen Forbidden From Listing All Reports ===');
      const citizenForbiddenList = await makeRequest(
        'GET',
        '/api/v1/incidents',
        null,
        { Authorization: `Bearer ${citizenAToken}` }
      );
      console.log('Status (Expected 403):', citizenForbiddenList.statusCode);
      if (citizenForbiddenList.statusCode !== 403) {
        throw new Error('Citizen was not blocked from viewing all incident reports');
      }

      // ======================================================================
      // 10. Filter by status
      // ======================================================================
      console.log('\n=== 10. Test Filter by Status (?status=SUBMITTED) ===');
      const statusFilterRes = await makeRequest(
        'GET',
        '/api/v1/incidents?status=SUBMITTED',
        null,
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 200):', statusFilterRes.statusCode);
      const allSubmitted = statusFilterRes.body.data.every((r) => r.status === 'SUBMITTED');
      console.log('All returned reports are SUBMITTED:', allSubmitted);
      if (statusFilterRes.statusCode !== 200 || !allSubmitted) {
        throw new Error('Status filtering failed');
      }

      // ======================================================================
      // 11. Pagination
      // ======================================================================
      console.log('\n=== 11. Test Pagination (?page=1&limit=1) ===');
      const pageRes = await makeRequest(
        'GET',
        '/api/v1/incidents?page=1&limit=1',
        null,
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 200):', pageRes.statusCode);
      console.log('Items returned (Expected 1):', pageRes.body.data?.length);
      console.log('Pagination limit:', pageRes.body.pagination?.limit);
      if (pageRes.statusCode !== 200 || pageRes.body.data?.length !== 1 || pageRes.body.pagination?.limit !== 1) {
        throw new Error('Pagination failed');
      }

      // ======================================================================
      // 12. Search by keyword
      // ======================================================================
      console.log('\n=== 12. Test Search by Keyword (?search=Oak) ===');
      const searchRes = await makeRequest(
        'GET',
        '/api/v1/incidents?search=Oak',
        null,
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 200):', searchRes.statusCode);
      const foundOak = searchRes.body.data.some((r) => r.title.includes('Oak') || r.address.includes('Oak'));
      console.log('Matching search item found:', foundOak);
      if (searchRes.statusCode !== 200 || !foundOak) throw new Error('Search failed');

      // ======================================================================
      // 13. Geospatial proximity filtering
      // ======================================================================
      console.log('\n=== 13. Test Geospatial Proximity Filtering (Pune Center radius 15km) ===');
      const geoRes = await makeRequest(
        'GET',
        '/api/v1/incidents?latitude=18.5204&longitude=73.8567&radius=15',
        null,
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 200):', geoRes.statusCode);
      const includesPune = geoRes.body.data.some((r) => r.id === report1Id);
      const excludesDelhi = !geoRes.body.data.some((r) => r.id === report2Id);
      console.log('Includes local Pune report:', includesPune);
      console.log('Excludes distant Delhi report:', excludesDelhi);
      if (geoRes.statusCode !== 200 || !includesPune || !excludesDelhi) {
        throw new Error('Geospatial proximity filtering failed');
      }

      // ======================================================================
      // 14. Retrieve report by ID as submitting citizen
      // ======================================================================
      console.log('\n=== 14. Test Retrieve Report by ID as Submitting Citizen ===');
      const getOwnerRes = await makeRequest(
        'GET',
        `/api/v1/incidents/${report1Id}`,
        null,
        { Authorization: `Bearer ${citizenAToken}` }
      );
      console.log('Status (Expected 200):', getOwnerRes.statusCode);
      console.log('Report Title:', getOwnerRes.body.data?.title);
      console.log('Includes reporter info:', !!getOwnerRes.body.data?.reportedBy?.firstName);
      if (getOwnerRes.statusCode !== 200 || getOwnerRes.body.data?.id !== report1Id) {
        throw new Error('Get report by ID as owner failed');
      }

      // ======================================================================
      // 15. Retrieve report by ID as Authority
      // ======================================================================
      console.log('\n=== 15. Test Retrieve Report by ID as Authority ===');
      const getAuthRes = await makeRequest(
        'GET',
        `/api/v1/incidents/${report1Id}`,
        null,
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 200):', getAuthRes.statusCode);
      if (getAuthRes.statusCode !== 200) throw new Error('Get report by ID as authority failed');

      // ======================================================================
      // 16. Citizen ownership restriction: Citizen B viewing Citizen A's report
      // ======================================================================
      console.log('\n=== 16. Test Citizen Ownership Restriction (Citizen B viewing Citizen A report) ===');
      const getOtherRes = await makeRequest(
        'GET',
        `/api/v1/incidents/${report1Id}`,
        null,
        { Authorization: `Bearer ${citizenBToken}` }
      );
      console.log('Status (Expected 403):', getOtherRes.statusCode);
      if (getOtherRes.statusCode !== 403) throw new Error('Citizen cross-viewing was not blocked');

      // ======================================================================
      // 17. Retrieve nonexistent report
      // ======================================================================
      console.log('\n=== 17. Test Retrieve Nonexistent Report ===');
      const getMissingRes = await makeRequest(
        'GET',
        '/api/v1/incidents/00000000-0000-0000-0000-000000000000',
        null,
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 404):', getMissingRes.statusCode);
      if (getMissingRes.statusCode !== 404) throw new Error('Nonexistent report check failed');

      // ======================================================================
      // 18. Citizen update of own report content while still SUBMITTED
      // ======================================================================
      console.log('\n=== 18. Test Citizen Update of Own Report Content (while SUBMITTED) ===');
      const updatedDescText = 'Correction: Two trees fallen, entire road blocked. Ambulance cannot pass.';
      const citUpdateRes = await makeRequest(
        'PATCH',
        `/api/v1/incidents/${report1Id}`,
        { description: updatedDescText },
        { Authorization: `Bearer ${citizenAToken}` }
      );
      console.log('Status (Expected 200):', citUpdateRes.statusCode);
      console.log('Updated description matches:', citUpdateRes.body.data?.description === updatedDescText);
      if (citUpdateRes.statusCode !== 200 || citUpdateRes.body.data?.description !== updatedDescText) {
        throw new Error('Citizen update of own report failed');
      }

      // ======================================================================
      // 19. Citizen forbidden from changing status
      // ======================================================================
      console.log('\n=== 19. Test Citizen Forbidden From Changing Status ===');
      const citStatusUpdateRes = await makeRequest(
        'PATCH',
        `/api/v1/incidents/${report1Id}`,
        { status: 'VERIFIED' },
        { Authorization: `Bearer ${citizenAToken}` }
      );
      console.log('Status (Expected 403):', citStatusUpdateRes.statusCode);
      if (citStatusUpdateRes.statusCode !== 403) throw new Error('Citizen status change was not blocked');

      // ======================================================================
      // 20. Citizen B attempting to update Citizen A's report
      // ======================================================================
      console.log('\n=== 20. Test Citizen B Updating Citizen A Report (Forbidden) ===');
      const citBUpdateRes = await makeRequest(
        'PATCH',
        `/api/v1/incidents/${report1Id}`,
        { title: 'Hacked by Bob' },
        { Authorization: `Bearer ${citizenBToken}` }
      );
      console.log('Status (Expected 403):', citBUpdateRes.statusCode);
      if (citBUpdateRes.statusCode !== 403) throw new Error('Cross-user update was not blocked');

      // ======================================================================
      // 21. Status workflow: Authority moves SUBMITTED -> UNDER_REVIEW
      // ======================================================================
      console.log('\n=== 21. Test Status Transition: SUBMITTED -> UNDER_REVIEW (Authority) ===');
      const toReviewRes = await makeRequest(
        'PATCH',
        `/api/v1/incidents/${report1Id}`,
        { status: 'UNDER_REVIEW' },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 200):', toReviewRes.statusCode);
      console.log('Updated Status in DB:', toReviewRes.body.data?.status);
      if (toReviewRes.statusCode !== 200 || toReviewRes.body.data?.status !== 'UNDER_REVIEW') {
        throw new Error('Transition to UNDER_REVIEW failed');
      }

      // ======================================================================
      // 22. Citizen modification blocked once UNDER_REVIEW
      // ======================================================================
      console.log('\n=== 22. Test Citizen Blocked From Modifying Report in UNDER_REVIEW ===');
      const citBlockedRes = await makeRequest(
        'PATCH',
        `/api/v1/incidents/${report1Id}`,
        { title: 'Attempted edit after review started' },
        { Authorization: `Bearer ${citizenAToken}` }
      );
      console.log('Status (Expected 400):', citBlockedRes.statusCode);
      if (citBlockedRes.statusCode !== 400) throw new Error('Citizen edit during review was not blocked');

      // ======================================================================
      // 23. Status workflow: Authority moves UNDER_REVIEW -> VERIFIED
      // ======================================================================
      console.log('\n=== 23. Test Status Transition: UNDER_REVIEW -> VERIFIED (Authority) ===');
      const toVerifiedRes = await makeRequest(
        'PATCH',
        `/api/v1/incidents/${report1Id}`,
        { status: 'VERIFIED' },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 200):', toVerifiedRes.statusCode);
      console.log('Updated Status in DB:', toVerifiedRes.body.data?.status);
      if (toVerifiedRes.statusCode !== 200 || toVerifiedRes.body.data?.status !== 'VERIFIED') {
        throw new Error('Transition to VERIFIED failed');
      }

      // ======================================================================
      // 24. Status workflow: Authority moves VERIFIED -> RESOLVED
      // ======================================================================
      console.log('\n=== 24. Test Status Transition: VERIFIED -> RESOLVED (Authority) ===');
      const toResolvedRes = await makeRequest(
        'PATCH',
        `/api/v1/incidents/${report1Id}`,
        { status: 'RESOLVED' },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 200):', toResolvedRes.statusCode);
      console.log('Updated Status in DB:', toResolvedRes.body.data?.status);
      if (toResolvedRes.statusCode !== 200 || toResolvedRes.body.data?.status !== 'RESOLVED') {
        throw new Error('Transition to RESOLVED failed');
      }

      // ======================================================================
      // 25. Invalid status transition: RESOLVED -> SUBMITTED (Blocked)
      // ======================================================================
      console.log('\n=== 25. Test Invalid Status Transition: RESOLVED -> SUBMITTED (Blocked) ===');
      const invalidTransitionRes = await makeRequest(
        'PATCH',
        `/api/v1/incidents/${report1Id}`,
        { status: 'SUBMITTED' },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 400):', invalidTransitionRes.statusCode);
      if (invalidTransitionRes.statusCode !== 400) throw new Error('Invalid status transition was not rejected');

      // ======================================================================
      // 26. Authority rejects a report: SUBMITTED -> REJECTED
      // ======================================================================
      console.log('\n=== 26. Test Status Transition: SUBMITTED -> REJECTED (Authority rejects false report) ===');
      const rejectRes = await makeRequest(
        'PATCH',
        `/api/v1/incidents/${report2Id}`,
        { status: 'REJECTED' },
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Status (Expected 200):', rejectRes.statusCode);
      console.log('Updated Status in DB:', rejectRes.body.data?.status);
      if (rejectRes.statusCode !== 200 || rejectRes.body.data?.status !== 'REJECTED') {
        throw new Error('Transition to REJECTED failed');
      }

      // ======================================================================
      // 27. Delete as ADMIN (DELETE /api/v1/incidents/:id)
      // ======================================================================
      console.log('\n=== 27. Test Delete as ADMIN (DELETE /api/v1/incidents/:id) ===');
      const adminDeleteRes = await makeRequest(
        'DELETE',
        `/api/v1/incidents/${report1Id}`,
        null,
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log('Status (Expected 200):', adminDeleteRes.statusCode);
      const verifyDelete = await makeRequest(
        'GET',
        `/api/v1/incidents/${report1Id}`,
        null,
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log('Subsequent GET status (Expected 404):', verifyDelete.statusCode);
      if (adminDeleteRes.statusCode !== 200 || verifyDelete.statusCode !== 404) {
        throw new Error('Admin delete report failed');
      }

      // ======================================================================
      // 28. Reject deletion by non-admin
      // ======================================================================
      console.log('\n=== 28. Test Reject Deletion by Non-Admin (CITIZEN & AUTHORITY) ===');
      const citDelete = await makeRequest(
        'DELETE',
        `/api/v1/incidents/${report2Id}`,
        null,
        { Authorization: `Bearer ${citizenAToken}` }
      );
      console.log('Citizen delete status (Expected 403):', citDelete.statusCode);

      const authDelete = await makeRequest(
        'DELETE',
        `/api/v1/incidents/${report2Id}`,
        null,
        { Authorization: `Bearer ${authorityToken}` }
      );
      console.log('Authority delete status (Expected 403):', authDelete.statusCode);

      if (citDelete.statusCode !== 403 || authDelete.statusCode !== 403) {
        throw new Error('Non-admin deletion was not blocked');
      }

      // ======================================================================
      // 29. Handle nonexistent report deletion
      // ======================================================================
      console.log('\n=== 29. Test Handle Nonexistent Report Deletion ===');
      const nonExistentDelete = await makeRequest(
        'DELETE',
        '/api/v1/incidents/00000000-0000-0000-0000-000000000000',
        null,
        { Authorization: `Bearer ${adminToken}` }
      );
      console.log('Status (Expected 404):', nonExistentDelete.statusCode);
      if (nonExistentDelete.statusCode !== 404) throw new Error('Nonexistent delete check failed');

      // ======================================================================
      // 30. Database relationship integrity
      // ======================================================================
      console.log('\n=== 30. Test Database Relationship Integrity ===');
      const remainingReport = await prisma.incidentReport.findUnique({
        where: { id: report2Id },
        include: { reportedBy: true },
      });
      console.log('Remaining report is correctly linked to User:', remainingReport?.reportedBy?.email === citizenAEmail);
      if (!remainingReport || remainingReport.reportedBy.email !== citizenAEmail) {
        throw new Error('Relationship integrity check failed');
      }

      // Clean up test data
      await prisma.incidentReport.deleteMany({
        where: { reportedBy: { email: { in: allTestEmails } } },
      });
      await prisma.session.deleteMany({
        where: { user: { email: { in: allTestEmails } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: allTestEmails } },
      });

      console.log('\n🎉 ALL 30 INCIDENT REPORTING TESTS PASSED PERFECTLY!');
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

runIncidentTestSuite();

