# DisasterReady — Frontend Client 🚨

A modern, responsive Next.js App Router application providing public disaster awareness, real-time hazard alerts, community mock drill registration, safe shelter geospatial discovery, and a complete authenticated Citizen Preparedness & Response Portal.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **State & Data Fetching**: [TanStack React Query v5](https://tanstack.com/query), [Axios](https://axios-http.com/)
- **Geospatial Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Analytics & Visualizations**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

---

## 🎨 Color Palette & Brand Design System

- **Deep Navy**: `#102A43` (Primary brand headers, top banner, footers)
- **Primary Blue**: `#1769AA` (Action buttons, brand links, active filters)
- **Emergency Red**: `#DC3545` (Critical alerts, hazard notices, emergency CTAs)
- **Warning Amber**: `#F59E0B` (Moderate hazards, capacity warnings)
- **Success Green**: `#16A34A` (Low severity, operational facility badges, completion indicators)
- **Surface**: `#FFFFFF`
- **Background**: `#F5F7FA`
- **Text Main**: `#172B4D`

### Hazard Severity Levels
- **`CRITICAL`**: Flashing Red (`#DC3545`)
- **`HIGH`**: Amber / Orange (`#EA580C`)
- **`MODERATE`**: Yellow / Amber (`#F59E0B`)
- **`LOW`**: Green (`#16A34A`)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v20+` or `v22+`
- DisasterReady Express Backend running on port `5001`

### 2. Environment Configuration
The frontend automatically proxies `/api/v1/*` requests to the verified backend server port `5001` via Next.js server-side rewrites.
```bash
cp .env.example .env.local
```

Default contents of `.env.local`:
```env
BACKEND_PORT=5001
BACKEND_URL=http://localhost:5001
NEXT_PUBLIC_API_BASE_URL=/api/v1
```

### 3. Installation
```bash
cd frontend
npm install
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build, Testing & Linting
```bash
npm run typecheck   # Strict TypeScript checks (0 errors)
npm run lint        # Next.js ESLint checks (0 warnings/errors)
npm test            # Automated route, RBAC, and curriculum test suite (12 tests)
npm run build       # Production bundle build (41 routes compiled)
npm run start       # Start production server
```

---

## 📁 Routes Implemented

### Public Website (Phase 1)
| Route | Description | Backend Integration |
| :--- | :--- | :--- |
| `/` | Landing page with Hero, active alerts ticker, disaster categories, drills, and shelter preview | `GET /api/v1/alerts`, `GET /api/v1/events`, `GET /api/v1/emergency-resources`, `GET /api/v1/disasters` |
| `/awareness` | Searchable & categorized disaster preparedness guides | `GET /api/v1/disasters` |
| `/awareness/[id]` | Detailed educational guide with causes, warning signs, before/during/after steps, and checklist | `GET /api/v1/disasters/:id` (using backend UUID) |
| `/alerts` | Live emergency alerts feed with severity, status, and GPS proximity filtering | `GET /api/v1/alerts` |
| `/alerts/[id]` | Full alert advisory with affected radius, timestamps, and issuing official | `GET /api/v1/alerts/:id` |
| `/events` | Community mock drills & workshops directory with capacity indicators | `GET /api/v1/events` |
| `/events/[id]` | Drill schedule, venue, capacity progress, and registration callout | `GET /api/v1/events/:id` |
| `/resources` | Interactive Leaflet map & directory of safe shelters, hospitals, and fire stations | `GET /api/v1/emergency-resources` |
| `/about` | Institutional background, scientific guideline attribution, and terms of use | Static educational & attribution content |
| `/login` | Secure citizen/authority login with HttpOnly refresh cookies & role redirection | `POST /api/v1/auth/login` |
| `/register` | Citizen registration restricted strictly to `CITIZEN` role | `POST /api/v1/auth/register` |

### Authenticated Citizen Dashboard (Phase 2)
| Route | Description | Backend Integration |
| :--- | :--- | :--- |
| `/citizen/dashboard` | Main hub displaying active alerts, upcoming registered drills, report status, and kit score | Multi-query orchestration |
| `/citizen/alerts` | Filterable civil defense alerts feed with 50km radius GPS proximity filtering | `GET /api/v1/alerts` |
| `/citizen/awareness` | Searchable disaster catalog with direct links to comprehensive hazard safety guides | `GET /api/v1/disasters` |
| `/citizen/map` | Full-screen interactive Leaflet map rendering shelters, hospitals, and emergency resources | `GET /api/v1/emergency-resources` |
| `/citizen/reports` | Incident reporting submission form with GPS pin capture and report lifecycle tracking | `POST /api/v1/incidents`, `GET /api/v1/incidents/me` |
| `/citizen/assistance` | 24/7 National Emergency Helplines (112, 108, 101, 100, etc.), crisis guides, and facility phone directory | `GET /api/v1/emergency-resources` |
| `/citizen/events` | Mock drills directory with "My Registered Drills" tab, instant register and cancel actions | `GET /api/v1/events`, `POST /api/v1/events/:id/register`, `DELETE /api/v1/events/:id/register` |
| `/citizen/preparedness` | 72-hour survival kit manager, Recharts category breakdown, item readiness checkbox, add/edit modal | `GET/POST/PATCH/DELETE /api/v1/preparedness-kit` |
| `/citizen/notifications` | In-app notification center, unread badge count, filter tabs, mark all as read, delete action | `GET/PATCH/DELETE /api/v1/notifications` |
| `/citizen/simulations` | 3D virtual simulation briefings (Earthquake, Flood, Wildfire), WebGL controls, system readiness check | Architecture boundary definition |
| `/citizen/profile` | Citizen identity details, verified contact information, and secure password update form | `GET /api/v1/auth/me`, `PATCH /api/v1/auth/change-password` |

### Authenticated Emergency Authority Command Portal (Phase 3)
| Route | Description | Backend Integration |
| :--- | :--- | :--- |
| `/authority/dashboard` | Emergency Operations Center (EOC) station with real-time triage metrics, Recharts lifecycle & asset breakdown, recent incoming reports, active advisories feed | `GET /api/v1/incidents`, `GET /api/v1/alerts`, `GET /api/v1/emergency-resources`, `GET /api/v1/events` |
| `/authority/alerts` | Alert Broadcasting Studio: issue civil defense warnings, select disaster from real catalog, define hazard radius, edit alerts, and resolve active warnings | `GET/POST/PATCH/DELETE /api/v1/alerts`, `GET /api/v1/disasters` |
| `/authority/incidents` | Incident Triage Desk: inspect incoming citizen reports, filter by lifecycle status, view reporter details & photos, and advance status (`SUBMITTED` $\to$ `UNDER_REVIEW` $\to$ `VERIFIED` $\to$ `RESOLVED` / `REJECTED`) | `GET /api/v1/incidents`, `PATCH /api/v1/incidents/:id` |
| `/authority/disasters` | Standard Operating Procedures (SOP) Reference Catalog: browse disaster taxonomies and emergency response protocols (with explicit Admin mutation boundary indicator) | `GET /api/v1/disasters`, `GET /api/v1/disasters/:id` |
| `/authority/events` | Mock Drill Management: schedule community preparation drills, configure participant capacities and GPS locations, edit drill times, and cancel obsolete exercises | `GET/POST/PATCH/DELETE /api/v1/events` |
| `/authority/registrations` | Drill Attendee Rosters: view attendee check-in lists, track capacity quotas, search attendees, export CSV rosters, with authorization enforcement (organizer / admin) | `GET /api/v1/events/:id/registrations`, `GET /api/v1/events` |
| `/authority/resources` | Emergency Infrastructure Directory: deploy and manage safe shelters, medical units, supply depots, toggle operational availability, and view capacity quotas | `GET/POST/PATCH/DELETE /api/v1/emergency-resources` |
| `/authority/notifications` | Command Broadcast Center: review operational notices, filter by category/read-state, toggle individual read status, mark all read, and purge records | `GET/PATCH/DELETE /api/v1/notifications` |
| `/authority/profile` | Officer Profile Desk: cryptographic credentials management, password update form, and role-based privilege overview | `GET /api/v1/auth/me`, `PATCH /api/v1/auth/change-password` |

### Authenticated System Administrator Station (Phase 4)
| Route | Description | Backend Integration |
| :--- | :--- | :--- |
| `/admin/dashboard` | Executive Command Overview: global operational metrics, Recharts lifecycle & severity charts, live incident stream, active warning broadcasts, quick actions | Multi-query orchestration |
| `/admin/disasters` | Disaster Taxonomy & SOP Catalog (**Admin Exclusive CRUD**): register new hazards, update descriptions & mitigation guidelines, permanent record deletion | `GET/POST/PATCH/DELETE /api/v1/disasters` |
| `/admin/alerts` | Warning Studio: dispatch civil defense warnings, update active status, resolve warnings, and permanently purge alerts | `GET/POST/PATCH/DELETE /api/v1/alerts` |
| `/admin/incidents` | Incident Operations & Ground Triage: monitor incoming reports, inspect reporter identity & coordinates, advance lifecycle status, permanent incident purge | `GET/PATCH/DELETE /api/v1/incidents` |
| `/admin/events` | Mock Drills & Universal Rosters: schedule evacuation exercises, configure participant quotas, delete drills, and inspect universal attendee check-ins | `GET/POST/PATCH/DELETE /api/v1/events`, `GET /api/v1/events/:id/registrations` |
| `/admin/resources` | Emergency Infrastructure Directory: deploy safe shelters, trauma hospitals, fire stations, toggle active operational status, permanent hard delete | `GET/POST/PATCH/DELETE /api/v1/emergency-resources` |
| `/admin/users` | User Account Directory: directory of discovered platform accounts across field operations, role filters, user details modal, status action confirmation | Operational user discovery |
| `/admin/authorities` | Emergency Authority Management: directory of civil defense officers and drill organizers, officer dossier viewer, provisional onboarding dialog | Operational authority discovery |
| `/admin/notifications` | System Notifications Console: review operational notices, filter by category/read-state, mark read, mark all read, delete notification | `GET/PATCH/DELETE /api/v1/notifications` |
| `/admin/settings` | Platform Settings & Runtime Audit: live core API probe (`GET /api/v1/health`), master password update, module integration matrix, security checklist | `GET /api/v1/health`, `PATCH /api/v1/auth/change-password` |

---

## 🗺️ Development Roadmap Status

- **Phase 1 (Completed)**: Foundation, Design System & Complete Public Website (11 routes)
- **Phase 2 (Completed)**: Authentication, Authorization, HttpOnly Token Session & Complete Citizen Dashboard (11 routes)
- **Phase 3 (Completed)**: Authority Command Center & Emergency Operations Management (9 routes)
- **Phase 4 (Completed)**: Administrator System Management, Analytics & Platform Governance (10 routes)
- **Phase 5 (Completed)**: Complete Application Integration, Testing, Security & Final Production Polish (All 41 routes integrated, automated test suite, Unity boundary contract, zero TypeScript/ESLint/Build errors)

---

## 🎮 Unity WebGL Simulation Engine (Module 11 Boundary)

The 3D interactive virtual disaster simulation engine is developed independently by the 3D development team (`unity-game/`). To prevent blocking frontend delivery while maintaining production-grade integration readiness, the frontend implements an architectural boundary with the following contract:

### 1. Delivery Path & Asset Embedding
- Target build output: `frontend/public/unity/`
- Build artifacts: `Build/Build.loader.js`, `Build/Build.framework.js`, `Build/Build.data`, `Build/Build.wasm`
- Embedding wrapper: `CitizenSimulationsPage` (`src/app/citizen/simulations/page.tsx`) contains a responsive 16:9 canvas container with a WebGL 2.0 pre-flight hardware diagnostic probe.

### 2. Browser-to-Unity Messaging Protocol
```javascript
// Sending command into Unity instance
unityInstance.SendMessage('GameManager', 'LoadScenario', scenarioId);

// Receiving simulation results from Unity WebGL via window event
window.addEventListener('message', (event) => {
  if (event.data?.type === 'SIMULATION_COMPLETE') {
    const { scenarioId, score, survivalTime, decisions } = event.data.payload;
    // Dispatches to POST /api/v1/simulations/attempts (when backend Module 11 is mounted)
  }
});
```

### 3. Static Scenario Definitions (`src/services/simulation.service.ts`)
- `sim-eq-01`: Multi-Story Office Earthquake Evacuation (Intermediate, 10 min)
- `sim-fl-02`: Suburban Flash Flood Inundation Escape (Beginner, 8 min)
- `sim-wf-03`: Rural Wildfire Perimeter Defense (Advanced, 12 min)

---

## 📋 Missing Backend Dependencies Report

The following backend endpoints are specified in the system design or roadmap but are not yet implemented or mounted in `backend/src/app.js`:

1. **User Account Administration (`/api/v1/users`) — Module 12**:
   - `GET /api/v1/users` (List users with pagination, role filter, search)
   - `PATCH /api/v1/users/:id/status` (Toggle user active status `isActive: boolean`)
   - `POST /api/v1/users` (Admin provisioning of Authority / Admin accounts)
   - *Frontend Adaptation*: `/admin/users` and `/admin/authorities` aggregate accounts from operational records (reporters, drill organizers, attendees, active session) and provide transparent boundary notices.

2. **Simulation Endpoints (`/api/v1/simulations/*`) — Module 11**:
   - `GET /api/v1/simulations/scenarios` (List database-backed simulation scenarios)
   - `POST /api/v1/simulations/attempts` (Record initial simulation attempt)
   - `PATCH /api/v1/simulations/attempts/:id` (Submit final score & decision audit trail)
   - *Frontend Adaptation*: `CitizenSimulationsPage` loads verified static scenario definitions and pre-flight diagnostics without fabricating fake APIs.

---

## 🧪 Testing & Verification Commands

```bash
# 1. Run unit & component integration test suite (12 tests across 5 suites)
npm test

# 2. Run strict TypeScript compiler verification (0 errors)
npm run typecheck

# 3. Run ESLint static code analysis (0 warnings / 0 errors)
npm run lint

# 4. Compile complete production bundle (41/41 routes static & dynamic)
npm run build
```
