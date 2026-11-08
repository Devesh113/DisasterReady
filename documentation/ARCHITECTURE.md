# DisasterReady — System Architecture

> **Version:** 1.0  
> **Last Updated:** 2025-07-13  
> **Status:** Living Document

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Layer](#5-database-layer)
6. [Simulation Layer (Unity)](#6-simulation-layer-unity)
7. [Communication Between Components](#7-communication-between-components)
8. [Authentication & Authorization Strategy](#8-authentication--authorization-strategy)
9. [API Design Principles](#9-api-design-principles)
10. [Deployment Architecture (Proposed)](#10-deployment-architecture-proposed)
11. [Security Considerations](#11-security-considerations)

---

## 1. System Overview

**DisasterReady** is a full-stack disaster awareness, preparedness, and emergency response platform designed to empower citizens, authorities, and administrators with the tools they need before, during, and after a disaster event.

The platform combines a **React-based web application** with an **interactive Unity WebGL simulation** layer, backed by a **Node.js/Express API server** and a **PostgreSQL database**. Together, these components deliver real-time alerts, educational simulations, resource coordination, and role-based dashboards — all within a unified, accessible web experience.

### High-Level Architecture Summary

| Layer | Technology | Responsibility |
|---|---|---|
| **Frontend** | React, Tailwind CSS, React Router | User interface, routing, state management |
| **Simulation** | Unity (C#), WebGL | Interactive disaster simulations |
| **Backend** | Node.js, Express.js | REST API, business logic, auth |
| **Data Access** | Prisma ORM | Type-safe queries, migrations, seeding |
| **Database** | PostgreSQL | Persistent relational data storage |
| **External Services** | Email, SMS, Maps APIs *(future)* | Notifications, geolocation |

---

## 2. Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Browser (Client)"]
        REACT["React App\nTailwind CSS + React Router"]
        UNITY["Unity WebGL Build\n(Embedded via iframe / react-unity-webgl)"]
    end

    subgraph Backend["Backend Server"]
        EXPRESS["Node.js + Express.js\nREST API"]
    end

    subgraph DataLayer["Data Layer"]
        PRISMA["Prisma ORM"]
        DB[("PostgreSQL\nDatabase")]
    end

    subgraph External["External Services (Future)"]
        EMAIL["Email API\n(SendGrid / Nodemailer)"]
        SMS["SMS API\n(Twilio)"]
        MAPS["Maps API\n(Google Maps / Leaflet)"]
    end

    REACT -- "REST API\n(HTTP/JSON)" --> EXPRESS
    UNITY -- "REST API\n(HTTP/JSON via UnityWebRequest)" --> EXPRESS
    EXPRESS -- "Prisma Client\n(TCP)" --> PRISMA
    PRISMA --> DB
    EXPRESS -. "Future Integration" .-> EMAIL
    EXPRESS -. "Future Integration" .-> SMS
    REACT -. "Future Integration" .-> MAPS

    style Client fill:#e0f2fe,stroke:#0284c7,color:#000
    style Backend fill:#fef3c7,stroke:#d97706,color:#000
    style DataLayer fill:#d1fae5,stroke:#059669,color:#000
    style External fill:#f3e8ff,stroke:#7c3aed,color:#000
```

> [!IMPORTANT]
> The Unity WebGL build **never** connects directly to PostgreSQL. All data flows through the Express.js backend API layer. This ensures security, consistency, and a single source of truth for business logic.

---

## 3. Frontend Architecture

The frontend is a **Single Page Application (SPA)** built with React.js, providing a responsive, accessible interface for all user roles.

### 3.1 Technology Stack

| Concern | Technology |
|---|---|
| UI Library | **React.js** (functional components + hooks) |
| Styling | **Tailwind CSS** (utility-first CSS framework) |
| Routing | **React Router v6** (client-side routing) |
| HTTP Client | **Axios** or **Fetch API** |
| State Management | **React Context API** / **Zustand** |
| Form Handling | **React Hook Form** *(planned)* |
| Notifications | **React Hot Toast** / **Sonner** *(planned)* |

### 3.2 Page Structure & Routing

The application is organized into role-based page groups:

```
src/
├── pages/
│   ├── public/               # Accessible without login
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── AboutPage.jsx
│   │   └── DisasterInfoPage.jsx
│   │
│   ├── citizen/              # CITIZEN role dashboard
│   │   ├── CitizenDashboard.jsx
│   │   ├── AlertsPage.jsx
│   │   ├── PreparednessPage.jsx
│   │   ├── SimulationPage.jsx
│   │   └── ProfilePage.jsx
│   │
│   ├── authority/            # AUTHORITY role dashboard
│   │   ├── AuthorityDashboard.jsx
│   │   ├── ManageAlertsPage.jsx
│   │   ├── ResourcesPage.jsx
│   │   └── ReportsPage.jsx
│   │
│   └── admin/                # ADMIN panel
│       ├── AdminDashboard.jsx
│       ├── UserManagementPage.jsx
│       └── SystemSettingsPage.jsx
│
├── components/
│   ├── common/               # Shared UI components
│   ├── layout/               # Header, Footer, Sidebar
│   └── unity/                # Unity WebGL wrapper
│
├── context/                  # React Context providers
├── hooks/                    # Custom hooks
├── services/                 # API service modules
├── utils/                    # Helper functions
├── routes/                   # Route definitions & guards
├── App.jsx
└── main.jsx
```

### 3.3 Unity WebGL Integration

The Unity simulation is embedded within the React frontend using one of two approaches:

| Approach | Description |
|---|---|
| **`react-unity-webgl`** | React library providing hooks and components for deep Unity ↔ React communication |
| **`<iframe>`** | Simpler isolation; Unity build served as a standalone HTML page embedded in an iframe |

**Communication pattern:**

- **React → Unity:** Call Unity game functions via `sendMessage()` (react-unity-webgl) or `postMessage()` (iframe).
- **Unity → React:** Unity dispatches events or calls JavaScript functions exposed on `window`.
- **Unity → Backend:** Unity makes direct HTTP requests to the Express API using `UnityWebRequest` (C#). Responses are parsed and rendered within the simulation.

### 3.4 State Management Strategy

```
Global State (Context / Zustand)
├── AuthContext         → User session, JWT token, role
├── AlertContext        → Active alerts, notification state
└── ThemeContext        → Dark/light mode preference

Local State (useState / useReducer)
├── Form inputs
├── Modal visibility
└── Component-specific UI state
```

---

## 4. Backend Architecture

The backend follows a **layered architecture** pattern, ensuring clear separation of concerns, testability, and maintainability.

### 4.1 Layered Architecture Overview

```mermaid
flowchart LR
    A["Client Request\n(Browser / Unity)"] --> B["Route"]
    B --> C["Middleware\n(Auth, Validation, CORS)"]
    C --> D["Controller\n(HTTP handling)"]
    D --> E["Service\n(Business Logic)"]
    E --> F["Prisma Client\n(Data Access)"]
    F --> G[("PostgreSQL")]
    G --> F
    F --> E
    E --> D
    D --> H["HTTP Response\n(JSON)"]

    style A fill:#e0f2fe,stroke:#0284c7,color:#000
    style B fill:#fef3c7,stroke:#d97706,color:#000
    style C fill:#fef3c7,stroke:#d97706,color:#000
    style D fill:#fef3c7,stroke:#d97706,color:#000
    style E fill:#fef3c7,stroke:#d97706,color:#000
    style F fill:#d1fae5,stroke:#059669,color:#000
    style G fill:#d1fae5,stroke:#059669,color:#000
    style H fill:#e0f2fe,stroke:#0284c7,color:#000
```

### 4.2 Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **Routes** | Define API endpoints and map them to controllers. Group routes by resource (e.g., `/api/v1/users`, `/api/v1/alerts`). |
| **Middleware** | Cross-cutting concerns: authentication (JWT verification), authorization (role checks), request validation, error handling, CORS, rate limiting, request logging. |
| **Controllers** | Handle incoming HTTP requests, extract parameters/body, delegate to services, and format HTTP responses. Controllers contain **no business logic**. |
| **Services** | Core business logic layer. Orchestrates data operations, enforces rules, and coordinates between multiple data sources. Services are **framework-agnostic** and can be unit-tested independently. |
| **Prisma Client** | Data access layer. Provides type-safe, auto-generated queries for PostgreSQL. Handles reads, writes, transactions, and relations. |
| **Validators** | Request schema validation using **Joi** or **Zod**. Validates request bodies, query parameters, and URL parameters before reaching the controller. |

### 4.3 Folder Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   ├── migrations/            # Auto-generated migration files
│   └── seed.js                # Database seeding script
│
├── src/
│   ├── config/
│   │   ├── database.js        # Prisma client instance
│   │   ├── env.js             # Environment variable validation
│   │   └── cors.js            # CORS configuration
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── alert.controller.js
│   │   ├── resource.controller.js
│   │   └── simulation.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js          # JWT verification
│   │   ├── authorize.middleware.js     # Role-based access control
│   │   ├── validate.middleware.js      # Request validation
│   │   ├── errorHandler.middleware.js  # Global error handler
│   │   └── rateLimiter.middleware.js   # Rate limiting
│   │
│   ├── routes/
│   │   ├── index.js            # Route aggregator
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── alert.routes.js
│   │   ├── resource.routes.js
│   │   └── simulation.routes.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── alert.service.js
│   │   ├── resource.service.js
│   │   └── simulation.service.js
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── user.validator.js
│   │   └── alert.validator.js
│   │
│   ├── utils/
│   │   ├── apiResponse.js      # Standardized response helpers
│   │   ├── apiError.js         # Custom error classes
│   │   ├── logger.js           # Logging utility
│   │   └── constants.js        # App-wide constants
│   │
│   └── app.js                  # Express app initialization
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env.example                # Environment variable template
├── .gitignore
└── package.json
```

### 4.4 Example Request Lifecycle

A request to fetch alerts for a citizen follows this path:

```
GET /api/v1/alerts?status=active&page=1

→ auth.routes.js          (matches the route)
→ auth.middleware.js       (verifies JWT, attaches user to req)
→ authorize.middleware.js  (checks CITIZEN or AUTHORITY role)
→ validate.middleware.js   (validates query params via Zod schema)
→ alert.controller.js     (extracts params, calls service)
→ alert.service.js         (applies business rules, queries DB)
→ Prisma Client            (executes parameterized SQL)
→ PostgreSQL               (returns rows)
← JSON Response            { status: "success", data: [...], pagination: {...} }
```

---

## 5. Database Layer

### 5.1 Technology Choice

| Aspect | Details |
|---|---|
| **Database** | PostgreSQL (relational, ACID-compliant) |
| **ORM** | Prisma (type-safe, auto-generated client, migration system) |
| **Why PostgreSQL** | Robust relational model, JSON support, PostGIS for geospatial data (future), excellent ecosystem |
| **Why Prisma** | Type safety, declarative schema, migration management, introspection, seeding, studio GUI |

### 5.2 Prisma Workflow

```mermaid
flowchart LR
    A["Define Schema\n(schema.prisma)"] --> B["Generate Migration\nprisma migrate dev"]
    B --> C["Apply to PostgreSQL"]
    C --> D["Generate Client\nprisma generate"]
    D --> E["Use in Services\nprisma.user.findMany()"]
    E --> F["Seed Data\nprisma db seed"]

    style A fill:#e0f2fe,stroke:#0284c7,color:#000
    style D fill:#d1fae5,stroke:#059669,color:#000
```

### 5.3 Schema Overview (Conceptual)

```prisma
// prisma/schema.prisma (simplified)

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CITIZEN
  AUTHORITY
  ADMIN
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(CITIZEN)
  alerts    Alert[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Alert {
  id          String   @id @default(cuid())
  title       String
  description String
  severity    String
  location    String
  isActive    Boolean  @default(true)
  createdBy   User     @relation(fields: [userId], references: [id])
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 5.4 Connection Pooling

- Prisma manages a **connection pool** to PostgreSQL internally.
- Default pool size can be configured via the `DATABASE_URL` connection string:
  ```
  DATABASE_URL="postgresql://user:pass@host:5432/dbname?connection_limit=10"
  ```
- For serverless deployments, consider using **Prisma Accelerate** or **PgBouncer** as an external connection pooler.

---

## 6. Simulation Layer (Unity)

### 6.1 Overview

The simulation layer provides **interactive, immersive disaster preparedness experiences** (e.g., earthquake evacuation, flood response, fire drills) built in Unity and exported as **WebGL builds** for seamless browser integration.

### 6.2 Technology

| Aspect | Details |
|---|---|
| **Engine** | Unity (2022 LTS or later) |
| **Language** | C# |
| **Build Target** | WebGL |
| **HTTP Client** | `UnityWebRequest` (C#) |
| **Data Format** | JSON (serialized via `JsonUtility` or Newtonsoft.Json) |

### 6.3 Data Flow

> [!CAUTION]
> Unity **must never** connect directly to PostgreSQL. All database operations are performed exclusively through the Express.js REST API layer. This is a non-negotiable architectural constraint.

```mermaid
sequenceDiagram
    participant U as Unity WebGL
    participant E as Express.js API
    participant P as Prisma ORM
    participant DB as PostgreSQL

    U->>E: HTTP Request (UnityWebRequest)<br/>e.g., POST /api/v1/simulations/score
    E->>E: Middleware (Auth, Validate)
    E->>P: Service calls Prisma
    P->>DB: Parameterized SQL Query
    DB-->>P: Result Rows
    P-->>E: Typed Objects
    E-->>U: JSON Response
    U->>U: Parse JSON & Update Game State
```

### 6.4 Integration Architecture

```
┌──────────────────────────────────────────────────┐
│  React Frontend (Browser)                        │
│                                                  │
│  ┌────────────────────┐  ┌────────────────────┐  │
│  │  React Components  │  │  Unity WebGL Build │  │
│  │  (Dashboard, UI)   │  │  (Simulation)      │  │
│  └────────┬───────────┘  └────────┬───────────┘  │
│           │                       │              │
│           │  REST API (HTTP/JSON) │              │
│           └───────────┬───────────┘              │
└───────────────────────┼──────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Express.js API │
              │  (Backend)      │
              └────────┬────────┘
                       │ Prisma ORM
                       ▼
              ┌─────────────────┐
              │   PostgreSQL    │
              └─────────────────┘
```

### 6.5 Unity ↔ React Communication

| Direction | Method |
|---|---|
| **React → Unity** | `sendMessage(gameObject, method, value)` via `react-unity-webgl`, or `iframe.postMessage()` |
| **Unity → React** | `Application.ExternalCall()` or `Runtime.SendMessage()` dispatching events to the React layer |
| **Unity → Backend** | Direct `UnityWebRequest` calls to `/api/v1/*` endpoints with JWT in the `Authorization` header |

---

## 7. Communication Between Components

### 7.1 Integration Matrix

| Source | Destination | Protocol | Auth | Data Format |
|---|---|---|---|---|
| React Frontend | Express Backend | HTTP REST | JWT (Bearer token) | JSON |
| Unity WebGL | Express Backend | HTTP REST | JWT (Bearer token) | JSON |
| Express Backend | PostgreSQL | TCP (Prisma) | Connection string | SQL (parameterized) |
| React Frontend | Unity WebGL | JavaScript bridge | Shared session | Function calls / Events |

### 7.2 Frontend ↔ Backend

- All API calls are made via **Axios** or **Fetch** to the Express backend.
- Authentication tokens (JWT) are sent in the `Authorization: Bearer <token>` header.
- Responses follow a consistent JSON envelope:

```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation completed successfully",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 7.3 Unity ↔ Backend

- Unity uses `UnityWebRequest` (C#) to make HTTP calls.
- The JWT token is injected into Unity from the React layer at initialization (via JavaScript bridge).
- All request/response payloads are JSON-serialized.

### 7.4 Backend ↔ Database

- Communication happens exclusively through the **Prisma Client**.
- Prisma generates type-safe queries and uses **parameterized SQL** to prevent injection attacks.
- The connection is established over **TCP** using the `DATABASE_URL` environment variable.

### 7.5 Future: Real-Time Communication

| Feature | Technology | Use Case |
|---|---|---|
| **WebSockets** | Socket.io / ws | Real-time disaster alerts, live updates |
| **Server-Sent Events** | Native SSE | One-way push notifications to clients |
| **Push Notifications** | Web Push API | Background alert notifications |

---

## 8. Authentication & Authorization Strategy

### 8.1 Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant DB as PostgreSQL

    C->>API: POST /api/v1/auth/login<br/>{email, password}
    API->>DB: Find user by email
    DB-->>API: User record
    API->>API: Verify password (bcrypt)
    API->>API: Generate JWT<br/>(payload: userId, role, exp)
    API-->>C: { token, user }

    Note over C: Store token (httpOnly cookie<br/>or localStorage)

    C->>API: GET /api/v1/alerts<br/>Authorization: Bearer <token>
    API->>API: Verify JWT (middleware)
    API->>API: Check role (middleware)
    API->>DB: Fetch data
    DB-->>API: Results
    API-->>C: { status: "success", data: [...] }
```

### 8.2 JWT Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "clxyz123...",
    "email": "citizen@example.com",
    "role": "CITIZEN",
    "iat": 1700000000,
    "exp": 1700086400
  }
}
```

### 8.3 Role-Based Access Control (RBAC)

| Role | Access Level |
|---|---|
| **`CITIZEN`** | View alerts, access simulations, manage own profile, submit reports |
| **`AUTHORITY`** | All citizen permissions + create/manage alerts, manage resources, view area reports |
| **`ADMIN`** | Full system access — user management, system settings, all data |

### 8.4 Authorization Middleware

```javascript
// Example: authorize.middleware.js
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions',
      });
    }
    next();
  };
};

// Usage in routes:
router.post('/alerts', auth, authorize('AUTHORITY', 'ADMIN'), alertController.create);
```

### 8.5 Token Storage Strategy

| Method | Pros | Cons |
|---|---|---|
| **httpOnly Cookie** | XSS-safe, automatic transmission | Requires CSRF protection |
| **Authorization Header** | Simple, stateless | Must be stored in localStorage (XSS risk) |

> [!TIP]
> For maximum security, prefer **httpOnly cookies** with `SameSite=Strict` and a CSRF token for state-changing requests.

---

## 9. API Design Principles

### 9.1 RESTful Conventions

| HTTP Method | Usage | Example |
|---|---|---|
| `GET` | Retrieve resource(s) | `GET /api/v1/alerts` |
| `POST` | Create a resource | `POST /api/v1/alerts` |
| `PUT` | Full update | `PUT /api/v1/alerts/:id` |
| `PATCH` | Partial update | `PATCH /api/v1/alerts/:id` |
| `DELETE` | Remove a resource | `DELETE /api/v1/alerts/:id` |

### 9.2 URL Structure

```
Base URL:  /api/v1

Endpoints:
  /api/v1/auth/register          POST    Register new user
  /api/v1/auth/login             POST    Login
  /api/v1/auth/logout            POST    Logout
  /api/v1/auth/me                GET     Get current user

  /api/v1/users                  GET     List users (ADMIN)
  /api/v1/users/:id              GET     Get user by ID
  /api/v1/users/:id              PATCH   Update user
  /api/v1/users/:id              DELETE  Delete user (ADMIN)

  /api/v1/alerts                 GET     List alerts
  /api/v1/alerts/:id             GET     Get alert by ID
  /api/v1/alerts                 POST    Create alert (AUTHORITY/ADMIN)
  /api/v1/alerts/:id             PATCH   Update alert
  /api/v1/alerts/:id             DELETE  Delete alert

  /api/v1/simulations/scores     POST    Submit simulation score
  /api/v1/simulations/scores     GET     Get user's scores

  /api/v1/resources              GET     List emergency resources
  /api/v1/resources              POST    Add resource (AUTHORITY/ADMIN)
```

### 9.3 Consistent Error Response Format

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "statusCode": 400
}
```

### 9.4 Pagination, Filtering & Sorting

```
GET /api/v1/alerts?page=2&limit=20&sort=-createdAt&severity=high&status=active
```

| Parameter | Description | Default |
|---|---|---|
| `page` | Page number | `1` |
| `limit` | Items per page | `20` |
| `sort` | Sort field (prefix `-` for descending) | `-createdAt` |
| Filter fields | Any filterable attribute | — |

### 9.5 Rate Limiting

| Endpoint Group | Limit |
|---|---|
| Authentication (`/auth/*`) | 10 requests / 15 minutes |
| General API | 100 requests / 15 minutes |
| Public endpoints | 50 requests / 15 minutes |

---

## 10. Deployment Architecture (Proposed)

```mermaid
flowchart LR
    subgraph Hosting
        FE["Frontend\n(Vercel / Netlify)"]
        BE["Backend\n(Railway / Render / AWS EC2)"]
        DB[("PostgreSQL\n(Supabase / Railway / AWS RDS)")]
    end

    subgraph Assets
        UNITY_BUILD["Unity WebGL Build\n(Static Assets on CDN)"]
    end

    USER["End User\n(Browser)"] --> FE
    FE --> UNITY_BUILD
    FE --> BE
    BE --> DB

    style USER fill:#e0f2fe,stroke:#0284c7,color:#000
    style Hosting fill:#fef3c7,stroke:#d97706,color:#000
    style Assets fill:#f3e8ff,stroke:#7c3aed,color:#000
```

### 10.1 Component Hosting

| Component | Platform Options | Notes |
|---|---|---|
| **Frontend (React)** | Vercel, Netlify | Static SPA hosting with CDN, automatic HTTPS |
| **Backend (Express)** | Railway, Render, AWS EC2 | Containerized or VM-based, auto-scaling |
| **Database (PostgreSQL)** | Supabase, Railway PostgreSQL, AWS RDS | Managed PostgreSQL with backups |
| **Unity WebGL Build** | Served as static assets via frontend CDN | Bundled with frontend or hosted on separate CDN |

### 10.2 Environment Strategy

| Environment | Purpose | Database |
|---|---|---|
| **Development** | Local development | Local PostgreSQL / Docker |
| **Staging** | Pre-production testing | Isolated managed PostgreSQL |
| **Production** | Live deployment | Production managed PostgreSQL |

### 10.3 CI/CD Pipeline (Planned)

```
Push to main → GitHub Actions → Lint + Test → Build → Deploy
                                    │
                     ┌──────────────┼──────────────┐
                     ▼              ▼              ▼
               Frontend Build  Backend Build  DB Migration
               (npm run build) (Docker image) (prisma migrate)
                     │              │              │
                     ▼              ▼              ▼
                  Vercel         Railway       PostgreSQL
```

---

## 11. Security Considerations

### 11.1 Security Layers

| Layer | Measure | Implementation |
|---|---|---|
| **Input Validation** | Validate and sanitize all inputs | Joi / Zod schemas in validators |
| **SQL Injection** | Parameterized queries | Prisma ORM (built-in protection) |
| **XSS Prevention** | Output encoding, CSP headers | React (auto-escapes), Helmet.js |
| **CORS** | Restrict allowed origins | Express CORS middleware with whitelist |
| **HTTP Headers** | Secure headers | Helmet.js (`X-Frame-Options`, `HSTS`, `X-Content-Type-Options`, etc.) |
| **Rate Limiting** | Prevent brute-force & DDoS | express-rate-limit middleware |
| **Authentication** | JWT with expiration | bcrypt for passwords, short-lived tokens |
| **Authorization** | Role-based middleware | Per-route RBAC checks |
| **Secrets Management** | Environment variables | `.env` files (never committed), platform secrets |

### 11.2 Environment Variable Management

```bash
# .env.example — committed to version control (values are placeholders)
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://user:password@localhost:5432/disasterready?schema=public"

JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://localhost:5173

# Future
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

> [!WARNING]
> Never commit `.env` files containing real secrets. Use `.env.example` with placeholder values and add `.env` to `.gitignore`.

### 11.3 Security Checklist

- [ ] All user inputs validated with Joi/Zod before processing
- [ ] Passwords hashed with **bcrypt** (min 12 salt rounds)
- [ ] JWT secret is strong and stored in environment variables
- [ ] CORS whitelist configured for allowed frontend origins only
- [ ] Helmet.js enabled for all HTTP security headers
- [ ] Rate limiting applied to authentication and API endpoints
- [ ] SQL injection prevented via Prisma parameterized queries
- [ ] Sensitive routes protected with authentication + authorization middleware
- [ ] HTTPS enforced in production
- [ ] Dependencies audited regularly (`npm audit`)

---

## Appendix: Key Design Decisions

| Decision | Rationale |
|---|---|
| **Prisma over raw SQL** | Type safety, auto-generated client, migration system, developer productivity |
| **Express.js over Fastify** | Mature ecosystem, extensive middleware, team familiarity |
| **PostgreSQL over MongoDB** | Relational data model suits user-alert-resource relationships; ACID compliance |
| **JWT over Session cookies** | Stateless authentication simplifies horizontal scaling and Unity integration |
| **Unity WebGL over native** | Browser-based delivery — no install required, accessible to all users |
| **REST over GraphQL** | Simpler to implement, sufficient for current requirements, well-understood by team |

---

*This is a living document. It will be updated as the DisasterReady architecture evolves.*
