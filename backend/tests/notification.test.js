const app = require("../src/app");
const config = require("../src/config/env");
const { prisma, connectDB, disconnectDB } = require("../src/config/db");
const notificationService = require("../src/services/notification.service");
const http = require("http");

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
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(postData);
    req.end();
  });
}

async function runNotificationTestSuite() {
  await connectDB();

  // Test account emails
  const adminEmail = "notify.admin.test@disasterready.org";
  const authorityEmail = "notify.authority.test@disasterready.org";
  const citizenAEmail = "notify.citizena.test@disasterready.org";
  const citizenBEmail = "notify.citizenb.test@disasterready.org";
  const allTestEmails = [
    adminEmail,
    authorityEmail,
    citizenAEmail,
    citizenBEmail,
  ];

  const testDisasterName = "Notification Test Disaster Cyclone";
  const testEventTitle = "Notification Test Flood Drill";

  // Pre-test cleanup
  await prisma.notification.deleteMany({
    where: { user: { email: { in: allTestEmails } } },
  });
  await prisma.registration.deleteMany({
    where: { user: { email: { in: allTestEmails } } },
  });
  await prisma.event.deleteMany({
    where: { title: testEventTitle },
  });
  await prisma.incidentReport.deleteMany({
    where: { reportedBy: { email: { in: allTestEmails } } },
  });
  await prisma.alert.deleteMany({
    where: { issuedBy: { email: { in: allTestEmails } } },
  });
  await prisma.disaster.deleteMany({
    where: { name: testDisasterName },
  });
  await prisma.session.deleteMany({
    where: { user: { email: { in: allTestEmails } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: allTestEmails } },
  });

  const server = app.listen(config.port, async () => {
    console.log(
      "🚀 Running DisasterReady Phase 7 / Module 7 Notifications System Test Suite...\n",
    );

    try {
      // ======================================================================
      console.log("=== Setup: Register & Seed Test Accounts ===");

      async function registerAndLogin(
        email,
        firstName,
        lastName,
        role = "CITIZEN",
      ) {
        const regRes = await makeRequest("POST", "/api/v1/auth/register", {
          email,
          password: "SecurePassword123!",
          firstName,
          lastName,
        });

        if (regRes.statusCode !== 201) {
          throw new Error(
            `Failed to register ${email}: ${JSON.stringify(regRes.body)}`,
          );
        }

        const userId = regRes.body.data.user.id;

        if (role !== "CITIZEN") {
          await prisma.user.update({
            where: { email },
            data: { role },
          });
        }

        const loginRes = await makeRequest("POST", "/api/v1/auth/login", {
          email,
          password: "SecurePassword123!",
        });

        return {
          id: userId,
          email,
          token: loginRes.body.data.token,
        };
      }

      const adminUser = await registerAndLogin(
        adminEmail,
        "Admin",
        "User",
        "ADMIN",
      );
      const authorityUser = await registerAndLogin(
        authorityEmail,
        "Officer",
        "Patel",
        "AUTHORITY",
      );
      const citizenA = await registerAndLogin(
        citizenAEmail,
        "Alice",
        "Smith",
        "CITIZEN",
      );
      const citizenB = await registerAndLogin(
        citizenBEmail,
        "Bob",
        "Jones",
        "CITIZEN",
      );

      const adminHeaders = { Authorization: `Bearer ${adminUser.token}` };
      const authHeaders = { Authorization: `Bearer ${authorityUser.token}` };
      const citizenAHeaders = { Authorization: `Bearer ${citizenA.token}` };
      const citizenBHeaders = { Authorization: `Bearer ${citizenB.token}` };

      console.log(
        "✅ Accounts seeded: Admin, Authority, Citizen A, Citizen B\n",
      );

      // Seed 3 initial notifications for Citizen A
      const notif1 = await notificationService.createNotification({
        userId: citizenA.id,
        type: "ALERT",
        title: "Initial Flash Flood Warning",
        message: "A flash flood warning has been issued for your area.",
      });

      const notif2 = await notificationService.createNotification({
        userId: citizenA.id,
        type: "EVENT_REMINDER",
        title: "Initial Earthquake Drill Reminder",
        message: "Community drill starts at 9am tomorrow.",
      });

      const notif3 = await notificationService.createNotification({
        userId: citizenA.id,
        type: "GENERAL",
        title: "Welcome to DisasterReady",
        message:
          "Your account is active. Explore emergency resources and guidelines.",
      });

      // Seed 1 notification for Citizen B
      const notifB = await notificationService.createNotification({
        userId: citizenB.id,
        type: "GENERAL",
        title: "Citizen B Welcome",
        message: "Welcome Bob to DisasterReady.",
      });

      // ======================================================================
      console.log(
        "=== 1. Test Unauthenticated Access Rejection (GET /api/v1/notifications) ===",
      );
      const unauthRes = await makeRequest("GET", "/api/v1/notifications");
      console.log("Status (Expected 401):", unauthRes.statusCode);
      if (unauthRes.statusCode !== 401) {
        throw new Error(`Expected 401, got ${unauthRes.statusCode}`);
      }

      // ======================================================================
      console.log(
        "\n=== 2. Test List Authenticated User Notifications (GET /api/v1/notifications) ===",
      );
      const listResA = await makeRequest(
        "GET",
        "/api/v1/notifications",
        null,
        citizenAHeaders,
      );
      console.log("Status (Expected 200):", listResA.statusCode);
      console.log(
        "Citizen A Total Count (Expected 3):",
        listResA.body.pagination.total,
      );
      if (listResA.statusCode !== 200 || listResA.body.data.length !== 3) {
        throw new Error(
          `Expected 3 notifications for Citizen A, got ${listResA.body.data.length}`,
        );
      }

      // ======================================================================
      console.log(
        "\n=== 3. Test Cross-User Isolation (Citizen B cannot see Citizen A notifications) ===",
      );
      const listResB = await makeRequest(
        "GET",
        "/api/v1/notifications",
        null,
        citizenBHeaders,
      );
      console.log(
        "Citizen B Total Count (Expected 1):",
        listResB.body.pagination.total,
      );
      const containsA = listResB.body.data.some(
        (n) => n.userId === citizenA.id,
      );
      console.log("Contains Citizen A records (Expected false):", containsA);
      if (listResB.body.pagination.total !== 1 || containsA) {
        throw new Error("Cross-user notification isolation breached!");
      }

      // ======================================================================
      console.log(
        "\n=== 4. Test Get Single Notification by ID (GET /api/v1/notifications/:id) ===",
      );
      const getRes = await makeRequest(
        "GET",
        `/api/v1/notifications/${notif1.id}`,
        null,
        citizenAHeaders,
      );
      console.log("Status (Expected 200):", getRes.statusCode);
      console.log("Notification Title:", getRes.body.data.title);
      if (getRes.statusCode !== 200 || getRes.body.data.id !== notif1.id) {
        throw new Error("Failed to retrieve notification by ID");
      }

      // ======================================================================
      console.log(
        "\n=== 5. Test Reject Cross-User Get by ID (Citizen B accessing Citizen A notif) ===",
      );
      const crossGetRes = await makeRequest(
        "GET",
        `/api/v1/notifications/${notif1.id}`,
        null,
        citizenBHeaders,
      );
      console.log("Status (Expected 404):", crossGetRes.statusCode);
      if (crossGetRes.statusCode !== 404) {
        throw new Error(
          `Expected 404 for cross-user get, got ${crossGetRes.statusCode}`,
        );
      }

      // ======================================================================
      console.log(
        "\n=== 6. Test Unread Count (GET /api/v1/notifications/unread-count) ===",
      );
      const countRes1 = await makeRequest(
        "GET",
        "/api/v1/notifications/unread-count",
        null,
        citizenAHeaders,
      );
      console.log("Status (Expected 200):", countRes1.statusCode);
      console.log(
        "Unread Count (Expected 3):",
        countRes1.body.data.unreadCount,
      );
      if (
        countRes1.statusCode !== 200 ||
        countRes1.body.data.unreadCount !== 3
      ) {
        throw new Error(
          `Expected 3 unread, got ${countRes1.body.data.unreadCount}`,
        );
      }

      // ======================================================================
      console.log(
        "\n=== 7. Test Mark Single Notification as Read (PATCH /api/v1/notifications/:id/read) ===",
      );
      const readRes = await makeRequest(
        "PATCH",
        `/api/v1/notifications/${notif1.id}/read`,
        null,
        citizenAHeaders,
      );
      console.log("Status (Expected 200):", readRes.statusCode);
      console.log("isRead (Expected true):", readRes.body.data.isRead);
      if (readRes.statusCode !== 200 || !readRes.body.data.isRead) {
        throw new Error("Failed to mark notification as read");
      }

      // Verify unread count decreased to 2
      const countRes2 = await makeRequest(
        "GET",
        "/api/v1/notifications/unread-count",
        null,
        citizenAHeaders,
      );
      console.log(
        "New Unread Count (Expected 2):",
        countRes2.body.data.unreadCount,
      );
      if (countRes2.body.data.unreadCount !== 2) {
        throw new Error(
          `Expected 2 unread, got ${countRes2.body.data.unreadCount}`,
        );
      }

      // ======================================================================
      console.log(
        "\n=== 8. Test Reject Cross-User Mark Read (Citizen B marking Citizen A notif) ===",
      );
      const crossReadRes = await makeRequest(
        "PATCH",
        `/api/v1/notifications/${notif2.id}/read`,
        null,
        citizenBHeaders,
      );
      console.log("Status (Expected 404):", crossReadRes.statusCode);
      if (crossReadRes.statusCode !== 404) {
        throw new Error(
          `Expected 404 for cross-user read attempt, got ${crossReadRes.statusCode}`,
        );
      }

      // ======================================================================
      console.log(
        "\n=== 9. Test Filter by isRead (GET /api/v1/notifications?isRead=true/false) ===",
      );
      const filterReadRes = await makeRequest(
        "GET",
        "/api/v1/notifications?isRead=true",
        null,
        citizenAHeaders,
      );
      console.log("Read Count (Expected 1):", filterReadRes.body.data.length);
      const filterUnreadRes = await makeRequest(
        "GET",
        "/api/v1/notifications?isRead=false",
        null,
        citizenAHeaders,
      );
      console.log(
        "Unread Count (Expected 2):",
        filterUnreadRes.body.data.length,
      );
      if (
        filterReadRes.body.data.length !== 1 ||
        filterUnreadRes.body.data.length !== 2
      ) {
        throw new Error("Failed to filter notifications by isRead");
      }

      // ======================================================================
      console.log(
        "\n=== 10. Test Filter by Type (GET /api/v1/notifications?type=ALERT) ===",
      );
      const filterTypeRes = await makeRequest(
        "GET",
        "/api/v1/notifications?type=ALERT",
        null,
        citizenAHeaders,
      );
      console.log(
        "Alert Type Count (Expected 1):",
        filterTypeRes.body.data.length,
      );
      console.log(
        "First Type (Expected ALERT):",
        filterTypeRes.body.data[0].type,
      );
      if (
        filterTypeRes.body.data.length !== 1 ||
        filterTypeRes.body.data[0].type !== "ALERT"
      ) {
        throw new Error("Failed to filter notifications by type");
      }

      // ======================================================================
      console.log(
        "\n=== 11. Test Pagination & Limit (GET /api/v1/notifications?limit=2&page=1) ===",
      );
      const page1Res = await makeRequest(
        "GET",
        "/api/v1/notifications?limit=2&page=1",
        null,
        citizenAHeaders,
      );
      console.log(
        "Page 1 items count (Expected 2):",
        page1Res.body.data.length,
      );
      console.log("Pagination metadata:", page1Res.body.pagination);
      const page2Res = await makeRequest(
        "GET",
        "/api/v1/notifications?limit=2&page=2",
        null,
        citizenAHeaders,
      );
      console.log(
        "Page 2 items count (Expected 1):",
        page2Res.body.data.length,
      );
      if (page1Res.body.data.length !== 2 || page2Res.body.data.length !== 1) {
        throw new Error("Pagination test failed");
      }

      // ======================================================================
      console.log("\n=== 12. Test Sorting Order (sortOrder=asc vs desc) ===");
      const ascRes = await makeRequest(
        "GET",
        "/api/v1/notifications?sortOrder=asc",
        null,
        citizenAHeaders,
      );
      const descRes = await makeRequest(
        "GET",
        "/api/v1/notifications?sortOrder=desc",
        null,
        citizenAHeaders,
      );
      console.log("Asc first ID:", ascRes.body.data[0].id);
      console.log("Desc first ID:", descRes.body.data[0].id);
      if (ascRes.body.data[0].id === descRes.body.data[0].id) {
        throw new Error(
          "Sort order test failed: asc and desc yielded same first item",
        );
      }

      // ======================================================================
      console.log(
        "\n=== 13. Test Mark All as Read (PATCH /api/v1/notifications/read-all) ===",
      );
      const readAllRes = await makeRequest(
        "PATCH",
        "/api/v1/notifications/read-all",
        null,
        citizenAHeaders,
      );
      console.log("Status (Expected 200):", readAllRes.statusCode);
      console.log(
        "Updated Count (Expected 2):",
        readAllRes.body.data.updatedCount,
      );
      const countRes3 = await makeRequest(
        "GET",
        "/api/v1/notifications/unread-count",
        null,
        citizenAHeaders,
      );
      console.log(
        "Remaining Unread Count (Expected 0):",
        countRes3.body.data.unreadCount,
      );
      if (
        readAllRes.statusCode !== 200 ||
        readAllRes.body.data.updatedCount !== 2 ||
        countRes3.body.data.unreadCount !== 0
      ) {
        throw new Error("Failed to mark all notifications as read");
      }

      // ======================================================================
      console.log(
        "\n=== 14. Test Delete Notification (DELETE /api/v1/notifications/:id) ===",
      );
      const delRes = await makeRequest(
        "DELETE",
        `/api/v1/notifications/${notif1.id}`,
        null,
        citizenAHeaders,
      );
      console.log("Status (Expected 200):", delRes.statusCode);
      const verifyDelRes = await makeRequest(
        "GET",
        `/api/v1/notifications/${notif1.id}`,
        null,
        citizenAHeaders,
      );
      console.log(
        "Subsequent GET status (Expected 404):",
        verifyDelRes.statusCode,
      );
      if (delRes.statusCode !== 200 || verifyDelRes.statusCode !== 404) {
        throw new Error("Failed to delete notification");
      }

      // ======================================================================
      console.log(
        "\n=== 15. Test Reject Cross-User Delete (Citizen B deleting Citizen A notif) ===",
      );
      const crossDelRes = await makeRequest(
        "DELETE",
        `/api/v1/notifications/${notif2.id}`,
        null,
        citizenBHeaders,
      );
      console.log("Status (Expected 404):", crossDelRes.statusCode);
      if (crossDelRes.statusCode !== 404) {
        throw new Error(
          `Expected 404 for cross-user delete, got ${crossDelRes.statusCode}`,
        );
      }

      // ======================================================================
      console.log("\n=== 16. Test Route Aliasing (/api/notifications) ===");
      const aliasRes = await makeRequest(
        "GET",
        "/api/notifications",
        null,
        citizenAHeaders,
      );
      console.log("Status (Expected 200):", aliasRes.statusCode);
      if (aliasRes.statusCode !== 200) {
        throw new Error("Route alias /api/notifications failed");
      }

      // ======================================================================
      console.log(
        "\n=== 17. Test Notification Generation: Incident Report Status Update ===",
      );
      // Citizen A creates an incident report
      const incidentCreateRes = await makeRequest(
        "POST",
        "/api/v1/incidents",
        {
          title: "Downed Power Lines Near Park",
          description: "High voltage power cables fallen across walking path.",
          latitude: 18.5204,
          longitude: 73.8567,
        },
        citizenAHeaders,
      );
      const incidentId = incidentCreateRes.body.data.id;

      // Check Citizen A notifications before status update
      const notifBefore = await makeRequest(
        "GET",
        "/api/v1/notifications?type=INCIDENT_UPDATE",
        null,
        citizenAHeaders,
      );
      const countBefore = notifBefore.body.data.length;

      // Authority updates status to UNDER_REVIEW
      const incidentUpdateRes = await makeRequest(
        "PATCH",
        `/api/v1/incidents/${incidentId}`,
        {
          status: "UNDER_REVIEW",
        },
        authHeaders,
      );
      console.log(
        "Incident status updated to:",
        incidentUpdateRes.body.data.status,
      );

      // Check Citizen A notifications after status update
      const notifAfter = await makeRequest(
        "GET",
        "/api/v1/notifications?type=INCIDENT_UPDATE",
        null,
        citizenAHeaders,
      );
      console.log(
        "Incident update notifications (Expected +1):",
        notifAfter.body.data.length - countBefore,
      );
      const latestNotif = notifAfter.body.data[0];
      console.log("Notification Title:", latestNotif.title);
      console.log("Notification Message:", latestNotif.message);
      if (
        notifAfter.body.data.length !== countBefore + 1 ||
        !latestNotif.message.includes("UNDER_REVIEW")
      ) {
        throw new Error(
          "Incident status update did not trigger notification to reporter!",
        );
      }

      // ======================================================================
      console.log(
        "\n=== 18. Test Notification Generation: Content-only Incident Edit (No Status Change) ===",
      );
      // Citizen A updates description of incident
      await makeRequest(
        "PATCH",
        `/api/v1/incidents/${incidentId}`,
        {
          description: "Updated cable description.",
        },
        citizenAHeaders,
      );

      const notifAfterEdit = await makeRequest(
        "GET",
        "/api/v1/notifications?type=INCIDENT_UPDATE",
        null,
        citizenAHeaders,
      );
      console.log(
        "Notifications count after content-only edit (Expected same):",
        notifAfterEdit.body.data.length === notifAfter.body.data.length,
      );
      if (notifAfterEdit.body.data.length !== notifAfter.body.data.length) {
        throw new Error("Content-only edit triggered unwanted notification");
      }

      // ======================================================================
      console.log(
        "\n=== 19. Test Notification Generation: Emergency Alert Creation ===",
      );
      // Seed a disaster for the alert
      const disaster = await prisma.disaster.create({
        data: {
          name: testDisasterName,
          type: "CYCLONE",
          description: "Approaching coastal cyclone.",
        },
      });

      // Clear existing alert notifications for Citizen B
      await prisma.notification.deleteMany({
        where: { userId: citizenB.id, type: "ALERT" },
      });

      // Authority issues active emergency alert
      const alertRes = await makeRequest(
        "POST",
        "/api/v1/alerts",
        {
          title: "Severe Coastal Cyclone Warning",
          description:
            "Category 3 cyclone approaching. Evacuate low-lying areas.",
          severity: "CRITICAL",
          status: "ACTIVE",
          disasterId: disaster.id,
        },
        authHeaders,
      );
      console.log("Alert created with ID:", alertRes.body.data.id);

      // Verify Citizen B received alert notification
      const citizenBAlertNotifs = await makeRequest(
        "GET",
        "/api/v1/notifications?type=ALERT",
        null,
        citizenBHeaders,
      );
      console.log(
        "Citizen B Alert Notifications (Expected at least 1):",
        citizenBAlertNotifs.body.data.length,
      );
      const alertNotif = citizenBAlertNotifs.body.data.find((n) =>
        n.title.includes("Severe Coastal Cyclone Warning"),
      );
      console.log("Found matching alert notification:", !!alertNotif);
      console.log(
        "Alert Notification Title:",
        alertNotif ? alertNotif.title : "None",
      );
      if (!alertNotif || !alertNotif.title.includes("[EMERGENCY ALERT]")) {
        throw new Error(
          "Active alert creation failed to dispatch emergency notification to users",
        );
      }

      // ======================================================================
      console.log(
        "\n=== 20. Test Notification Generation: Demo / Drill Alert Distinction ===",
      );
      const demoAlertRes = await makeRequest(
        "POST",
        "/api/v1/alerts",
        {
          title: "[DEMO] Annual Tsunami Drill",
          description: "This is a test simulation for coastal awareness.",
          severity: "LOW",
          status: "ACTIVE",
          disasterId: disaster.id,
        },
        authHeaders,
      );
      console.log("Demo alert created:", demoAlertRes.body.data.title);

      const citizenBDemoNotifs = await makeRequest(
        "GET",
        "/api/v1/notifications?type=ALERT",
        null,
        citizenBHeaders,
      );
      const demoNotif = citizenBDemoNotifs.body.data.find((n) =>
        n.title.includes("Annual Tsunami Drill"),
      );
      console.log("Found demo notification:", !!demoNotif);
      console.log(
        "Demo Notification Title:",
        demoNotif ? demoNotif.title : "None",
      );
      if (!demoNotif || !demoNotif.title.includes("[DEMO ALERT]")) {
        throw new Error("Demo alert was not correctly tagged as [DEMO ALERT]");
      }

      // ======================================================================
      console.log(
        "\n=== 21. Test Notification Generation: Event Registration Success ===",
      );
      // Create a preparedness event
      const tomorrow = new Date(Date.now() + 86400000);
      const dayAfter = new Date(Date.now() + 172800000);
      const testEvent = await prisma.event.create({
        data: {
          title: testEventTitle,
          description: "Hands-on water safety and barrier deployment workshop.",
          location: "Civic Community Hall",
          startDate: tomorrow,
          endDate: dayAfter,
          capacity: 50,
          organizerId: authorityUser.id,
        },
      });

      // Clear event reminders for Citizen A
      await prisma.notification.deleteMany({
        where: { userId: citizenA.id, type: "EVENT_REMINDER" },
      });

      // Register Citizen A for event & invoke notification handler
      await prisma.registration.create({
        data: {
          userId: citizenA.id,
          eventId: testEvent.id,
        },
      });
      await notificationService.handleEventRegistration({
        userId: citizenA.id,
        event: testEvent,
      });

      const citizenAEventNotifs = await makeRequest(
        "GET",
        "/api/v1/notifications?type=EVENT_REMINDER",
        null,
        citizenAHeaders,
      );
      console.log(
        "Citizen A Event Reminder Notifications (Expected 1):",
        citizenAEventNotifs.body.data.length,
      );
      const regNotif = citizenAEventNotifs.body.data[0];
      console.log("Notification Title:", regNotif ? regNotif.title : "None");
      if (!regNotif || !regNotif.title.includes("Registration Confirmed")) {
        throw new Error(
          "Event registration did not trigger confirmation notification",
        );
      }

      // ======================================================================
      console.log(
        "\n=== 22. Test Notification Generation: Event Updates Notify Registered Attendees Only ===",
      );
      // Clear event reminders for Citizen B
      await prisma.notification.deleteMany({
        where: { userId: citizenB.id, type: "EVENT_REMINDER" },
      });

      // Event is cancelled — only Citizen A is registered!
      await notificationService.handleEventUpdate({
        event: { ...testEvent, status: "CANCELLED" },
        updateType: "CANCELLED",
      });

      // Citizen A should have received the cancellation notification
      const citizenANewNotifs = await makeRequest(
        "GET",
        "/api/v1/notifications?type=EVENT_REMINDER",
        null,
        citizenAHeaders,
      );
      const cancelNotif = citizenANewNotifs.body.data.find((n) =>
        n.title.includes("Event Cancelled"),
      );
      console.log(
        "Citizen A received cancellation notification:",
        !!cancelNotif,
      );
      if (!cancelNotif) {
        throw new Error(
          "Registered attendee did not receive event cancellation notification",
        );
      }

      // Citizen B (unrelated user, not registered) should NOT have received it
      const citizenBNewNotifs = await makeRequest(
        "GET",
        "/api/v1/notifications?type=EVENT_REMINDER",
        null,
        citizenBHeaders,
      );
      console.log(
        "Citizen B received event cancellation (Expected 0):",
        citizenBNewNotifs.body.data.length,
      );
      if (citizenBNewNotifs.body.data.length !== 0) {
        throw new Error("Unregistered user received event notification!");
      }

      // ======================================================================
      console.log(
        "\n=== 23. Test Invalid Notification UUID Format (Expected 404) ===",
      );
      const invalidIdRes = await makeRequest(
        "GET",
        "/api/v1/notifications/not-a-valid-uuid",
        null,
        citizenAHeaders,
      );
      console.log("Status (Expected 404):", invalidIdRes.statusCode);
      if (invalidIdRes.statusCode !== 404) {
        throw new Error(
          `Expected 404 for invalid UUID, got ${invalidIdRes.statusCode}`,
        );
      }

      // ======================================================================
      console.log(
        "\n=== 24. Test Nonexistent Notification UUID (Expected 404) ===",
      );
      const nonExistentRes = await makeRequest(
        "GET",
        "/api/v1/notifications/11111111-2222-3333-4444-555555555555",
        null,
        citizenAHeaders,
      );
      console.log("Status (Expected 404):", nonExistentRes.statusCode);
      if (nonExistentRes.statusCode !== 404) {
        throw new Error(
          `Expected 404 for non-existent notification, got ${nonExistentRes.statusCode}`,
        );
      }

      // ======================================================================
      console.log(
        "\n=== 25. Test Invalid Query Parameter: Invalid Type (Expected 400) ===",
      );
      const badQueryRes = await makeRequest(
        "GET",
        "/api/v1/notifications?type=INVALID_NOTIFICATION_TYPE",
        null,
        citizenAHeaders,
      );
      console.log("Status (Expected 400):", badQueryRes.statusCode);
      if (badQueryRes.statusCode !== 400) {
        throw new Error(
          `Expected 400 for invalid query parameter, got ${badQueryRes.statusCode}`,
        );
      }

      // ======================================================================
      console.log(
        "\n=== 26. Test Safe Notification Dispatch on Simulated Error ===",
      );
      // Passing invalid data to createNotificationSafe should not throw
      const safeResult = await notificationService.createNotificationSafe({
        userId: "invalid-user-id",
        title: null,
      });
      console.log(
        "Safe call handled failure without throwing (Expected null):",
        safeResult === null,
      );
      if (safeResult !== null) {
        throw new Error(
          "createNotificationSafe did not return null on failure",
        );
      }

      // ======================================================================
      console.log("\n=== 27. Test Database User Cascade Deletion ===");
      // Verify that deleting a user cascades to their notifications without P2003 foreign key violation
      const tempUser = await registerAndLogin(
        "temp.cascade.user@disasterready.org",
        "Temp",
        "Cascade",
      );
      await notificationService.createNotification({
        userId: tempUser.id,
        type: "GENERAL",
        title: "Cascade Test Notification",
        message: "This should cascade delete with the user.",
      });

      // Verify notification exists
      const tempNotifCount = await prisma.notification.count({
        where: { userId: tempUser.id },
      });
      console.log(
        "Temp user notifications before delete (Expected 1):",
        tempNotifCount,
      );

      // Delete user directly — should cascade to notification table
      await prisma.user.delete({ where: { id: tempUser.id } });

      const remainingNotifs = await prisma.notification.count({
        where: { userId: tempUser.id },
      });
      console.log(
        "Temp user notifications after user delete (Expected 0):",
        remainingNotifs,
      );
      if (remainingNotifs !== 0) {
        throw new Error(
          "Cascade deletion failed: notifications were orphaned or not deleted",
        );
      }

      // Post-test cleanup of test data
      await prisma.notification.deleteMany({
        where: { user: { email: { in: allTestEmails } } },
      });
      await prisma.registration.deleteMany({
        where: { user: { email: { in: allTestEmails } } },
      });
      await prisma.event.deleteMany({
        where: { title: testEventTitle },
      });
      await prisma.incidentReport.deleteMany({
        where: { reportedBy: { email: { in: allTestEmails } } },
      });
      await prisma.alert.deleteMany({
        where: { issuedBy: { email: { in: allTestEmails } } },
      });
      await prisma.disaster.deleteMany({
        where: { name: testDisasterName },
      });
      await prisma.session.deleteMany({
        where: { user: { email: { in: allTestEmails } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: allTestEmails } },
      });

      console.log(
        "\n🎉 ALL 27 NOTIFICATION & INTEGRATION TESTS PASSED PERFECTLY!",
      );
    } catch (err) {
      console.error("\n❌ NOTIFICATION TEST SUITE FAILED:", err);
      process.exitCode = 1;
    } finally {
      server.close();
      await disconnectDB();
    }
  });
}

runNotificationTestSuite();
