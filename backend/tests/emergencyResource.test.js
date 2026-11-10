/**
 * DisasterReady — Module 8: Emergency Resources Integration Test Suite
 * Tests all CRUD operations, authorization, filtering, pagination, and geo-search.
 */

const app = require("../src/app");
const config = require("../src/config/env");
const { prisma, connectDB, disconnectDB } = require("../src/config/db");
const http = require("http");
const argon2 = require("argon2");
const { v4: uuidv4 } = require("crypto").webcrypto
  ? require("crypto")
  : { v4: () => require("crypto").randomUUID() };

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : "";
    const allHeaders = { ...headers };
    if (body) {
      allHeaders["Content-Type"] = "application/json";
      allHeaders["Content-Length"] = Buffer.byteLength(postData);
    }
    const req = http.request(
      {
        hostname: "localhost",
        port: config.port,
        path,
        method,
        headers: allHeaders,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ statusCode: res.statusCode, body: parsed });
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(postData);
    req.end();
  });
}

const TEST_EMAILS = {
  admin: "admin.res@disasterready.test",
  authority: "authority.res@disasterready.test",
  citizen: "citizen.res@disasterready.test",
};

async function loginUser(email) {
  const res = await makeRequest("POST", "/api/v1/auth/login", {
    email,
    password: "SecurePassword123!",
  });
  if (res.statusCode !== 200)
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  return res.body.data.token;
}

async function seedUser(email, role) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const hash = await argon2.hash("SecurePassword123!");
  return prisma.user.create({
    data: {
      email,
      password: hash,
      firstName: role,
      lastName: "User",
      role,
    },
  });
}

async function cleanup() {
  await prisma.emergencyResource.deleteMany({
    where: { name: { startsWith: "[TEST]" } },
  });
  await prisma.session.deleteMany({
    where: { user: { email: { in: Object.values(TEST_EMAILS) } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: Object.values(TEST_EMAILS) } },
  });
}

async function runEmergencyResourceTestSuite() {
  await connectDB();
  await cleanup();

  // Seed test users
  await seedUser(TEST_EMAILS.admin, "ADMIN");
  await seedUser(TEST_EMAILS.authority, "AUTHORITY");
  await seedUser(TEST_EMAILS.citizen, "CITIZEN");

  const server = app.listen(config.port, async () => {
    console.log("\n🚀 Running Module 8 — Emergency Resources Test Suite...\n");

    let passed = 0;
    let failed = 0;
    const failures = [];

    function assert(condition, label, details = "") {
      if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
      } else {
        console.error(`  ❌ ${label}${details ? ` — ${details}` : ""}`);
        failed++;
        failures.push(label);
      }
    }

    try {
      // Login
      const adminToken = await loginUser(TEST_EMAILS.admin);
      const authorityToken = await loginUser(TEST_EMAILS.authority);
      const citizenToken = await loginUser(TEST_EMAILS.citizen);

      const adminH = { Authorization: `Bearer ${adminToken}` };
      const authorityH = { Authorization: `Bearer ${authorityToken}` };
      const citizenH = { Authorization: `Bearer ${citizenToken}` };

      // ================================================================
      console.log("\n=== 1. Public List (no auth) — only active resources ===");
      const pubList = await makeRequest("GET", "/api/v1/emergency-resources");
      assert(pubList.statusCode === 200, "Public list returns 200");
      assert(
        Array.isArray(pubList.body.data.resources),
        "Response has resources array",
      );

      // ================================================================
      console.log("\n=== 2. Create resource — citizen forbidden ===");
      const citizenCreate = await makeRequest(
        "POST",
        "/api/v1/emergency-resources",
        {
          name: "[TEST] Citizen Hospital",
          type: "HOSPITAL",
          address: "123 Test St",
          latitude: 28.6,
          longitude: 77.2,
        },
        citizenH,
      );
      assert(
        citizenCreate.statusCode === 403,
        "Citizen cannot create resource (403)",
      );

      // ================================================================
      console.log("\n=== 3. Create resource — unauthenticated forbidden ===");
      const unauthedCreate = await makeRequest(
        "POST",
        "/api/v1/emergency-resources",
        {
          name: "[TEST] Ghost Hospital",
          type: "HOSPITAL",
          address: "999 Ghost Rd",
          latitude: 28.6,
          longitude: 77.2,
        },
      );
      assert(
        unauthedCreate.statusCode === 401,
        "Unauthenticated create returns 401",
      );

      // ================================================================
      console.log("\n=== 4. Create resource — AUTHORITY success ===");
      const createRes = await makeRequest(
        "POST",
        "/api/v1/emergency-resources",
        {
          name: "[TEST] City Hospital",
          type: "HOSPITAL",
          description: "Main city hospital with 24/7 emergency",
          address: "1 Hospital Road, New Delhi",
          latitude: 28.6448,
          longitude: 77.2167,
          phone: "+91-11-2345-6789",
          capacity: 500,
        },
        authorityH,
      );
      assert(createRes.statusCode === 201, "AUTHORITY creates resource (201)");
      assert(
        createRes.body.data.resource.name === "[TEST] City Hospital",
        "Name matches",
      );
      assert(createRes.body.data.resource.type === "HOSPITAL", "Type matches");
      assert(
        createRes.body.data.resource.isActive === true,
        "isActive defaults true",
      );
      const resourceId = createRes.body.data.resource.id;

      // ================================================================
      console.log("\n=== 5. Create resource — ADMIN success ===");
      const createRes2 = await makeRequest(
        "POST",
        "/api/v1/emergency-resources",
        {
          name: "[TEST] North Fire Station",
          type: "FIRE_STATION",
          address: "5 North Ave, New Delhi",
          latitude: 28.7,
          longitude: 77.1,
          capacity: 20,
        },
        adminH,
      );
      assert(createRes2.statusCode === 201, "ADMIN creates resource (201)");
      const resource2Id = createRes2.body.data.resource.id;

      // Create an inactive resource for filter tests
      const inactiveRes = await makeRequest(
        "POST",
        "/api/v1/emergency-resources",
        {
          name: "[TEST] Closed Shelter",
          type: "SHELTER",
          address: "0 Closed Lane",
          latitude: 28.5,
          longitude: 77.3,
          isActive: false,
        },
        adminH,
      );
      assert(
        inactiveRes.statusCode === 201,
        "Admin creates inactive resource (201)",
      );
      const inactiveId = inactiveRes.body.data.resource.id;

      // ================================================================
      console.log("\n=== 6. Validation — missing required fields ===");
      const badCreate = await makeRequest(
        "POST",
        "/api/v1/emergency-resources",
        {
          name: "[TEST] Bad",
          // missing type, address, latitude, longitude
        },
        adminH,
      );
      assert(
        badCreate.statusCode === 400,
        "Missing required fields returns 400",
      );

      // ================================================================
      console.log("\n=== 7. Get by ID — public can see active resource ===");
      const getActive = await makeRequest(
        "GET",
        `/api/v1/emergency-resources/${resourceId}`,
      );
      assert(getActive.statusCode === 200, "Public gets active resource (200)");
      assert(
        getActive.body.data.resource.id === resourceId,
        "Returns correct resource",
      );

      // ================================================================
      console.log(
        "\n=== 8. Get by ID — public cannot see inactive resource ===",
      );
      const getInactive = await makeRequest(
        "GET",
        `/api/v1/emergency-resources/${inactiveId}`,
      );
      assert(
        getInactive.statusCode === 404,
        "Public cannot see inactive resource (404)",
      );

      // ================================================================
      console.log("\n=== 9. Get by ID — ADMIN can see inactive resource ===");
      const adminGetInactive = await makeRequest(
        "GET",
        `/api/v1/emergency-resources/${inactiveId}`,
        null,
        adminH,
      );
      assert(
        adminGetInactive.statusCode === 200,
        "ADMIN sees inactive resource (200)",
      );

      // ================================================================
      console.log("\n=== 10. Get by ID — not found ===");
      const notFound = await makeRequest(
        "GET",
        `/api/v1/emergency-resources/00000000-0000-0000-0000-000000000000`,
      );
      assert(notFound.statusCode === 404, "Not found returns 404");

      // ================================================================
      console.log("\n=== 11. List — type filter ===");
      const typeFilter = await makeRequest(
        "GET",
        "/api/v1/emergency-resources?type=HOSPITAL",
      );
      assert(typeFilter.statusCode === 200, "Type filter returns 200");
      const hospitals = typeFilter.body.data.resources;
      assert(
        hospitals.every((r) => r.type === "HOSPITAL"),
        "All results are HOSPITAL type",
      );

      // ================================================================
      console.log("\n=== 12. List — search filter ===");
      const searchRes = await makeRequest(
        "GET",
        "/api/v1/emergency-resources?search=City+Hospital",
      );
      assert(searchRes.statusCode === 200, "Search returns 200");
      assert(
        searchRes.body.data.resources.some(
          (r) => r.name === "[TEST] City Hospital",
        ),
        "Search finds the resource",
      );

      // ================================================================
      console.log("\n=== 13. List — pagination ===");
      const page1 = await makeRequest(
        "GET",
        "/api/v1/emergency-resources?page=1&limit=1",
      );
      assert(page1.statusCode === 200, "Paginated list returns 200");
      assert(
        page1.body.data.resources.length <= 1,
        "Pagination limit=1 respected",
      );
      assert(
        page1.body.data.pagination.limit === 1,
        "Pagination metadata correct",
      );

      // ================================================================
      console.log(
        "\n=== 14. List — ADMIN sees inactive resources when isActive=false ===",
      );
      const adminInactive = await makeRequest(
        "GET",
        "/api/v1/emergency-resources?isActive=false",
        null,
        adminH,
      );
      assert(
        adminInactive.statusCode === 200,
        "Admin inactive filter returns 200",
      );
      assert(
        adminInactive.body.data.resources.some((r) => r.id === inactiveId),
        "Admin sees inactive resource",
      );

      // ================================================================
      console.log("\n=== 15. Geographic search — resources near New Delhi ===");
      const geoRes = await makeRequest(
        "GET",
        "/api/v1/emergency-resources?latitude=28.6139&longitude=77.2090&radiusKm=20",
      );
      assert(geoRes.statusCode === 200, "Geo search returns 200");
      assert(
        Array.isArray(geoRes.body.data.resources),
        "Geo search returns resources array",
      );
      // City Hospital at 28.6448, 77.2167 is ~3.5 km from center — should be in results
      assert(
        geoRes.body.data.resources.some(
          (r) => r.name === "[TEST] City Hospital",
        ),
        "City Hospital appears in nearby geo search",
      );

      // ================================================================
      console.log("\n=== 16. Update resource — citizen forbidden ===");
      const citizenUpdate = await makeRequest(
        "PATCH",
        `/api/v1/emergency-resources/${resourceId}`,
        {
          name: "[TEST] Hacked Hospital",
        },
        citizenH,
      );
      assert(
        citizenUpdate.statusCode === 403,
        "Citizen cannot update resource (403)",
      );

      // ================================================================
      console.log("\n=== 17. Update resource — AUTHORITY success ===");
      const updateRes = await makeRequest(
        "PATCH",
        `/api/v1/emergency-resources/${resourceId}`,
        {
          capacity: 750,
          description: "Updated description",
        },
        authorityH,
      );
      assert(updateRes.statusCode === 200, "AUTHORITY updates resource (200)");
      assert(
        updateRes.body.data.resource.capacity === 750,
        "Capacity updated correctly",
      );

      // ================================================================
      console.log("\n=== 18. Update — no fields provided ===");
      const noUpdate = await makeRequest(
        "PATCH",
        `/api/v1/emergency-resources/${resourceId}`,
        {},
        adminH,
      );
      assert(noUpdate.statusCode === 400, "No fields update returns 400");

      // ================================================================
      console.log("\n=== 19. Update — not found ===");
      const noExistUpdate = await makeRequest(
        "PATCH",
        "/api/v1/emergency-resources/00000000-0000-0000-0000-000000000000",
        {
          name: "[TEST] Ghost Update",
        },
        adminH,
      );
      assert(
        noExistUpdate.statusCode === 404,
        "Update not-found resource returns 404",
      );

      // ================================================================
      console.log("\n=== 20. Deactivate resource — AUTHORITY soft-delete ===");
      const deactivate = await makeRequest(
        "DELETE",
        `/api/v1/emergency-resources/${resource2Id}`,
        null,
        authorityH,
      );
      assert(
        deactivate.statusCode === 200,
        "AUTHORITY deactivates resource (200)",
      );
      // Verify it's now inactive
      const checkDeactivated = await makeRequest(
        "GET",
        `/api/v1/emergency-resources/${resource2Id}`,
      );
      assert(
        checkDeactivated.statusCode === 404,
        "Deactivated resource not visible to public",
      );

      // ================================================================
      console.log("\n=== 21. Delete — citizen forbidden ===");
      const citizenDelete = await makeRequest(
        "DELETE",
        `/api/v1/emergency-resources/${resourceId}`,
        null,
        citizenH,
      );
      assert(
        citizenDelete.statusCode === 403,
        "Citizen cannot delete resource (403)",
      );

      // ================================================================
      console.log("\n=== 22. Hard delete — ADMIN only ===");
      const hardDelete = await makeRequest(
        "DELETE",
        `/api/v1/emergency-resources/${resourceId}?hard=true`,
        null,
        adminH,
      );
      assert(
        hardDelete.statusCode === 200,
        "ADMIN hard-deletes resource (200)",
      );
      const checkHardDeleted = await makeRequest(
        "GET",
        `/api/v1/emergency-resources/${resourceId}`,
        null,
        adminH,
      );
      assert(
        checkHardDeleted.statusCode === 404,
        "Hard-deleted resource is gone (404)",
      );

      // ================================================================
      console.log("\n=== 23. Invalid phone number ===");
      const badPhone = await makeRequest(
        "POST",
        "/api/v1/emergency-resources",
        {
          name: "[TEST] Bad Phone Resource",
          type: "SHELTER",
          address: "1 Test St",
          latitude: 28.6,
          longitude: 77.2,
          phone: "NOT-A-PHONE",
        },
        adminH,
      );
      assert(badPhone.statusCode === 400, "Invalid phone number returns 400");

      // ================================================================
      console.log("\n=== 24. Invalid coordinates ===");
      const badCoords = await makeRequest(
        "POST",
        "/api/v1/emergency-resources",
        {
          name: "[TEST] Bad Coords",
          type: "SHELTER",
          address: "1 Test St",
          latitude: 999,
          longitude: 77.2,
        },
        adminH,
      );
      assert(badCoords.statusCode === 400, "Invalid latitude returns 400");

      // ================================================================
      console.log("\n=== 25. Negative capacity ===");
      const badCapacity = await makeRequest(
        "POST",
        "/api/v1/emergency-resources",
        {
          name: "[TEST] Negative Capacity",
          type: "SHELTER",
          address: "1 Test St",
          latitude: 28.6,
          longitude: 77.2,
          capacity: -10,
        },
        adminH,
      );
      assert(badCapacity.statusCode === 400, "Negative capacity returns 400");
    } catch (err) {
      console.error("\n💥 UNEXPECTED ERROR:", err.message);
      failed++;
      failures.push(`Unexpected: ${err.message}`);
    } finally {
      await cleanup();
      server.close(async () => {
        await disconnectDB();
        console.log("\n" + "=".repeat(60));
        console.log(`✅ PASSED: ${passed}`);
        console.log(`❌ FAILED: ${failed}`);
        if (failures.length) {
          console.log("\nFailed tests:");
          failures.forEach((f) => console.log(`  - ${f}`));
        }
        if (failed === 0) {
          console.log("\n🎉 ALL EMERGENCY RESOURCES TESTS PASSED!");
        } else {
          console.error(`\n💥 ${failed} TEST(S) FAILED`);
          process.exit(1);
        }
      });
    }
  });
}

runEmergencyResourceTestSuite().catch((err) => {
  console.error("Fatal error starting test suite:", err);
  process.exit(1);
});
