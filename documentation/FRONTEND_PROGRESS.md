# DisasterReady — Frontend Implementation Progress

> **Phase 1: Foundation, Design System & Complete Public Website** — ✅ COMPLETED
> **Phase 2: Authentication, Authorization & Complete Citizen Dashboard** — ✅ COMPLETED & AUDITED
> **Date:** November 2026
> **Architecture:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query v5, Axios, Recharts, Leaflet

---

## 1. Executive Summary

Phase 1 established the design system, API proxy, base primitives, and 9 public routes.
Phase 2 built the complete **Authentication & Authorization System** and the **Full Citizen Dashboard Portal (11 routes)**.
Following manual review, an audit and surgical correction pass was completed for the Incident Reporting and Notifications modules to align with backend database and API behaviors.

The client application communicates directly with the Node.js/Express backend (verified on port `5001`) via Next.js server-side route rewrites (`/api/v1/:path*` $\to$ `http://localhost:5001/api/v1/:path*`), avoiding CORS discrepancies and providing clean client-side data fetching.

All citizen dashboard pages feature authenticated route protection (`ProtectedRoute`), responsive desktop and mobile navigation, live backend queries via TanStack React Query, instant mutation rollbacks, empty states, loading skeletons, and interactive disaster tools.

---

## 2. Authentication & Authorization Architecture

### 2.1 Security Controls & Token Management
1. **Access Token Handling**: The short-lived JWT access token is stored in memory and persisted in `localStorage` for page refresh continuity.
2. **Refresh Token Handling**: The refresh token is transmitted and stored strictly in an **HttpOnly, Secure cookie** (`refreshToken`), inaccessible to client JavaScript. Refresh tokens are never written to `localStorage`.
3. **Concurrency Lock & Race Condition Prevention**:
   - `apiClient.ts` implements an active refresh mutex (`isRefreshing`) and an asynchronous queue (`failedQueue`).
   - When multiple concurrent queries encounter `401 Unauthorized` simultaneously, exactly **one** refresh request is dispatched to `POST /api/v1/auth/refresh`.
   - All pending requests are enqueued and resolved with the newly issued access token upon refresh completion.
4. **Role-Based Access Control (RBAC)**:
   - Registration strictly enforces `role: 'CITIZEN'`. Public forms are forbidden from assigning `AUTHORITY` or `ADMIN` roles.
   - Post-login dynamic routing directs:
     - `CITIZEN` $\longrightarrow$ `/citizen/dashboard`
     - `AUTHORITY` $\longrightarrow$ `/authority/dashboard`
     - `ADMIN` $\longrightarrow$ `/admin/dashboard`
   - Client routes are guarded by `<ProtectedRoute requiredRole={['CITIZEN', 'ADMIN']}>`.

### 2.2 Domain Services
- `src/services/auth.service.ts`: `login`, `register`, `logout`, `getMe`, `refreshToken`, `changePassword`
- `src/services/incident.service.ts`: `createIncident`, `getMyIncidents`, `getIncidentById`, `updateIncident`
- `src/services/preparedness.service.ts`: `getItems`, `getStats`, `createItem`, `updateItem`, `updateReadiness`, `deleteItem`
- `src/services/notification.service.ts`: `getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`, `deleteNotification`
- `src/services/registration.service.ts`: `registerForEvent`, `cancelEventRegistration`, `getMyRegistrations`, `getRegistrationById`, `cancelRegistrationById`
- `src/services/user.service.ts`: Boundary wrapper delegating current user profile to verified `/auth/me`
- `src/services/simulation.service.ts`: Architectural boundary defining 3D disaster simulation definitions without fabricating mock APIs

---

## 3. Complete Citizen Dashboard (11 Routes)

| Route | File Path | Integrated APIs / Features |
| :--- | :--- | :--- |
| `/citizen/dashboard` | `src/app/citizen/dashboard/page.tsx` | Overview metrics, live active alerts preview, upcoming drill registrations, my incident report status tracker, kit readiness gauge, and recent notifications |
| `/citizen/awareness` | `src/app/citizen/awareness/page.tsx` | Searchable disaster catalog with category filters and direct links to comprehensive hazard mitigation guides |
| `/citizen/alerts` | `src/app/citizen/alerts/page.tsx` | Real-time civil defense alerts feed with severity badges (`CRITICAL`, `HIGH`, `MODERATE`, `LOW`), status filtering, search, and 50km GPS radius proximity detection |
| `/citizen/events` | `src/app/citizen/events/page.tsx` | Community mock drills directory with tabs for "Upcoming Drills" and "My Registered Drills", capacity progress meters, one-click Registration (`POST /events/:id/register`), and Cancellation (`DELETE /events/:id/register`) |
| `/citizen/map` | `src/app/citizen/map/page.tsx` | Full-screen interactive Leaflet map rendering shelters, hospitals, fire stations, and police stations with custom markers, search, radius circles, and "My Location" GPS pinpointing |
| `/citizen/reports` | `src/app/citizen/reports/page.tsx` | Citizen incident reporting tool with geolocation capture, hazard category selector, severity level selector, description, image attachment URL, and submitted report lifecycle tracker (`SUBMITTED` $\to$ `UNDER_REVIEW` $\to$ `VERIFIED` $\to$ `RESOLVED`) |
| `/citizen/assistance` | `src/app/citizen/assistance/page.tsx` | 24/7 national emergency hotlines (112, 108, 101, 100, 1070, 1077, 1091, 1906) with click-to-call, immediate crisis action triage cards (trapped in debris, flash floods, heavy bleeding, gas leaks), and nearby response facilities directory |
| `/citizen/notifications` | `src/app/citizen/notifications/page.tsx` | In-app notification center with unread badge count, filter tabs (All, Unread, Read, Alert, Drill, Incident, General), "Mark All as Read", individual read toggles, pagination, and deletion |
| `/citizen/preparedness` | `src/app/citizen/preparedness/page.tsx` | Personal 72-hour survival kit manager with overall readiness index, category distribution chart (Recharts), checklist item toggle (`PATCH /preparedness-kit/:id/readiness`), item addition/editing modal, and one-click starter kit seed loader |
| `/citizen/simulations` | `src/app/citizen/simulations/page.tsx` | 3D disaster simulation briefing center showcasing Earthquake, Flash Flood, and Wildfire training missions, tactical controls guide, WebGL 2.0 system hardware check, and teammate integration boundary |
| `/citizen/profile` | `src/app/citizen/profile/page.tsx` | Verified citizen identity details, registered contact information, role badge, session security overview, and Change Password form (`PATCH /auth/change-password`) |

---

## 4. Phase 2 Audit Findings & Implemented Corrections

### 4.1 Incident Reporting Module
1. **Response Envelope Correction**:
   - The backend `GET /api/v1/incidents/me` returns `{ success: true, data: IncidentReport[], pagination: { ... } }`.
   - Corrected `incident.service.ts` to return normalized `{ reports: res.data.data, pagination: res.data.pagination }` instead of expecting a nested `incidentReports` object.
   - Updated `reports/page.tsx` and `dashboard/page.tsx` to read `data?.reports`.
2. **Detail / Mutation Response Correction**:
   - The backend responds with `sendSuccess(res, 201, msg, report)`, where `res.data.data` is the report object directly.
   - Updated `createIncident`, `getIncidentById`, and `updateIncident` to return `res.data.data` (removing non-existent `.report` property accessor).
3. **Incident Type & Severity Selection (with Transparent Encoding)**:
   - **Backend Limitation**: The `IncidentReport` model in `schema.prisma` and `createIncidentSchema` in `incident.validator.js` do NOT possess `category`/`type` or `severity` columns. Database modifications are prohibited.
   - **Compliant Solution**:
     - Added an Incident Hazard Type selector (Flood, Structural Damage, Landslide, Fire Hazard, Road Blockage, Utility Outage, Medical Emergency, Other).
     - Added an Observed Severity selector (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
     - Transparently encodes selections into the report title format: `[CATEGORY | SEVERITY] ${rawTitle}` (clamped to 200 chars).
     - Does **NOT** send unsupported fields in the request body, strictly complying with the backend Zod validation schema.
     - Built a client-side metadata decoder (`parseReportMeta`) that extracts category and severity for rich badge rendering and preserves pre-fill values during report edits.
4. **Preserved Capabilities**:
   - Geolocation capture (`navigator.geolocation`) populating decimal latitude/longitude.
   - Field photo public URL support (`imageUrl`).
   - Coordinate boundary validation (-90 to 90, -180 to 180).

### 4.2 Notifications Module
1. **Response Mapping**:
   - Updated `markAsRead` in `notification.service.ts` to return `res.data.data` directly matching backend response `{ id, isRead, updatedAt }`.
2. **Pagination Fix**:
   - The backend returns `pagination: { page, limit, total, totalPages }` without `hasPrevPage`/`hasNextPage`.
   - Updated button disabled expressions to standard arithmetic:
     - Previous: `disabled={page <= 1}`
     - Next: `disabled={page >= (pagination.totalPages || 1)}`
3. **Error State Handling**:
   - Added `isError` and `refetch` from `useQuery` in `notifications/page.tsx`.
   - Rendered `<ErrorState ... />` with retry trigger to prevent API errors from being misinterpreted as an empty inbox.
4. **Mark All as Read Visibility**:
   - Verified that the "Mark All as Read" button appears dynamically whenever `unreadCount > 0`.
   - Retained query invalidation on mutations to guarantee instant indicator synchronization.

---

## 5. Verification & Tests Performed

The following static and build tests were executed and passed cleanly:

1. **Strict TypeScript Compilation**:
   ```bash
   $ npm run typecheck
   > tsc --noEmit
   # Exit Code 0 (0 errors)
   ```
2. **ESLint Static Analysis**:
   ```bash
   $ npm run lint
   ✔ No ESLint warnings or errors
   ```
3. **Next.js Production Build**:
   ```bash
   $ npm run build
   ✓ Compiled successfully in 2.2s
   ✓ Generating static pages (22/22)
   ✓ Finalizing page optimization
   # Exit Code 0 (All 22 public and citizen routes compiled cleanly)
   ```

---

## 6. Known Backend Limitations (To Be Addressed in Future Phases)

1. **Native Incident Category & Severity Fields**:
   - Currently encoded transparently into the report title (`[CATEGORY | SEVERITY]`).
   - If dedicated schema columns are added in the future, Prisma migrations for `IncidentReport` will be required.
2. **Binary Multi-Part File Uploads**:
   - The platform currently supports only public HTTP/HTTPS URLs (`imageUrl: String?`).
   - Native multipart image upload will require backend `multer` middleware and cloud bucket integration (e.g., S3/GCS).
3. **Independent User Profile Editing**:
   - Backend routes `/api/v1/users/:id` are not yet implemented on the server; profile changes currently route through verified `/auth/me` and `/auth/change-password`.
