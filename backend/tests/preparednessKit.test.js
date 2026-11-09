/**
 * DisasterReady — Module 10: Preparedness Kit Integration Test Suite
 * Tests CRUD, ownership isolation, filtering, pagination, and readiness management.
 */

const app = require("../src/app");
const config = require("../src/config/env");
const { prisma, connectDB, disconnectDB } = require("../src/config/db");
const http = require("http");
const argon2 = require("argon2");

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
  alice: "alice.kit@disasterready.test",
  bob: "bob.kit@disasterready.test",
};

async function seedUser(email) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const hash = await argon2.hash("SecurePassword123!");
  return prisma.user.create({
    data: {
      email,
      password: hash,
      firstName: email.split(".")[0],
      lastName: "KitUser",
      role: "CITIZEN",
    },
  });
}

async function loginUser(email) {
  const res = await makeRequest("POST", "/api/v1/auth/login", {
    email,
    password: "SecurePassword123!",
  });
  if (res.statusCode !== 200)
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  return { token: res.body.data.token, userId: res.body.data.user.id };
}

async function cleanup() {
  const emails = Object.values(TEST_EMAILS);
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);
  if (userIds.length > 0) {
    await prisma.preparednessItem.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
  }
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
}

async function runPreparednessKitTestSuite() {
  await connectDB();
  await cleanup();

  await seedUser(TEST_EMAILS.alice);
  await seedUser(TEST_EMAILS.bob);

  const server = app.listen(config.port, async () => {
    console.log("\n🚀 Running Module 10 — Preparedness Kit Test Suite...\n");

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
      const alice = await loginUser(TEST_EMAILS.alice);
      const bob = await loginUser(TEST_EMAILS.bob);

      const aliceH = { Authorization: `Bearer ${alice.token}` };
      const bobH = { Authorization: `Bearer ${bob.token}` };

      // ================================================================
      console.log("\n=== 1. Unauthenticated access denied ===");
      const unauth = await makeRequest("GET", "/api/v1/preparedness-kit");
      assert(
        unauth.statusCode === 401,
        "GET /preparedness-kit requires auth (401)",
      );

      // ================================================================
      console.log("\n=== 2. Alice — empty kit ===");
      const emptyKit = await makeRequest(
        "GET",
        "/api/v1/preparedness-kit",
        null,
        aliceH,
      );
      assert(emptyKit.statusCode === 200, "Alice gets empty kit (200)");
      assert(emptyKit.body.data.items.length === 0, "Kit is empty initially");
      assert(emptyKit.body.data.stats.totalItems === 0, "Stats show 0 items");

      // ================================================================
      console.log("\n=== 3. Add items to Alice's kit ===");
      const item1Res = await makeRequest(
        "POST",
        "/api/v1/preparedness-kit",
        {
          name: "First Aid Kit",
          category: "Medical",
          quantity: 1,
          isReady: true,
        },
        aliceH,
      );
      assert(item1Res.statusCode === 201, "Item 1 added (201)");
      assert(
        item1Res.body.data.item.name === "First Aid Kit",
        "Item name correct",
      );
      assert(item1Res.body.data.item.isReady === true, "isReady set correctly");
      const item1Id = item1Res.body.data.item.id;

      const item2Res = await makeRequest(
        "POST",
        "/api/v1/preparedness-kit",
        {
          name: "Water Bottles (5L)",
          category: "Food & Water",
          quantity: 10,
          isReady: false,
        },
        aliceH,
      );
      assert(item2Res.statusCode === 201, "Item 2 added (201)");
      const item2Id = item2Res.body.data.item.id;

      const item3Res = await makeRequest(
        "POST",
        "/api/v1/preparedness-kit",
        {
          name: "Flashlight",
          category: "Tools",
          quantity: 2,
          isReady: false,
        },
        aliceH,
      );
      assert(item3Res.statusCode === 201, "Item 3 added (201)");
      const item3Id = item3Res.body.data.item.id;

      // ================================================================
      console.log("\n=== 4. List Alice's kit ===");
      const listKit = await makeRequest(
        "GET",
        "/api/v1/preparedness-kit",
        null,
        aliceH,
      );
      assert(listKit.statusCode === 200, "List kit returns 200");
      assert(listKit.body.data.items.length === 3, "3 items in Alice's kit");
      assert(listKit.body.data.stats.totalItems === 3, "Stats: 3 total");
      assert(listKit.body.data.stats.readyItems === 1, "Stats: 1 ready");
      assert(listKit.body.data.stats.notReadyItems === 2, "Stats: 2 not ready");
      assert(
        listKit.body.data.stats.readinessPercentage === 33,
        "Stats: 33% ready",
      );

      // ================================================================
      console.log("\n=== 5. Get item by ID ===");
      const getItem = await makeRequest(
        "GET",
        `/api/v1/preparedness-kit/${item1Id}`,
        null,
        aliceH,
      );
      assert(getItem.statusCode === 200, "Get item by ID returns 200");
      assert(getItem.body.data.item.id === item1Id, "Returns correct item");

      // ================================================================
      console.log("\n=== 6. Get item — not found ===");
      const notFound = await makeRequest(
        "GET",
        "/api/v1/preparedness-kit/00000000-0000-0000-0000-000000000000",
        null,
        aliceH,
      );
      assert(notFound.statusCode === 404, "Not found returns 404");

      // ================================================================
      console.log("\n=== 7. Category filter ===");
      const catFilter = await makeRequest(
        "GET",
        "/api/v1/preparedness-kit?category=Medical",
        null,
        aliceH,
      );
      assert(catFilter.statusCode === 200, "Category filter returns 200");
      assert(
        catFilter.body.data.items.length === 1,
        "Category filter returns 1 item",
      );
      assert(
        catFilter.body.data.items[0].category === "Medical",
        "Item category correct",
      );

      // ================================================================
      console.log("\n=== 8. Readiness filter ===");
      const readyFilter = await makeRequest(
        "GET",
        "/api/v1/preparedness-kit?isReady=false",
        null,
        aliceH,
      );
      assert(
        readyFilter.statusCode === 200,
        "isReady=false filter returns 200",
      );
      assert(
        readyFilter.body.data.items.length === 2,
        "Filter shows 2 not-ready items",
      );

      // ================================================================
      console.log("\n=== 9. Pagination ===");
      const page1 = await makeRequest(
        "GET",
        "/api/v1/preparedness-kit?page=1&limit=2",
        null,
        aliceH,
      );
      assert(page1.statusCode === 200, "Pagination page 1 returns 200");
      assert(page1.body.data.items.length === 2, "Page 1 has 2 items");
      assert(page1.body.data.pagination.total === 3, "Total is 3");
      assert(page1.body.data.pagination.hasNextPage === true, "Has next page");

      const page2 = await makeRequest(
        "GET",
        "/api/v1/preparedness-kit?page=2&limit=2",
        null,
        aliceH,
      );
      assert(page2.statusCode === 200, "Pagination page 2 returns 200");
      assert(page2.body.data.items.length === 1, "Page 2 has 1 item");

      // ================================================================
      console.log("\n=== 10. Update item details ===");
      const updateItem = await makeRequest(
        "PATCH",
        `/api/v1/preparedness-kit/${item2Id}`,
        {
          quantity: 20,
          description: "Emergency water supply for 3 days",
        },
        aliceH,
      );
      assert(updateItem.statusCode === 200, "Update item returns 200");
      assert(
        updateItem.body.data.item.quantity === 20,
        "Quantity updated to 20",
      );

      // ================================================================
      console.log("\n=== 11. Update readiness ===");
      const readinessUpdate = await makeRequest(
        "PATCH",
        `/api/v1/preparedness-kit/${item2Id}/readiness`,
        {
          isReady: true,
        },
        aliceH,
      );
      assert(
        readinessUpdate.statusCode === 200,
        "Readiness update returns 200",
      );
      assert(
        readinessUpdate.body.data.item.isReady === true,
        "isReady updated to true",
      );

      // Verify stats updated
      const updatedStats = await makeRequest(
        "GET",
        "/api/v1/preparedness-kit",
        null,
        aliceH,
      );
      assert(
        updatedStats.body.data.stats.readyItems === 2,
        "Stats reflect 2 ready items now",
      );

      // ================================================================
      console.log("\n=== 12. Kit stats endpoint ===");
      const statsRes = await makeRequest(
        "GET",
        "/api/v1/preparedness-kit/stats",
        null,
        aliceH,
      );
      assert(statsRes.statusCode === 200, "Stats endpoint returns 200");
      assert(statsRes.body.data.stats.totalItems === 3, "Stats: 3 total items");
      assert(
        Array.isArray(statsRes.body.data.stats.categories),
        "Stats include category breakdown",
      );

      // ================================================================
      console.log(
        "\n=== 13. Cross-user isolation — Bob cannot see Alice's items ===",
      );
      const bobSeeAlice = await makeRequest(
        "GET",
        `/api/v1/preparedness-kit/${item1Id}`,
        null,
        bobH,
      );
      assert(
        bobSeeAlice.statusCode === 404,
        "Bob cannot see Alice's item (404)",
      );

      // ================================================================
      console.log(
        "\n=== 14. Cross-user isolation — Bob cannot update Alice's items ===",
      );
      const bobUpdateAlice = await makeRequest(
        "PATCH",
        `/api/v1/preparedness-kit/${item1Id}`,
        {
          name: "Hacked Item",
        },
        bobH,
      );
      assert(
        bobUpdateAlice.statusCode === 404,
        "Bob cannot update Alice's item (404)",
      );

      // ================================================================
      console.log(
        "\n=== 15. Cross-user isolation — Bob cannot delete Alice's items ===",
      );
      const bobDeleteAlice = await makeRequest(
        "DELETE",
        `/api/v1/preparedness-kit/${item1Id}`,
        null,
        bobH,
      );
      assert(
        bobDeleteAlice.statusCode === 404,
        "Bob cannot delete Alice's item (404)",
      );

      // ================================================================
      console.log("\n=== 16. Bob's kit is separate ===");
      await makeRequest(
        "POST",
        "/api/v1/preparedness-kit",
        {
          name: "Bob's Torch",
          category: "Tools",
          quantity: 1,
        },
        bobH,
      );
      const bobKit = await makeRequest(
        "GET",
        "/api/v1/preparedness-kit",
        null,
        bobH,
      );
      assert(bobKit.body.data.items.length === 1, "Bob's kit has 1 item");
      const aliceKit = await makeRequest(
        "GET",
        "/api/v1/preparedness-kit",
        null,
        aliceH,
      );
      assert(
        aliceKit.body.data.items.length === 3,
        "Alice's kit still has 3 items",
      );

      // ================================================================
      console.log("\n=== 17. Validation — missing required name ===");
      const noName = await makeRequest(
        "POST",
        "/api/v1/preparedness-kit",
        {
          category: "Medical",
          quantity: 1,
        },
        aliceH,
      );
      assert(noName.statusCode === 400, "Missing name returns 400");

      // ================================================================
      console.log("\n=== 18. Validation — negative quantity ===");
      const negQty = await makeRequest(
        "POST",
        "/api/v1/preparedness-kit",
        {
          name: "Bad Item",
          category: "Medical",
          quantity: -5,
        },
        aliceH,
      );
      assert(negQty.statusCode === 400, "Negative quantity returns 400");

      // ================================================================
      console.log("\n=== 19. Update readiness — missing isReady ===");
      const badReadiness = await makeRequest(
        "PATCH",
        `/api/v1/preparedness-kit/${item3Id}/readiness`,
        {},
        aliceH,
      );
      assert(
        badReadiness.statusCode === 400,
        "Missing isReady on readiness endpoint returns 400",
      );

      // ================================================================
      console.log("\n=== 20. Delete item ===");
      const deleteItem = await makeRequest(
        "DELETE",
        `/api/v1/preparedness-kit/${item3Id}`,
        null,
        aliceH,
      );
      assert(deleteItem.statusCode === 200, "Delete item returns 200");
      const afterDelete = await makeRequest(
        "GET",
        `/api/v1/preparedness-kit/${item3Id}`,
        null,
        aliceH,
      );
      assert(afterDelete.statusCode === 404, "Deleted item returns 404");

      // ================================================================
      console.log("\n=== 21. Delete — not found ===");
      const noExistDelete = await makeRequest(
        "DELETE",
        "/api/v1/preparedness-kit/00000000-0000-0000-0000-000000000000",
        null,
        aliceH,
      );
      assert(
        noExistDelete.statusCode === 404,
        "Delete not-found item returns 404",
      );
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
          console.log("\n🎉 ALL PREPAREDNESS KIT TESTS PASSED!");
        } else {
          console.error(`\n💥 ${failed} TEST(S) FAILED`);
          process.exit(1);
        }
      });
    }
  });
}

runPreparednessKitTestSuite().catch((err) => {
  console.error("Fatal error starting test suite:", err);
  process.exit(1);
});
