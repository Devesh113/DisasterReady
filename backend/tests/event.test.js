/**
 * DisasterReady — Events & Registrations Integration Test Suite
 * Tests Event CRUD, Registrations lifecycle, capacity enforcement,
 * attendee lists, RBAC, geo-filtering, and notification dispatch.
 */

const app = require('../src/app');
const config = require('../src/config/env');
const { prisma, connectDB, disconnectDB } = require('../src/config/db');
const http = require('http');
const { hashPassword } = require('../src/utils/password');

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const allHeaders = { ...headers };
    if (body) {
      allHeaders['Content-Type'] = 'application/json';
      allHeaders['Content-Length'] = Buffer.byteLength(postData);
    }
    const req = http.request(
      { hostname: 'localhost', port: config.port, path, method, headers: allHeaders },
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
          resolve({ statusCode: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(postData);
    req.end();
  });
}

const TEST_USERS = {
  admin: { email: 'admin.evt@disasterready.test', role: 'ADMIN', firstName: 'Admin', lastName: 'User' },
  organizerA: { email: 'orga.evt@disasterready.test', role: 'AUTHORITY', firstName: 'Officer', lastName: 'Alpha' },
  organizerB: { email: 'orgb.evt@disasterready.test', role: 'AUTHORITY', firstName: 'Officer', lastName: 'Beta' },
  citizen1: { email: 'cit1.evt@disasterready.test', role: 'CITIZEN', firstName: 'Citizen', lastName: 'One' },
  citizen2: { email: 'cit2.evt@disasterready.test', role: 'CITIZEN', firstName: 'Citizen', lastName: 'Two' },
};

async function seedUser(userDef) {
  const hash = await hashPassword('SecurePassword123!');
  const email = userDef.email.toLowerCase();
  return prisma.user.upsert({
    where: { email },
    update: {
      password: hash,
      role: userDef.role,
      firstName: userDef.firstName,
      lastName: userDef.lastName,
      isActive: true,
    },
    create: {
      email,
      password: hash,
      firstName: userDef.firstName,
      lastName: userDef.lastName,
      role: userDef.role,
      isActive: true,
    },
  });
}

async function loginUser(email) {
  const res = await makeRequest('POST', '/api/v1/auth/login', {
    email,
    password: 'SecurePassword123!',
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.data.token, user: res.body.data.user };
}

async function cleanup() {
  await prisma.registration.deleteMany({
    where: {
      OR: [
        { event: { title: { startsWith: '[TEST]' } } },
        { user: { email: { contains: '.evt@disasterready.test' } } },
      ],
    },
  });
  await prisma.notification.deleteMany({
    where: { user: { email: { contains: '.evt@disasterready.test' } } },
  });
  await prisma.event.deleteMany({
    where: {
      OR: [
        { title: { startsWith: '[TEST]' } },
        { organizer: { email: { contains: '.evt@disasterready.test' } } },
      ],
    },
  });
  await prisma.session.deleteMany({
    where: { user: { email: { contains: '.evt@disasterready.test' } } },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: '.evt@disasterready.test' } },
  });
}

async function runEventTestSuite() {
  await connectDB();
  await cleanup();

  for (const u of Object.values(TEST_USERS)) {
    await seedUser(u);
  }

  const server = app.listen(config.port, async () => {
    console.log('\n🚀 Running Events & Registrations Integration Test Suite...\n');

    let passed = 0;
    let failed = 0;
    const failures = [];

    function assert(condition, label, details = '') {
      if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
      } else {
        console.error(`  ❌ ${label}${details ? ` — ${details}` : ''}`);
        failed++;
        failures.push(label);
      }
    }

    try {
      const adminAuth = await loginUser(TEST_USERS.admin.email);
      const orgAAuth = await loginUser(TEST_USERS.organizerA.email);
      const orgBAuth = await loginUser(TEST_USERS.organizerB.email);
      const cit1Auth = await loginUser(TEST_USERS.citizen1.email);
      const cit2Auth = await loginUser(TEST_USERS.citizen2.email);

      const adminH = { Authorization: `Bearer ${adminAuth.token}` };
      const orgAH = { Authorization: `Bearer ${orgAAuth.token}` };
      const orgBH = { Authorization: `Bearer ${orgBAuth.token}` };
      const cit1H = { Authorization: `Bearer ${cit1Auth.token}` };
      const cit2H = { Authorization: `Bearer ${cit2Auth.token}` };

      // ======================================================================
      // 1. EVENT CREATION TESTS
      // ======================================================================
      console.log('=== 1. Public List (no auth) ===');
      const pubList = await makeRequest('GET', '/api/v1/events');
      assert(pubList.statusCode === 200, 'Public can list events (200)');
      assert(Array.isArray(pubList.body.data.events), 'Returns events array');

      console.log('\n=== 2. Citizen Create Event (Forbidden) ===');
      const citCreate = await makeRequest(
        'POST',
        '/api/v1/events',
        {
          title: '[TEST] Citizen Event',
          description: 'Not allowed',
          location: 'Anywhere',
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 172800000).toISOString(),
        },
        cit1H
      );
      assert(citCreate.statusCode === 403, 'Citizen blocked from creating event (403)');

      console.log('\n=== 3. Unauthenticated Create Event (Unauthorized) ===');
      const unauthCreate = await makeRequest('POST', '/api/v1/events', {
        title: '[TEST] Ghost Event',
        description: 'No auth',
        location: 'Nowhere',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 172800000).toISOString(),
      });
      assert(unauthCreate.statusCode === 401, 'Unauthenticated create blocked (401)');

      console.log('\n=== 4. Validation: Invalid Dates (End before Start) ===');
      const badDates = await makeRequest(
        'POST',
        '/api/v1/events',
        {
          title: '[TEST] Invalid Dates',
          description: 'End before start',
          location: 'Community Hall',
          startDate: new Date(Date.now() + 172800000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
        },
        orgAH
      );
      assert(badDates.statusCode === 400, 'End date before start date rejected (400)');

      console.log('\n=== 5. Validation: Missing Required Fields ===');
      const missingFields = await makeRequest(
        'POST',
        '/api/v1/events',
        {
          title: '[TEST] Missing Location and Description',
        },
        orgAH
      );
      assert(missingFields.statusCode === 400, 'Missing fields rejected (400)');

      console.log('\n=== 6. Create Event: AUTHORITY Success ===');
      const createRes = await makeRequest(
        'POST',
        '/api/v1/events',
        {
          title: '[TEST] Community Earthquake Drill',
          description: 'Hands-on training for earthquake readiness and evacuation procedures.',
          location: 'Connaught Place, New Delhi',
          latitude: 28.6315,
          longitude: 77.2167,
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 97200000).toISOString(),
          capacity: 2, // limited capacity for test
        },
        orgAH
      );
      assert(createRes.statusCode === 201, 'AUTHORITY creates event successfully (201)');
      assert(createRes.body.data.event.status === 'UPCOMING', 'Status defaults to UPCOMING');
      assert(createRes.body.data.event.capacity === 2, 'Capacity stored correctly');
      const event1Id = createRes.body.data.event.id;

      console.log('\n=== 7. Create Second Event: ADMIN Success ===');
      const createRes2 = await makeRequest(
        'POST',
        '/api/v1/events',
        {
          title: '[TEST] Flood Safety Workshop',
          description: 'Preparedness strategies for urban monsoon flooding.',
          location: 'Yamuna Sports Complex, Delhi',
          latitude: 28.6667,
          longitude: 77.3000,
          startDate: new Date(Date.now() + 172800000).toISOString(),
          endDate: new Date(Date.now() + 180000000).toISOString(),
          capacity: 100,
        },
        adminH
      );
      assert(createRes2.statusCode === 201, 'ADMIN creates event successfully (201)');
      const event2Id = createRes2.body.data.event.id;

      // ======================================================================
      // 2. EVENT LISTING & RETRIEVAL
      // ======================================================================
      console.log('\n=== 8. Get Event By ID (Public) ===');
      const getEvt = await makeRequest('GET', `/api/v1/events/${event1Id}`);
      assert(getEvt.statusCode === 200, 'Public retrieves event details (200)');
      assert(getEvt.body.data.event.id === event1Id, 'Correct event ID returned');
      assert(getEvt.body.data.event.registrationCount === 0, 'Initial registrationCount is 0');
      assert(getEvt.body.data.event.organizer !== undefined, 'Organizer profile attached');

      console.log('\n=== 9. Get Event By ID (Not Found) ===');
      const notFoundEvt = await makeRequest('GET', '/api/v1/events/00000000-0000-0000-0000-000000000000');
      assert(notFoundEvt.statusCode === 404, 'Nonexistent event returns 404');

      console.log('\n=== 10. List Events: Status Filter ===');
      const filterStatus = await makeRequest('GET', '/api/v1/events?status=UPCOMING');
      assert(filterStatus.statusCode === 200, 'Status filter returns 200');
      assert(filterStatus.body.data.events.every((e) => e.status === 'UPCOMING'), 'All items match UPCOMING status');

      console.log('\n=== 11. List Events: Search Filter ===');
      const searchRes = await makeRequest('GET', '/api/v1/events?search=Earthquake');
      assert(searchRes.statusCode === 200, 'Search filter returns 200');
      assert(searchRes.body.data.events.some((e) => e.id === event1Id), 'Search finds Earthquake drill');

      console.log('\n=== 12. List Events: Geospatial Proximity ===');
      const geoList = await makeRequest('GET', '/api/v1/events?latitude=28.63&longitude=77.21&radiusKm=10');
      assert(geoList.statusCode === 200, 'Geo search returns 200');
      assert(geoList.body.data.events.some((e) => e.id === event1Id), 'Event within radius found');

      // ======================================================================
      // 3. EVENT REGISTRATION TESTS
      // ======================================================================
      console.log('\n=== 13. Citizen 1 Registers for Event ===');
      const reg1 = await makeRequest('POST', `/api/v1/events/${event1Id}/register`, null, cit1H);
      assert(reg1.statusCode === 201, 'Citizen 1 registers successfully (201)');
      assert(reg1.body.data.registration.status === 'REGISTERED', 'Registration status is REGISTERED');
      const reg1Id = reg1.body.data.registration.id;

      // Verify notification sent to Citizen 1
      const cit1Notifs = await makeRequest('GET', '/api/v1/notifications?type=EVENT_REMINDER', null, cit1H);
      assert(cit1Notifs.statusCode === 200, 'Citizen 1 notifications fetched (200)');
      const cit1NotifList = cit1Notifs.body.data.notifications || cit1Notifs.body.data || [];
      assert(
        cit1NotifList.some((n) => n.title.includes('Community Earthquake Drill')),
        'Registration confirmation notification generated for Citizen 1'
      );

      console.log('\n=== 14. Duplicate Registration Blocked ===');
      const dupReg = await makeRequest('POST', `/api/v1/events/${event1Id}/register`, null, cit1H);
      assert(dupReg.statusCode === 409, 'Duplicate registration returns 409 Conflict');

      console.log('\n=== 15. Event Details Reflects Registration Count ===');
      const evtWithReg = await makeRequest('GET', `/api/v1/events/${event1Id}`);
      assert(evtWithReg.body.data.event.registrationCount === 1, 'registrationCount updated to 1');

      console.log('\n=== 16. Citizen 2 Registers (Reaches Capacity = 2) ===');
      const reg2 = await makeRequest('POST', `/api/v1/events/${event1Id}/register`, null, cit2H);
      assert(reg2.statusCode === 201, 'Citizen 2 registers (201)');

      console.log('\n=== 17. Overcapacity Registration Blocked ===');
      // Create a 3rd citizen to attempt overcapacity registration
      const extraCit = await seedUser({
        email: 'cit3.evt@disasterready.test',
        role: 'CITIZEN',
        firstName: 'Citizen',
        lastName: 'Three',
      });
      const extraAuth = await loginUser('cit3.evt@disasterready.test');
      const overCapRes = await makeRequest(
        'POST',
        `/api/v1/events/${event1Id}/register`,
        null,
        { Authorization: `Bearer ${extraAuth.token}` }
      );
      assert(overCapRes.statusCode === 400, 'Registration at full capacity blocked (400)');
      assert(overCapRes.body.error.message.includes('capacity'), 'Error message specifies capacity');

      // Verify no notification sent to extra citizen on failed registration
      const extraNotifs = await makeRequest(
        'GET',
        '/api/v1/notifications?type=EVENT_REMINDER',
        null,
        { Authorization: `Bearer ${extraAuth.token}` }
      );
      const extraNotifList = extraNotifs.body.data.notifications || extraNotifs.body.data || [];
      assert(extraNotifList.length === 0, 'No notification on failed registration');

      // ======================================================================
      // 4. ATTENDEE LIST & USER REGISTRATIONS
      // ======================================================================
      console.log('\n=== 18. Organizer Views Event Attendees ===');
      const attendeeList = await makeRequest('GET', `/api/v1/events/${event1Id}/registrations`, null, orgAH);
      assert(attendeeList.statusCode === 200, 'Organizer views attendee list (200)');
      assert(attendeeList.body.data.registrations.length === 2, 'Lists 2 registered attendees');
      assert(attendeeList.body.data.registrations[0].user.email !== undefined, 'User profile attached');

      console.log('\n=== 19. Non-Organizer AUTHORITY Blocked from Viewing Attendees ===');
      const nonOrgAttendees = await makeRequest('GET', `/api/v1/events/${event1Id}/registrations`, null, orgBH);
      assert(nonOrgAttendees.statusCode === 403, 'Non-organizer AUTHORITY blocked (403)');

      console.log('\n=== 20. Citizen Views Own Registrations (/api/v1/users/me/registrations) ===');
      const myRegs = await makeRequest('GET', '/api/v1/users/me/registrations', null, cit1H);
      assert(myRegs.statusCode === 200, 'Citizen lists own registrations (200)');
      assert(myRegs.body.data.registrations.some((r) => r.eventId === event1Id), 'Includes registered event');
      assert(myRegs.body.data.registrations[0].event.title !== undefined, 'Event summary attached');

      console.log('\n=== 21. Citizen Views Own Registrations Alias (/api/v1/registrations) ===');
      const myRegsAlias = await makeRequest('GET', '/api/v1/registrations', null, cit1H);
      assert(myRegsAlias.statusCode === 200, 'Registrations alias returns 200');

      console.log('\n=== 22. Get Registration By ID ===');
      const getReg = await makeRequest('GET', `/api/v1/registrations/${reg1Id}`, null, cit1H);
      assert(getReg.statusCode === 200, 'Owner can retrieve registration by ID (200)');

      console.log('\n=== 23. Cross-User Registration Access Forbidden ===');
      const crossReg = await makeRequest('GET', `/api/v1/registrations/${reg1Id}`, null, cit2H);
      assert(crossReg.statusCode === 403, 'Other citizen cannot view registration (403)');

      // ======================================================================
      // 5. REGISTRATION CANCELLATION
      // ======================================================================
      console.log('\n=== 24. Citizen 1 Cancels Registration ===');
      const cancelReg = await makeRequest('DELETE', `/api/v1/events/${event1Id}/register`, null, cit1H);
      assert(cancelReg.statusCode === 200, 'Citizen 1 cancels registration (200)');

      // Now active capacity should be 1, extra citizen can now register!
      console.log('\n=== 25. Capacity Frees Up After Cancellation ===');
      const extraSuccessReg = await makeRequest(
        'POST',
        `/api/v1/events/${event1Id}/register`,
        null,
        { Authorization: `Bearer ${extraAuth.token}` }
      );
      assert(extraSuccessReg.statusCode === 201, 'New registration succeeds after capacity freed (201)');

      console.log('\n=== 26. Cancel Again (Already Cancelled) Returns 404 ===');
      const doubleCancel = await makeRequest('DELETE', `/api/v1/events/${event1Id}/register`, null, cit1H);
      assert(doubleCancel.statusCode === 404, 'Already cancelled registration returns 404');

      console.log('\n=== 27. Re-register After Cancellation Succeeds ===');
      // Citizen 1 re-registers for Event 2
      const regEvent2 = await makeRequest('POST', `/api/v1/events/${event2Id}/register`, null, cit1H);
      assert(regEvent2.statusCode === 201, 'Citizen 1 registers for Event 2 (201)');
      const cancelEvent2 = await makeRequest('DELETE', `/api/v1/events/${event2Id}/register`, null, cit1H);
      assert(cancelEvent2.statusCode === 200, 'Citizen 1 cancels Event 2 registration (200)');
      const reRegEvent2 = await makeRequest('POST', `/api/v1/events/${event2Id}/register`, null, cit1H);
      assert(reRegEvent2.statusCode === 201, 'Citizen 1 re-registers for Event 2 (201)');

      // ======================================================================
      // 6. EVENT UPDATE & NOTIFICATION TO ATTENDEES
      // ======================================================================
      console.log('\n=== 28. Non-Organizer AUTHORITY Blocked from Updating Event ===');
      const badUpdate = await makeRequest(
        'PATCH',
        `/api/v1/events/${event1Id}`,
        { title: '[TEST] Hacked Title' },
        orgBH
      );
      assert(badUpdate.statusCode === 403, 'Non-organizer update rejected (403)');

      console.log('\n=== 29. Organizer Updates Event Schedule (Dispatches Notification) ===');
      // Clear previous notifications for Citizen 2
      await prisma.notification.deleteMany({
        where: { userId: cit2Auth.user.id, type: 'EVENT_REMINDER' },
      });

      const updateEvt = await makeRequest(
        'PATCH',
        `/api/v1/events/${event1Id}`,
        {
          location: 'New Hall, Connaught Place, New Delhi',
        },
        orgAH
      );
      assert(updateEvt.statusCode === 200, 'Organizer updates event (200)');

      // Verify Citizen 2 received update notification
      const cit2Notifs = await makeRequest('GET', '/api/v1/notifications?type=EVENT_REMINDER', null, cit2H);
      const cit2NotifList = cit2Notifs.body.data.notifications || cit2Notifs.body.data || [];
      assert(
        cit2NotifList.some((n) => n.title.includes('Event Schedule Update')),
        'Registered attendee Citizen 2 notified of schedule change'
      );

      console.log('\n=== 30. Organizer Cancels Event (Status CANCELLED) ===');
      // Clear previous notifications for Citizen 2
      await prisma.notification.deleteMany({
        where: { userId: cit2Auth.user.id, type: 'EVENT_REMINDER' },
      });

      const cancelEvt = await makeRequest(
        'PATCH',
        `/api/v1/events/${event1Id}`,
        {
          status: 'CANCELLED',
        },
        orgAH
      );
      assert(cancelEvt.statusCode === 200, 'Event cancelled (200)');

      // Verify Citizen 2 received cancellation notification
      const cit2CancelNotifs = await makeRequest('GET', '/api/v1/notifications?type=EVENT_REMINDER', null, cit2H);
      const cit2CancelList = cit2CancelNotifs.body.data.notifications || cit2CancelNotifs.body.data || [];
      assert(
        cit2CancelList.some((n) => n.title.includes('Event Cancelled')),
        'Registered attendee Citizen 2 notified of cancellation'
      );

      console.log('\n=== 31. Register for CANCELLED Event Blocked ===');
      const regCancelled = await makeRequest('POST', `/api/v1/events/${event1Id}/register`, null, cit1H);
      assert(regCancelled.statusCode === 400, 'Registration for cancelled event rejected (400)');

      // ======================================================================
      // 7. CONCURRENCY & RACE CONDITION AUDIT TESTS
      // ======================================================================
      console.log('\n=== 32. Concurrency Test: 10 Simultaneous Registrations for Capacity = 3 ===');
      // Create a dedicated event with capacity = 3
      const raceEventRes = await makeRequest(
        'POST',
        '/api/v1/events',
        {
          title: '[TEST] High Concurrency Drill',
          description: 'Testing race conditions under simultaneous registration load.',
          location: 'Stadium',
          startDate: new Date(Date.now() + 300000000).toISOString(),
          endDate: new Date(Date.now() + 310000000).toISOString(),
          capacity: 3,
        },
        adminH
      );
      assert(raceEventRes.statusCode === 201, 'Concurrency test event created (capacity = 3)');
      const raceEventId = raceEventRes.body.data.event.id;

      // Seed 10 distinct test citizens
      const concurrentUsers = [];
      for (let i = 1; i <= 10; i++) {
        const u = await seedUser({
          email: `race${i}.evt@disasterready.test`,
          role: 'CITIZEN',
          firstName: `Racer${i}`,
          lastName: 'Test',
        });
        const auth = await loginUser(`race${i}.evt@disasterready.test`);
        concurrentUsers.push({ id: u.id, email: u.email, token: auth.token });
      }

      // Fire 10 simultaneous registration requests at the exact same instant using Promise.all
      const concurrentResponses = await Promise.all(
        concurrentUsers.map((u) =>
          makeRequest('POST', `/api/v1/events/${raceEventId}/register`, null, {
            Authorization: `Bearer ${u.token}`,
          })
        )
      );

      const status201s = concurrentResponses.filter((r) => r.statusCode === 201);
      const status400s = concurrentResponses.filter((r) => r.statusCode === 400);

      assert(status201s.length === 3, `Exactly 3 registrations succeeded (Got ${status201s.length})`);
      assert(status400s.length === 7, `Exactly 7 registrations rejected due to capacity (Got ${status400s.length})`);
      assert(
        status400s.every((r) => r.body.error && r.body.error.message.includes('capacity')),
        'All 7 rejected requests received capacity error message'
      );

      // Verify database state: exactly 3 active registrations exist
      const actualDbCount = await prisma.registration.count({
        where: { eventId: raceEventId, status: 'REGISTERED' },
      });
      assert(actualDbCount === 3, `Database contains exactly 3 active registrations (Got ${actualDbCount})`);

      // Verify notification isolation:
      // Find the 3 user IDs that succeeded
      const successfulUserIds = status201s.map((r) => r.body.data.registration.userId);
      const failedUsers = concurrentUsers.filter((u) => !successfulUserIds.includes(u.id));
      const successfulUsers = concurrentUsers.filter((u) => successfulUserIds.includes(u.id));

      // Each successful user should have received a confirmation notification
      let allSuccessNotified = true;
      for (const su of successfulUsers) {
        const notifs = await makeRequest('GET', '/api/v1/notifications?type=EVENT_REMINDER', null, {
          Authorization: `Bearer ${su.token}`,
        });
        const notifList = notifs.body.data.notifications || notifs.body.data || [];
        if (!notifList.some((n) => n.title.includes('High Concurrency Drill'))) {
          allSuccessNotified = false;
        }
      }
      assert(allSuccessNotified, 'All 3 successful registrants received confirmation notifications');

      // None of the 7 failed users should have received a notification
      let noFailedNotified = true;
      for (const fu of failedUsers) {
        const notifs = await makeRequest('GET', '/api/v1/notifications?type=EVENT_REMINDER', null, {
          Authorization: `Bearer ${fu.token}`,
        });
        const notifList = notifs.body.data.notifications || notifs.body.data || [];
        if (notifList.some((n) => n.title.includes('High Concurrency Drill'))) {
          noFailedNotified = false;
        }
      }
      assert(noFailedNotified, 'Zero failed registrants received confirmation notifications');

      console.log('\n=== 33. Concurrency Test: Simultaneous Duplicate Requests from Same User ===');
      // Create an event with plenty of capacity
      const dupEventRes = await makeRequest(
        'POST',
        '/api/v1/events',
        {
          title: '[TEST] Duplicate Race Drill',
          description: 'Testing duplicate registration prevention under concurrent requests.',
          location: 'Hall',
          startDate: new Date(Date.now() + 400000000).toISOString(),
          endDate: new Date(Date.now() + 410000000).toISOString(),
          capacity: 50,
        },
        adminH
      );
      const dupEventId = dupEventRes.body.data.event.id;

      // Single citizen fires 5 simultaneous registration requests to the same event
      const singleUser = concurrentUsers[0];
      const dupResponses = await Promise.all([
        makeRequest('POST', `/api/v1/events/${dupEventId}/register`, null, { Authorization: `Bearer ${singleUser.token}` }),
        makeRequest('POST', `/api/v1/events/${dupEventId}/register`, null, { Authorization: `Bearer ${singleUser.token}` }),
        makeRequest('POST', `/api/v1/events/${dupEventId}/register`, null, { Authorization: `Bearer ${singleUser.token}` }),
        makeRequest('POST', `/api/v1/events/${dupEventId}/register`, null, { Authorization: `Bearer ${singleUser.token}` }),
        makeRequest('POST', `/api/v1/events/${dupEventId}/register`, null, { Authorization: `Bearer ${singleUser.token}` }),
      ]);

      const dupSuccess = dupResponses.filter((r) => r.statusCode === 201);
      const dupConflict = dupResponses.filter((r) => r.statusCode === 409);

      assert(dupSuccess.length === 1, `Exactly 1 duplicate request succeeded (Got ${dupSuccess.length})`);
      assert(dupConflict.length === 4, `Remaining 4 duplicate requests returned 409 Conflict (Got ${dupConflict.length})`);

      const singleUserRegCount = await prisma.registration.count({
        where: { eventId: dupEventId, userId: singleUser.id },
      });
      assert(singleUserRegCount === 1, `Database contains exactly 1 registration for the user (Got ${singleUserRegCount})`);

      // ======================================================================
      // 8. EVENT DELETION
      // ======================================================================
      console.log('\n=== 34. Non-Admin Delete Event Blocked ===');
      const nonAdminDelete = await makeRequest('DELETE', `/api/v1/events/${event2Id}`, null, orgAH);
      assert(nonAdminDelete.statusCode === 403, 'AUTHORITY blocked from deleting event (403)');

      console.log('\n=== 35. ADMIN Deletes Event ===');
      const adminDelete = await makeRequest('DELETE', `/api/v1/events/${event2Id}`, null, adminH);
      assert(adminDelete.statusCode === 200, 'ADMIN deletes event successfully (200)');

      const checkDeleted = await makeRequest('GET', `/api/v1/events/${event2Id}`);
      assert(checkDeleted.statusCode === 404, 'Deleted event is 404');
    } catch (err) {
      console.error('\n💥 UNEXPECTED ERROR:', err.message);
      failed++;
      failures.push(`Unexpected: ${err.message}`);
    } finally {
      await cleanup();
      server.close(async () => {
        await disconnectDB();
        console.log('\n' + '='.repeat(60));
        console.log(`✅ PASSED: ${passed}`);
        console.log(`❌ FAILED: ${failed}`);
        if (failures.length) {
          console.log('\nFailed tests:');
          failures.forEach((f) => console.log(`  - ${f}`));
        }
        if (failed === 0) {
          console.log('\n🎉 ALL 35 EVENT, REGISTRATION & CONCURRENCY TESTS PASSED PERFECTLY!');
        } else {
          console.error(`\n💥 ${failed} TEST(S) FAILED`);
          process.exit(1);
        }
      });
    }
  });
}

runEventTestSuite().catch((err) => {
  console.error('Fatal error starting test suite:', err);
  process.exit(1);
});
