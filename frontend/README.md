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

### 5. Production Build & Linting
```bash
npm run typecheck   # Strict TypeScript checks (0 errors)
npm run lint        # Next.js ESLint checks (0 warnings/errors)
npm run build       # Production bundle build (22 routes compiled)
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

---

## 🗺️ Roadmap & Upcoming Phases

- **Phase 1 (Completed)**: Foundation, Design System & Complete Public Website
- **Phase 2 (Completed)**: Authentication, Authorization, HttpOnly Token Session & Complete Citizen Dashboard
- **Phase 3 (Completed)**: Authority Command Center & Emergency Operations Management (`/authority/*`)
- **Phase 4 (Next)**: Administrator System Management, Analytics & Audit Logs (`/admin/*`)
- **Phase 5**: Unity WebGL Simulation Engine Integration & End-to-End Polish
