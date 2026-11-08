# DisasterReady — API Contracts

> Comprehensive API contract documentation for the DisasterReady disaster awareness, preparedness, and emergency response platform.

---

## Table of Contents

- [Overview & Conventions](#overview--conventions)
- [1. Authentication](#1-authentication)
- [2. Users](#2-users)
- [3. Disasters](#3-disasters)
- [4. Alerts](#4-alerts)
- [5. Events](#5-events)
- [6. Registrations](#6-registrations)
- [7. Notifications](#7-notifications)
- [8. Emergency Resources](#8-emergency-resources)
- [9. Incident Reports](#9-incident-reports)
- [10. Preparedness Kit](#10-preparedness-kit)
- [11. Simulations](#11-simulations)

---

## Overview & Conventions

### Base URL

```
https://<hostname>/api/v1
```

All endpoints documented below are relative to this base URL. For local development the base URL is typically `http://localhost:3000/api/v1`.

### Authentication

The API uses **JWT Bearer tokens**. After a successful login or registration the server returns an access token. Include it in all subsequent requests that require authentication:

```
Authorization: Bearer <access_token>
```

### Roles

| Role | Description |
|------|-------------|
| `CITIZEN` | General public user |
| `AUTHORITY` | Government official / emergency responder |
| `ADMIN` | Platform administrator with full access |

*"Authenticated"* means **any logged-in user** regardless of role.

### Standard Success Response

All successful responses are wrapped in a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is already registered"
  }
}
```

#### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body failed validation |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate / conflicting resource |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Pagination

List endpoints return paginated data:

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Query parameters** shared by all list endpoints:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number (1-based) |
| `limit` | integer | `10` | Items per page (max 100) |

### Common Headers

| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` | For POST / PATCH requests |
| `Authorization` | `Bearer <token>` | For authenticated endpoints |

---

## 1. Authentication

### POST `/api/v1/auth/register`

Register a new user account.

| Property | Value |
|----------|-------|
| **Access** | Public |

**Request Body**

```json
{
  "email": "jane.doe@example.com",
  "password": "SecureP@ss123",
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1-555-0101",
  "role": "CITIZEN"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | ✅ | Must be unique, valid email |
| `password` | string | ✅ | Min 8 characters |
| `firstName` | string | ✅ | |
| `lastName` | string | ✅ | |
| `phone` | string | ❌ | |
| `role` | enum | ❌ | `CITIZEN` (default), `AUTHORITY` |

**Success Response** — `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
      "email": "jane.doe@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "CITIZEN",
      "phone": "+1-555-0101",
      "avatarUrl": null,
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Missing required fields or invalid format |
| 409 | `CONFLICT` | Email already registered |

---

### POST `/api/v1/auth/login`

Authenticate a user and receive an access token.

| Property | Value |
|----------|-------|
| **Access** | Public |

**Request Body**

```json
{
  "email": "jane.doe@example.com",
  "password": "SecureP@ss123"
}
```

| Field | Type | Required |
|-------|------|----------|
| `email` | string | ✅ |
| `password` | string | ✅ |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
      "email": "jane.doe@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "CITIZEN",
      "avatarUrl": null,
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Missing email or password |
| 401 | `UNAUTHORIZED` | Invalid credentials |

---

### POST `/api/v1/auth/logout`

Invalidate the current session / token.

| Property | Value |
|----------|-------|
| **Access** | Authenticated |

**Request Body** — None

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

---

### GET `/api/v1/auth/me`

Retrieve the currently authenticated user's profile.

| Property | Value |
|----------|-------|
| **Access** | Authenticated |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
    "email": "jane.doe@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "CITIZEN",
    "phone": "+1-555-0101",
    "avatarUrl": "https://cdn.disasterready.app/avatars/jane.png",
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-03-22T08:15:00.000Z"
  },
  "message": "Profile retrieved successfully"
}
```

---

## 2. Users

### GET `/api/v1/users`

List all users with optional filters.

| Property | Value |
|----------|-------|
| **Access** | `ADMIN` |

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `role` | enum | Filter by role (`CITIZEN`, `AUTHORITY`, `ADMIN`) |
| `isActive` | boolean | Filter by active status |
| `search` | string | Search by name or email |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
      "email": "jane.doe@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "CITIZEN",
      "phone": "+1-555-0101",
      "avatarUrl": null,
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 48,
    "totalPages": 5
  }
}
```

---

### GET `/api/v1/users/:id`

Get a single user by ID.

| Property | Value |
|----------|-------|
| **Access** | `ADMIN` |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
    "email": "jane.doe@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "CITIZEN",
    "phone": "+1-555-0101",
    "avatarUrl": null,
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-03-22T08:15:00.000Z"
  },
  "message": "User retrieved successfully"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 404 | `NOT_FOUND` | User does not exist |

---

### PATCH `/api/v1/users/:id`

Update a user's profile. Admins can update any user; non-admin users can only update their own profile.

| Property | Value |
|----------|-------|
| **Access** | `ADMIN` or own profile |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

**Request Body** (all fields optional)

```json
{
  "firstName": "Janet",
  "lastName": "Doe-Smith",
  "phone": "+1-555-0202",
  "avatarUrl": "https://cdn.disasterready.app/avatars/janet.png"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `firstName` | string | |
| `lastName` | string | |
| `phone` | string | |
| `avatarUrl` | string | Valid URL |
| `role` | enum | **ADMIN only** — change user's role |
| `isActive` | boolean | **ADMIN only** — activate / deactivate |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
    "email": "jane.doe@example.com",
    "firstName": "Janet",
    "lastName": "Doe-Smith",
    "role": "CITIZEN",
    "phone": "+1-555-0202",
    "avatarUrl": "https://cdn.disasterready.app/avatars/janet.png",
    "isActive": true,
    "updatedAt": "2025-04-01T12:00:00.000Z"
  },
  "message": "User updated successfully"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 403 | `FORBIDDEN` | Trying to update another user's profile without ADMIN role |
| 404 | `NOT_FOUND` | User does not exist |

---

### DELETE `/api/v1/users/:id`

Soft-delete (deactivate) a user account.

| Property | Value |
|----------|-------|
| **Access** | `ADMIN` |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": "User deactivated successfully"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 404 | `NOT_FOUND` | User does not exist |

---

## 3. Disasters

### GET `/api/v1/disasters`

List all disaster types / entries.

| Property | Value |
|----------|-------|
| **Access** | Public |

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `type` | enum | Filter by `DisasterType` (e.g., `EARTHQUAKE`, `FLOOD`, `HURRICANE`, `WILDFIRE`, `TSUNAMI`, `TORNADO`, `VOLCANIC_ERUPTION`, `LANDSLIDE`, `DROUGHT`, `PANDEMIC`) |
| `search` | string | Search by name or description |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Earthquake",
      "type": "EARTHQUAKE",
      "description": "A sudden shaking of the ground caused by tectonic movements.",
      "guidelines": "Drop, Cover, and Hold On. Stay away from windows...",
      "iconUrl": "https://cdn.disasterready.app/icons/earthquake.svg",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "totalPages": 2
  }
}
```

---

### GET `/api/v1/disasters/:id`

Get detailed information about a specific disaster type.

| Property | Value |
|----------|-------|
| **Access** | Public |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Disaster ID |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Earthquake",
    "type": "EARTHQUAKE",
    "description": "A sudden shaking of the ground caused by tectonic movements.",
    "guidelines": "Drop, Cover, and Hold On. Stay away from windows and heavy objects. If indoors, stay there. If outdoors, move to an open area away from buildings.",
    "iconUrl": "https://cdn.disasterready.app/icons/earthquake.svg",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "Disaster retrieved successfully"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 404 | `NOT_FOUND` | Disaster does not exist |

---

### POST `/api/v1/disasters`

Create a new disaster type entry.

| Property | Value |
|----------|-------|
| **Access** | `ADMIN` |

**Request Body**

```json
{
  "name": "Flood",
  "type": "FLOOD",
  "description": "An overflow of water that submerges normally dry land.",
  "guidelines": "Move to higher ground immediately. Avoid walking in floodwater. Do not drive through flooded areas.",
  "iconUrl": "https://cdn.disasterready.app/icons/flood.svg"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ | |
| `type` | enum | ✅ | Valid `DisasterType` value |
| `description` | string | ✅ | |
| `guidelines` | string | ✅ | Safety guidelines for the public |
| `iconUrl` | string | ❌ | URL to the disaster icon |

**Success Response** — `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "c3d4e5f6-7890-abcd-ef12-34567890abcd",
    "name": "Flood",
    "type": "FLOOD",
    "description": "An overflow of water that submerges normally dry land.",
    "guidelines": "Move to higher ground immediately...",
    "iconUrl": "https://cdn.disasterready.app/icons/flood.svg",
    "createdAt": "2025-02-10T14:00:00.000Z"
  },
  "message": "Disaster created successfully"
}
```

---

### PATCH `/api/v1/disasters/:id`

Update an existing disaster entry.

| Property | Value |
|----------|-------|
| **Access** | `ADMIN` |

**Request Body** (all fields optional)

```json
{
  "guidelines": "Updated safety guidelines with latest recommendations...",
  "iconUrl": "https://cdn.disasterready.app/icons/flood-v2.svg"
}
```

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "c3d4e5f6-7890-abcd-ef12-34567890abcd",
    "name": "Flood",
    "type": "FLOOD",
    "description": "An overflow of water that submerges normally dry land.",
    "guidelines": "Updated safety guidelines with latest recommendations...",
    "iconUrl": "https://cdn.disasterready.app/icons/flood-v2.svg",
    "updatedAt": "2025-03-05T09:30:00.000Z"
  },
  "message": "Disaster updated successfully"
}
```

---

### DELETE `/api/v1/disasters/:id`

Delete a disaster entry.

| Property | Value |
|----------|-------|
| **Access** | `ADMIN` |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": "Disaster deleted successfully"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 404 | `NOT_FOUND` | Disaster does not exist |

---

## 4. Alerts

### GET `/api/v1/alerts`

List alerts with optional filters.

| Property | Value |
|----------|-------|
| **Access** | Public |

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `severity` | enum | `LOW`, `MODERATE`, `HIGH`, `CRITICAL` |
| `status` | enum | `ACTIVE`, `EXPIRED`, `CANCELLED` |
| `disasterId` | UUID | Filter by disaster type |
| `latitude` | float | Center latitude for proximity search |
| `longitude` | float | Center longitude for proximity search |
| `radiusKm` | float | Search radius in kilometres (requires lat/lng) |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "d4e5f6a7-8901-bcde-f234-567890abcdef",
      "title": "Flash Flood Warning — Downtown Area",
      "description": "Heavy rainfall expected to cause flash flooding in low-lying areas. Avoid travel near river banks.",
      "severity": "HIGH",
      "status": "ACTIVE",
      "latitude": 34.0522,
      "longitude": -118.2437,
      "radius": 15.0,
      "issuedAt": "2025-06-15T08:00:00.000Z",
      "expiresAt": "2025-06-16T08:00:00.000Z",
      "disaster": {
        "id": "c3d4e5f6-7890-abcd-ef12-34567890abcd",
        "name": "Flood",
        "type": "FLOOD"
      },
      "issuedBy": {
        "id": "e6f7a8b9-0123-cdef-4567-890abcdef012",
        "firstName": "Robert",
        "lastName": "Chen",
        "role": "AUTHORITY"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### GET `/api/v1/alerts/:id`

Get detailed information about a specific alert.

| Property | Value |
|----------|-------|
| **Access** | Public |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Alert ID |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "d4e5f6a7-8901-bcde-f234-567890abcdef",
    "title": "Flash Flood Warning — Downtown Area",
    "description": "Heavy rainfall expected to cause flash flooding in low-lying areas.",
    "severity": "HIGH",
    "status": "ACTIVE",
    "latitude": 34.0522,
    "longitude": -118.2437,
    "radius": 15.0,
    "issuedAt": "2025-06-15T08:00:00.000Z",
    "expiresAt": "2025-06-16T08:00:00.000Z",
    "disaster": {
      "id": "c3d4e5f6-7890-abcd-ef12-34567890abcd",
      "name": "Flood",
      "type": "FLOOD",
      "guidelines": "Move to higher ground immediately..."
    },
    "issuedBy": {
      "id": "e6f7a8b9-0123-cdef-4567-890abcdef012",
      "firstName": "Robert",
      "lastName": "Chen",
      "role": "AUTHORITY"
    },
    "createdAt": "2025-06-15T08:00:00.000Z",
    "updatedAt": "2025-06-15T08:00:00.000Z"
  },
  "message": "Alert retrieved successfully"
}
```

---

### POST `/api/v1/alerts`

Create a new alert.

| Property | Value |
|----------|-------|
| **Access** | `AUTHORITY`, `ADMIN` |

**Request Body**

```json
{
  "title": "Earthquake Advisory — Coastal Region",
  "description": "A 4.5 magnitude earthquake detected offshore. Residents in coastal areas should be prepared for aftershocks.",
  "severity": "MODERATE",
  "latitude": 33.7490,
  "longitude": -118.3880,
  "radius": 25.0,
  "expiresAt": "2025-07-01T00:00:00.000Z",
  "disasterId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✅ | |
| `description` | string | ✅ | |
| `severity` | enum | ✅ | `LOW`, `MODERATE`, `HIGH`, `CRITICAL` |
| `latitude` | float | ✅ | Alert center latitude |
| `longitude` | float | ✅ | Alert center longitude |
| `radius` | float | ✅ | Affected radius in kilometres |
| `expiresAt` | ISO 8601 | ✅ | Must be in the future |
| `disasterId` | UUID | ✅ | Reference to a Disaster entry |

> **Note:** `issuedAt` is set automatically to the current timestamp. `issuedById` is derived from the authenticated user. `status` defaults to `ACTIVE`.

**Success Response** — `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "f8a9b0c1-2345-def6-7890-abcdef123456",
    "title": "Earthquake Advisory — Coastal Region",
    "description": "A 4.5 magnitude earthquake detected offshore...",
    "severity": "MODERATE",
    "status": "ACTIVE",
    "latitude": 33.7490,
    "longitude": -118.3880,
    "radius": 25.0,
    "issuedAt": "2025-06-20T14:30:00.000Z",
    "expiresAt": "2025-07-01T00:00:00.000Z",
    "disasterId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "issuedById": "e6f7a8b9-0123-cdef-4567-890abcdef012",
    "createdAt": "2025-06-20T14:30:00.000Z"
  },
  "message": "Alert created successfully"
}
```

---

### PATCH `/api/v1/alerts/:id`

Update an existing alert. Only the authority who created the alert or an admin can update it.

| Property | Value |
|----------|-------|
| **Access** | `AUTHORITY` (creator only), `ADMIN` |

**Request Body** (all fields optional)

```json
{
  "severity": "CRITICAL",
  "status": "CANCELLED",
  "description": "Update: Alert has been cancelled as the threat has subsided."
}
```

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | |
| `description` | string | |
| `severity` | enum | `LOW`, `MODERATE`, `HIGH`, `CRITICAL` |
| `status` | enum | `ACTIVE`, `EXPIRED`, `CANCELLED` |
| `latitude` | float | |
| `longitude` | float | |
| `radius` | float | |
| `expiresAt` | ISO 8601 | |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "f8a9b0c1-2345-def6-7890-abcdef123456",
    "title": "Earthquake Advisory — Coastal Region",
    "severity": "CRITICAL",
    "status": "CANCELLED",
    "updatedAt": "2025-06-21T10:00:00.000Z"
  },
  "message": "Alert updated successfully"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 403 | `FORBIDDEN` | Non-creator AUTHORITY attempting to update |
| 404 | `NOT_FOUND` | Alert does not exist |

---

### DELETE `/api/v1/alerts/:id`

Permanently delete an alert.

| Property | Value |
|----------|-------|
| **Access** | `ADMIN` |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": "Alert deleted successfully"
}
```

---

## 5. Events

### GET `/api/v1/events`

List preparedness / community events.

| Property | Value |
|----------|-------|
| **Access** | Public |

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `status` | enum | `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED` |
| `startDate` | ISO 8601 | Events starting after this date |
| `endDate` | ISO 8601 | Events ending before this date |
| `search` | string | Search by title or description |
| `latitude` | float | Center latitude for proximity search |
| `longitude` | float | Center longitude for proximity search |
| `radiusKm` | float | Search radius in kilometres |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "e1f2a3b4-c5d6-7890-ef12-3456789abcde",
      "title": "Community Earthquake Drill",
      "description": "Annual earthquake preparedness drill for downtown residents.",
      "status": "UPCOMING",
      "location": "City Hall, 200 N Spring St, Los Angeles, CA",
      "latitude": 34.0537,
      "longitude": -118.2427,
      "startDate": "2025-08-01T09:00:00.000Z",
      "endDate": "2025-08-01T12:00:00.000Z",
      "capacity": 200,
      "registrationCount": 75,
      "organizer": {
        "id": "e6f7a8b9-0123-cdef-4567-890abcdef012",
        "firstName": "Robert",
        "lastName": "Chen"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1
  }
}
```

---

### GET `/api/v1/events/:id`

Get detailed information about a specific event.

| Property | Value |
|----------|-------|
| **Access** | Public |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "e1f2a3b4-c5d6-7890-ef12-3456789abcde",
    "title": "Community Earthquake Drill",
    "description": "Annual earthquake preparedness drill for downtown residents. Includes hands-on training with first aid kits and fire extinguishers.",
    "status": "UPCOMING",
    "location": "City Hall, 200 N Spring St, Los Angeles, CA",
    "latitude": 34.0537,
    "longitude": -118.2427,
    "startDate": "2025-08-01T09:00:00.000Z",
    "endDate": "2025-08-01T12:00:00.000Z",
    "capacity": 200,
    "registrationCount": 75,
    "organizer": {
      "id": "e6f7a8b9-0123-cdef-4567-890abcdef012",
      "firstName": "Robert",
      "lastName": "Chen",
      "role": "AUTHORITY"
    },
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-06-15T08:00:00.000Z"
  },
  "message": "Event retrieved successfully"
}
```

---

### POST `/api/v1/events`

Create a new community event.

| Property | Value |
|----------|-------|
| **Access** | `AUTHORITY`, `ADMIN` |

**Request Body**

```json
{
  "title": "Flood Awareness Workshop",
  "description": "Learn how to prepare for flood season and create an emergency plan for your family.",
  "location": "Community Center, 500 Elm St, Houston, TX",
  "latitude": 29.7604,
  "longitude": -95.3698,
  "startDate": "2025-09-10T10:00:00.000Z",
  "endDate": "2025-09-10T14:00:00.000Z",
  "capacity": 100
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✅ | |
| `description` | string | ✅ | |
| `location` | string | ✅ | Human-readable address |
| `latitude` | float | ✅ | |
| `longitude` | float | ✅ | |
| `startDate` | ISO 8601 | ✅ | Must be in the future |
| `endDate` | ISO 8601 | ✅ | Must be after `startDate` |
| `capacity` | integer | ❌ | Max attendees (null = unlimited) |

> **Note:** `organizerId` is derived from the authenticated user. `status` defaults to `UPCOMING`.

**Success Response** — `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "f2a3b4c5-d6e7-8901-f234-56789abcdef0",
    "title": "Flood Awareness Workshop",
    "description": "Learn how to prepare for flood season...",
    "status": "UPCOMING",
    "location": "Community Center, 500 Elm St, Houston, TX",
    "latitude": 29.7604,
    "longitude": -95.3698,
    "startDate": "2025-09-10T10:00:00.000Z",
    "endDate": "2025-09-10T14:00:00.000Z",
    "capacity": 100,
    "organizerId": "e6f7a8b9-0123-cdef-4567-890abcdef012",
    "createdAt": "2025-07-01T12:00:00.000Z"
  },
  "message": "Event created successfully"
}
```

---

### PATCH `/api/v1/events/:id`

Update an event. Only the organizer or an admin can update it.

| Property | Value |
|----------|-------|
| **Access** | `AUTHORITY` (organizer only), `ADMIN` |

**Request Body** (all fields optional)

```json
{
  "status": "CANCELLED",
  "description": "Event cancelled due to severe weather forecast."
}
```

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "f2a3b4c5-d6e7-8901-f234-56789abcdef0",
    "title": "Flood Awareness Workshop",
    "status": "CANCELLED",
    "updatedAt": "2025-07-05T08:00:00.000Z"
  },
  "message": "Event updated successfully"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 403 | `FORBIDDEN` | Non-organizer AUTHORITY attempting to update |
| 404 | `NOT_FOUND` | Event does not exist |

---

### DELETE `/api/v1/events/:id`

Delete an event permanently.

| Property | Value |
|----------|-------|
| **Access** | `ADMIN` |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": "Event deleted successfully"
}
```

---

## 6. Registrations

### POST `/api/v1/events/:eventId/register`

Register the current user for an event.

| Property | Value |
|----------|-------|
| **Access** | `CITIZEN` |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `eventId` | UUID | Event ID |

**Request Body** — None

**Success Response** — `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-111111111111",
    "status": "REGISTERED",
    "userId": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
    "eventId": "e1f2a3b4-c5d6-7890-ef12-3456789abcde",
    "createdAt": "2025-07-10T09:00:00.000Z"
  },
  "message": "Successfully registered for event"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 404 | `NOT_FOUND` | Event does not exist |
| 409 | `CONFLICT` | Already registered for this event |
| 400 | `VALIDATION_ERROR` | Event is at full capacity or not UPCOMING |

---

### DELETE `/api/v1/events/:eventId/register`

Cancel the current user's registration for an event.

| Property | Value |
|----------|-------|
| **Access** | `CITIZEN` |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `eventId` | UUID | Event ID |

**Request Body** — None

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": "Registration cancelled successfully"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 404 | `NOT_FOUND` | Registration does not exist |

---

### GET `/api/v1/events/:eventId/registrations`

List all registrations for a specific event.

| Property | Value |
|----------|-------|
| **Access** | `AUTHORITY` (event organizer only), `ADMIN` |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `eventId` | UUID | Event ID |

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `status` | enum | `REGISTERED`, `ATTENDED`, `CANCELLED` |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-111111111111",
      "status": "REGISTERED",
      "user": {
        "id": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane.doe@example.com",
        "phone": "+1-555-0101"
      },
      "createdAt": "2025-07-10T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 75,
    "totalPages": 8
  }
}
```

---

### GET `/api/v1/users/me/registrations`

Get the current user's event registrations.

| Property | Value |
|----------|-------|
| **Access** | Authenticated |

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `status` | enum | `REGISTERED`, `ATTENDED`, `CANCELLED` |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-111111111111",
      "status": "REGISTERED",
      "event": {
        "id": "e1f2a3b4-c5d6-7890-ef12-3456789abcde",
        "title": "Community Earthquake Drill",
        "status": "UPCOMING",
        "location": "City Hall, 200 N Spring St, Los Angeles, CA",
        "startDate": "2025-08-01T09:00:00.000Z",
        "endDate": "2025-08-01T12:00:00.000Z"
      },
      "createdAt": "2025-07-10T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

---

## 7. Notifications

### GET `/api/v1/notifications`

Get the authenticated user's notifications.

| Property | Value |
|----------|-------|
| **Access** | Authenticated |

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `type` | enum | `ALERT`, `EVENT_REMINDER`, `INCIDENT_UPDATE`, `GENERAL` |
| `isRead` | boolean | Filter by read status |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "n1o2t3i4-f5y6-7890-abcd-ef1234567890",
      "type": "ALERT",
      "title": "New Flash Flood Warning",
      "message": "A flash flood warning has been issued for your area. Please review the alert for details.",
      "isRead": false,
      "userId": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
      "createdAt": "2025-06-15T08:01:00.000Z"
    },
    {
      "id": "n2o3t4i5-f6y7-8901-bcde-f23456789012",
      "type": "EVENT_REMINDER",
      "title": "Event Tomorrow: Community Earthquake Drill",
      "message": "Reminder: The Community Earthquake Drill is scheduled for tomorrow at 9:00 AM.",
      "isRead": true,
      "userId": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
      "createdAt": "2025-07-31T18:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

---

### PATCH `/api/v1/notifications/:id/read`

Mark a single notification as read.

| Property | Value |
|----------|-------|
| **Access** | Authenticated (own notifications only) |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Notification ID |

**Request Body** — None

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "n1o2t3i4-f5y6-7890-abcd-ef1234567890",
    "isRead": true,
    "updatedAt": "2025-06-15T10:00:00.000Z"
  },
  "message": "Notification marked as read"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 404 | `NOT_FOUND` | Notification does not exist or does not belong to user |

---

### PATCH `/api/v1/notifications/read-all`

Mark all of the current user's notifications as read.

| Property | Value |
|----------|-------|
| **Access** | Authenticated |

**Request Body** — None

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "updatedCount": 12
  },
  "message": "All notifications marked as read"
}
```

---

### DELETE `/api/v1/notifications/:id`

Delete a notification.

| Property | Value |
|----------|-------|
| **Access** | Authenticated (own notifications only) |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Notification ID |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": "Notification deleted successfully"
}
```

---

## 8. Emergency Resources

### GET `/api/v1/emergency-resources`

List emergency resources (shelters, hospitals, fire stations, etc.) with optional filters.

| Property | Value |
|----------|-------|
| **Access** | Public |

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `type` | enum | `SHELTER`, `HOSPITAL`, `FIRE_STATION`, `POLICE_STATION`, `PHARMACY`, `BLOOD_BANK`, `WATER_SUPPLY`, `FOOD_BANK` |
| `isActive` | boolean | Filter by active status |
| `latitude` | float | Center latitude for proximity search |
| `longitude` | float | Center longitude for proximity search |
| `radiusKm` | float | Search radius in kilometres |
| `search` | string | Search by name or address |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "r1e2s3o4-u5r6-c7e8-9012-3456789abcde",
      "name": "Downtown Emergency Shelter",
      "type": "SHELTER",
      "description": "Red Cross-operated emergency shelter with 500 bed capacity.",
      "address": "300 S Broadway, Los Angeles, CA 90013",
      "latitude": 34.0492,
      "longitude": -118.2489,
      "phone": "+1-213-555-0100",
      "capacity": 500,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### GET `/api/v1/emergency-resources/:id`

Get details of a specific emergency resource.

| Property | Value |
|----------|-------|
| **Access** | Public |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "r1e2s3o4-u5r6-c7e8-9012-3456789abcde",
    "name": "Downtown Emergency Shelter",
    "type": "SHELTER",
    "description": "Red Cross-operated emergency shelter with 500 bed capacity. Provides meals, blankets, and basic medical aid.",
    "address": "300 S Broadway, Los Angeles, CA 90013",
    "latitude": 34.0492,
    "longitude": -118.2489,
    "phone": "+1-213-555-0100",
    "capacity": 500,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-05-20T16:00:00.000Z"
  },
  "message": "Emergency resource retrieved successfully"
}
```

---

### POST `/api/v1/emergency-resources`

Create a new emergency resource entry.

| Property | Value |
|----------|-------|
| **Access** | `AUTHORITY`, `ADMIN` |

**Request Body**

```json
{
  "name": "Central Hospital — Emergency Wing",
  "type": "HOSPITAL",
  "description": "Level I Trauma Center with 24/7 emergency department.",
  "address": "1200 N State St, Los Angeles, CA 90033",
  "latitude": 34.0588,
  "longitude": -118.2120,
  "phone": "+1-323-555-0200",
  "capacity": 150,
  "isActive": true
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ | |
| `type` | enum | ✅ | See type enum values |
| `description` | string | ❌ | |
| `address` | string | ✅ | Human-readable address |
| `latitude` | float | ✅ | |
| `longitude` | float | ✅ | |
| `phone` | string | ❌ | Contact number |
| `capacity` | integer | ❌ | |
| `isActive` | boolean | ❌ | Defaults to `true` |

**Success Response** — `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "r2e3s4o5-u6r7-c8e9-0123-456789abcdef",
    "name": "Central Hospital — Emergency Wing",
    "type": "HOSPITAL",
    "description": "Level I Trauma Center with 24/7 emergency department.",
    "address": "1200 N State St, Los Angeles, CA 90033",
    "latitude": 34.0588,
    "longitude": -118.2120,
    "phone": "+1-323-555-0200",
    "capacity": 150,
    "isActive": true,
    "createdAt": "2025-04-01T10:00:00.000Z"
  },
  "message": "Emergency resource created successfully"
}
```

---

### PATCH `/api/v1/emergency-resources/:id`

Update an emergency resource.

| Property | Value |
|----------|-------|
| **Access** | `AUTHORITY`, `ADMIN` |

**Request Body** (all fields optional)

```json
{
  "isActive": false,
  "description": "Temporarily closed for renovation. Expected reopening: March 2026."
}
```

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "r2e3s4o5-u6r7-c8e9-0123-456789abcdef",
    "name": "Central Hospital — Emergency Wing",
    "type": "HOSPITAL",
    "isActive": false,
    "description": "Temporarily closed for renovation. Expected reopening: March 2026.",
    "updatedAt": "2025-06-01T08:00:00.000Z"
  },
  "message": "Emergency resource updated successfully"
}
```

---

### DELETE `/api/v1/emergency-resources/:id`

Delete an emergency resource entry.

| Property | Value |
|----------|-------|
| **Access** | `ADMIN` |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": "Emergency resource deleted successfully"
}
```

---

## 9. Incident Reports

### GET `/api/v1/incident-reports`

List all submitted incident reports.

| Property | Value |
|----------|-------|
| **Access** | `AUTHORITY`, `ADMIN` |

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `status` | enum | `SUBMITTED`, `UNDER_REVIEW`, `VERIFIED`, `RESOLVED`, `REJECTED` |
| `latitude` | float | Center latitude for proximity search |
| `longitude` | float | Center longitude for proximity search |
| `radiusKm` | float | Search radius in kilometres |
| `search` | string | Search by title or description |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "i1n2c3i4-d5e6-n7t8-9012-3456789abcde",
      "title": "Downed Power Line on Oak Street",
      "description": "A large tree has fallen and brought down power lines on the 400 block of Oak Street. Area is blocked.",
      "status": "SUBMITTED",
      "latitude": 34.0650,
      "longitude": -118.2300,
      "address": "400 Oak St, Los Angeles, CA",
      "imageUrl": "https://cdn.disasterready.app/reports/img_20250615_001.jpg",
      "reportedBy": {
        "id": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
        "firstName": "Jane",
        "lastName": "Doe"
      },
      "createdAt": "2025-06-15T16:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 32,
    "totalPages": 4
  }
}
```

---

### GET `/api/v1/incident-reports/:id`

Get detailed information about a specific incident report.

| Property | Value |
|----------|-------|
| **Access** | `AUTHORITY`, `ADMIN`, or the user who submitted the report |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "i1n2c3i4-d5e6-n7t8-9012-3456789abcde",
    "title": "Downed Power Line on Oak Street",
    "description": "A large tree has fallen and brought down power lines on the 400 block of Oak Street. Area is blocked and there are sparks visible.",
    "status": "UNDER_REVIEW",
    "latitude": 34.0650,
    "longitude": -118.2300,
    "address": "400 Oak St, Los Angeles, CA",
    "imageUrl": "https://cdn.disasterready.app/reports/img_20250615_001.jpg",
    "reportedBy": {
      "id": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@example.com",
      "phone": "+1-555-0101"
    },
    "createdAt": "2025-06-15T16:30:00.000Z",
    "updatedAt": "2025-06-15T17:00:00.000Z"
  },
  "message": "Incident report retrieved successfully"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 403 | `FORBIDDEN` | CITIZEN trying to view someone else's report |
| 404 | `NOT_FOUND` | Report does not exist |

---

### POST `/api/v1/incident-reports`

Submit a new incident report.

| Property | Value |
|----------|-------|
| **Access** | `CITIZEN` |

**Request Body**

```json
{
  "title": "Flooding on Main Street",
  "description": "Severe flooding on Main Street between 1st and 3rd Avenue. Water level is approximately 2 feet deep. Several cars stranded.",
  "latitude": 34.0480,
  "longitude": -118.2560,
  "address": "Main St & 2nd Ave, Los Angeles, CA",
  "imageUrl": "https://cdn.disasterready.app/reports/img_20250615_002.jpg"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✅ | Brief summary of the incident |
| `description` | string | ✅ | Detailed description |
| `latitude` | float | ✅ | |
| `longitude` | float | ✅ | |
| `address` | string | ❌ | Human-readable address |
| `imageUrl` | string | ❌ | URL to uploaded image |

> **Note:** `reportedById` is derived from the authenticated user. `status` defaults to `SUBMITTED`.

**Success Response** — `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "i2n3c4i5-d6e7-n8t9-0123-456789abcdef",
    "title": "Flooding on Main Street",
    "description": "Severe flooding on Main Street between 1st and 3rd Avenue...",
    "status": "SUBMITTED",
    "latitude": 34.0480,
    "longitude": -118.2560,
    "address": "Main St & 2nd Ave, Los Angeles, CA",
    "imageUrl": "https://cdn.disasterready.app/reports/img_20250615_002.jpg",
    "reportedById": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
    "createdAt": "2025-06-15T18:00:00.000Z"
  },
  "message": "Incident report submitted successfully"
}
```

---

### PATCH `/api/v1/incident-reports/:id`

Update an incident report's status. Used by authorities to review and manage reports.

| Property | Value |
|----------|-------|
| **Access** | `AUTHORITY`, `ADMIN` |

**Request Body**

```json
{
  "status": "VERIFIED"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `status` | enum | ✅ | `SUBMITTED`, `UNDER_REVIEW`, `VERIFIED`, `RESOLVED`, `REJECTED` |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "i2n3c4i5-d6e7-n8t9-0123-456789abcdef",
    "title": "Flooding on Main Street",
    "status": "VERIFIED",
    "updatedAt": "2025-06-16T09:00:00.000Z"
  },
  "message": "Incident report updated successfully"
}
```

---

### GET `/api/v1/users/me/incident-reports`

Get the current user's submitted incident reports.

| Property | Value |
|----------|-------|
| **Access** | Authenticated |

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `status` | enum | Filter by report status |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "i2n3c4i5-d6e7-n8t9-0123-456789abcdef",
      "title": "Flooding on Main Street",
      "status": "VERIFIED",
      "latitude": 34.0480,
      "longitude": -118.2560,
      "address": "Main St & 2nd Ave, Los Angeles, CA",
      "imageUrl": "https://cdn.disasterready.app/reports/img_20250615_002.jpg",
      "createdAt": "2025-06-15T18:00:00.000Z",
      "updatedAt": "2025-06-16T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

---

## 10. Preparedness Kit

### GET `/api/v1/preparedness-kit`

Get the authenticated user's preparedness kit items.

| Property | Value |
|----------|-------|
| **Access** | Authenticated |

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `category` | string | Filter by category (e.g., `food`, `medical`, `tools`, `documents`) |
| `isReady` | boolean | Filter by readiness status |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "p1r2e3p4-k5i6-t7i8-9012-3456789abcde",
      "name": "First Aid Kit",
      "description": "Complete first aid kit with bandages, antiseptic, pain relievers, and emergency blanket.",
      "category": "medical",
      "isReady": true,
      "quantity": 1,
      "userId": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
      "createdAt": "2025-03-01T10:00:00.000Z"
    },
    {
      "id": "p2r3e4p5-k6i7-t8i9-0123-456789abcdef",
      "name": "Bottled Water",
      "description": "1 gallon per person per day — 3-day supply for family of 4.",
      "category": "food",
      "isReady": false,
      "quantity": 12,
      "userId": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
      "createdAt": "2025-03-01T10:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1
  }
}
```

---

### POST `/api/v1/preparedness-kit`

Add an item to the user's preparedness kit.

| Property | Value |
|----------|-------|
| **Access** | Authenticated |

**Request Body**

```json
{
  "name": "Flashlight with Batteries",
  "description": "LED flashlight with extra set of AA batteries.",
  "category": "tools",
  "isReady": true,
  "quantity": 2
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ | |
| `description` | string | ❌ | |
| `category` | string | ✅ | e.g., `food`, `medical`, `tools`, `documents`, `clothing`, `communication` |
| `isReady` | boolean | ❌ | Defaults to `false` |
| `quantity` | integer | ❌ | Defaults to `1` |

**Success Response** — `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "p3r4e5p6-k7i8-t9i0-1234-56789abcdef0",
    "name": "Flashlight with Batteries",
    "description": "LED flashlight with extra set of AA batteries.",
    "category": "tools",
    "isReady": true,
    "quantity": 2,
    "userId": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
    "createdAt": "2025-04-10T14:00:00.000Z"
  },
  "message": "Item added to preparedness kit"
}
```

---

### PATCH `/api/v1/preparedness-kit/:id`

Update a preparedness kit item. Users can only update their own items.

| Property | Value |
|----------|-------|
| **Access** | Authenticated (own items only) |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Preparedness item ID |

**Request Body** (all fields optional)

```json
{
  "isReady": true,
  "quantity": 15,
  "description": "Stocked up — 15 gallons total."
}
```

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "p2r3e4p5-k6i7-t8i9-0123-456789abcdef",
    "name": "Bottled Water",
    "description": "Stocked up — 15 gallons total.",
    "category": "food",
    "isReady": true,
    "quantity": 15,
    "updatedAt": "2025-05-01T08:00:00.000Z"
  },
  "message": "Preparedness item updated successfully"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 403 | `FORBIDDEN` | Trying to update another user's item |
| 404 | `NOT_FOUND` | Item does not exist |

---

### DELETE `/api/v1/preparedness-kit/:id`

Remove an item from the user's preparedness kit.

| Property | Value |
|----------|-------|
| **Access** | Authenticated (own items only) |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Preparedness item ID |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": "Item removed from preparedness kit"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 403 | `FORBIDDEN` | Trying to delete another user's item |
| 404 | `NOT_FOUND` | Item does not exist |

---

## 11. Simulations

### GET `/api/v1/simulations/scenarios`

List available simulation scenarios.

| Property | Value |
|----------|-------|
| **Access** | Authenticated |

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `difficultyLevel` | string | Filter by difficulty (e.g., `BEGINNER`, `INTERMEDIATE`, `ADVANCED`) |
| `disasterId` | UUID | Filter by associated disaster type |
| `isActive` | boolean | Filter by active status |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "s1c2e3n4-a5r6-i7o8-9012-3456789abcde",
      "title": "Earthquake: Office Building Evacuation",
      "description": "Simulate an earthquake scenario in a 10-story office building. Make critical decisions to ensure the safety of occupants.",
      "difficultyLevel": "INTERMEDIATE",
      "durationMinutes": 15,
      "maxScore": 100,
      "isActive": true,
      "disaster": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Earthquake",
        "type": "EARTHQUAKE"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 6,
    "totalPages": 1
  }
}
```

---

### GET `/api/v1/simulations/scenarios/:id`

Get detailed information about a specific simulation scenario.

| Property | Value |
|----------|-------|
| **Access** | Authenticated |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "s1c2e3n4-a5r6-i7o8-9012-3456789abcde",
    "title": "Earthquake: Office Building Evacuation",
    "description": "Simulate an earthquake scenario in a 10-story office building. Make critical decisions about evacuation routes, aftershock response, and first aid priorities.",
    "difficultyLevel": "INTERMEDIATE",
    "durationMinutes": 15,
    "maxScore": 100,
    "isActive": true,
    "disaster": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Earthquake",
      "type": "EARTHQUAKE",
      "guidelines": "Drop, Cover, and Hold On..."
    },
    "createdAt": "2025-02-01T00:00:00.000Z",
    "updatedAt": "2025-04-15T12:00:00.000Z"
  },
  "message": "Scenario retrieved successfully"
}
```

---

### POST `/api/v1/simulations/scenarios`

Create a new simulation scenario.

| Property | Value |
|----------|-------|
| **Access** | `ADMIN` |

**Request Body**

```json
{
  "title": "Flood: Residential Evacuation",
  "description": "Navigate a rising flood scenario in a suburban neighbourhood. Decide when to evacuate, what to take, and how to reach safety.",
  "difficultyLevel": "BEGINNER",
  "durationMinutes": 10,
  "maxScore": 80,
  "isActive": true,
  "disasterId": "c3d4e5f6-7890-abcd-ef12-34567890abcd"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✅ | |
| `description` | string | ✅ | |
| `difficultyLevel` | string | ✅ | e.g., `BEGINNER`, `INTERMEDIATE`, `ADVANCED` |
| `durationMinutes` | integer | ✅ | Expected duration in minutes |
| `maxScore` | integer | ✅ | Maximum achievable score |
| `isActive` | boolean | ❌ | Defaults to `true` |
| `disasterId` | UUID | ✅ | Associated disaster type |

**Success Response** — `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "s2c3e4n5-a6r7-i8o9-0123-456789abcdef",
    "title": "Flood: Residential Evacuation",
    "description": "Navigate a rising flood scenario...",
    "difficultyLevel": "BEGINNER",
    "durationMinutes": 10,
    "maxScore": 80,
    "isActive": true,
    "disasterId": "c3d4e5f6-7890-abcd-ef12-34567890abcd",
    "createdAt": "2025-05-01T10:00:00.000Z"
  },
  "message": "Simulation scenario created successfully"
}
```

---

### POST `/api/v1/simulations/attempts`

Start a new simulation attempt.

| Property | Value |
|----------|-------|
| **Access** | Authenticated |

**Request Body**

```json
{
  "scenarioId": "s1c2e3n4-a5r6-i7o8-9012-3456789abcde"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `scenarioId` | UUID | ✅ | Must reference an active scenario |

> **Note:** `userId` is derived from the authenticated user. `status` defaults to `IN_PROGRESS`. `startedAt` is set to the current timestamp.

**Success Response** — `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "a1t2t3e4-m5p6-t7i8-9012-3456789abcde",
    "status": "IN_PROGRESS",
    "score": 0,
    "timeSpentSecs": 0,
    "startedAt": "2025-07-20T14:00:00.000Z",
    "completedAt": null,
    "userId": "b5f7c2d1-3a4e-4f8b-9c1d-2e3f4a5b6c7d",
    "scenarioId": "s1c2e3n4-a5r6-i7o8-9012-3456789abcde"
  },
  "message": "Simulation attempt started"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 404 | `NOT_FOUND` | Scenario does not exist or is not active |

---

### PATCH `/api/v1/simulations/attempts/:id`

Update a simulation attempt — typically to submit the final score or mark it as complete/abandoned.

| Property | Value |
|----------|-------|
| **Access** | Authenticated (own attempts only) |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Attempt ID |

**Request Body**

```json
{
  "status": "COMPLETED",
  "score": 85,
  "timeSpentSecs": 720
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `status` | enum | ✅ | `COMPLETED` or `ABANDONED` |
| `score` | integer | ❌ | Final score achieved |
| `timeSpentSecs` | integer | ❌ | Total time spent in seconds |

> **Note:** `completedAt` is set automatically when status becomes `COMPLETED` or `ABANDONED`.

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "a1t2t3e4-m5p6-t7i8-9012-3456789abcde",
    "status": "COMPLETED",
    "score": 85,
    "timeSpentSecs": 720,
    "startedAt": "2025-07-20T14:00:00.000Z",
    "completedAt": "2025-07-20T14:12:00.000Z",
    "scenarioId": "s1c2e3n4-a5r6-i7o8-9012-3456789abcde"
  },
  "message": "Simulation attempt updated successfully"
}
```

---

### GET `/api/v1/simulations/attempts/:id`

Get details of a specific simulation attempt, including all decisions made.

| Property | Value |
|----------|-------|
| **Access** | Authenticated (own attempts only) |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "a1t2t3e4-m5p6-t7i8-9012-3456789abcde",
    "status": "COMPLETED",
    "score": 85,
    "timeSpentSecs": 720,
    "startedAt": "2025-07-20T14:00:00.000Z",
    "completedAt": "2025-07-20T14:12:00.000Z",
    "scenario": {
      "id": "s1c2e3n4-a5r6-i7o8-9012-3456789abcde",
      "title": "Earthquake: Office Building Evacuation",
      "difficultyLevel": "INTERMEDIATE",
      "maxScore": 100
    },
    "decisions": [
      {
        "id": "d1e2c3i4-s5i6-o7n8-9012-3456789abcde",
        "stepNumber": 1,
        "situation": "You feel strong shaking in your 8th floor office. What do you do first?",
        "chosenOption": "Drop under my desk, cover my head, and hold on",
        "isCorrect": true,
        "pointsAwarded": 20,
        "timeTakenSecs": 8
      },
      {
        "id": "d2e3c4i5-s6i7-o8n9-0123-456789abcdef",
        "stepNumber": 2,
        "situation": "The shaking stops. You smell gas. What is your priority?",
        "chosenOption": "Alert others and evacuate using stairs immediately",
        "isCorrect": true,
        "pointsAwarded": 20,
        "timeTakenSecs": 12
      }
    ]
  },
  "message": "Attempt details retrieved successfully"
}
```

---

### POST `/api/v1/simulations/attempts/:attemptId/decisions`

Record a decision made during a simulation attempt.

| Property | Value |
|----------|-------|
| **Access** | Authenticated (own attempts only) |

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `attemptId` | UUID | Attempt ID (must be `IN_PROGRESS`) |

**Request Body**

```json
{
  "stepNumber": 3,
  "situation": "You are in the stairwell on the 5th floor. An aftershock hits. What do you do?",
  "chosenOption": "Brace against the wall and wait for the shaking to stop",
  "isCorrect": true,
  "pointsAwarded": 15,
  "timeTakenSecs": 10
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `stepNumber` | integer | ✅ | Sequential step number |
| `situation` | string | ✅ | Description of the scenario step |
| `chosenOption` | string | ✅ | The option selected by the user |
| `isCorrect` | boolean | ✅ | Whether the choice was correct |
| `pointsAwarded` | integer | ✅ | Points earned for this decision |
| `timeTakenSecs` | integer | ✅ | Time taken to make the decision |

**Success Response** — `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "d3e4c5i6-s7i8-o9n0-1234-56789abcdef0",
    "stepNumber": 3,
    "situation": "You are in the stairwell on the 5th floor. An aftershock hits. What do you do?",
    "chosenOption": "Brace against the wall and wait for the shaking to stop",
    "isCorrect": true,
    "pointsAwarded": 15,
    "timeTakenSecs": 10,
    "attemptId": "a1t2t3e4-m5p6-t7i8-9012-3456789abcde",
    "createdAt": "2025-07-20T14:05:30.000Z"
  },
  "message": "Decision recorded successfully"
}
```

**Error Responses**

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Attempt is not `IN_PROGRESS` |
| 404 | `NOT_FOUND` | Attempt does not exist |

---

### GET `/api/v1/users/me/simulations`

Get the current user's simulation history (all attempts).

| Property | Value |
|----------|-------|
| **Access** | Authenticated |

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `status` | enum | `IN_PROGRESS`, `COMPLETED`, `ABANDONED` |
| `scenarioId` | UUID | Filter by specific scenario |

**Success Response** — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "a1t2t3e4-m5p6-t7i8-9012-3456789abcde",
      "status": "COMPLETED",
      "score": 85,
      "timeSpentSecs": 720,
      "startedAt": "2025-07-20T14:00:00.000Z",
      "completedAt": "2025-07-20T14:12:00.000Z",
      "scenario": {
        "id": "s1c2e3n4-a5r6-i7o8-9012-3456789abcde",
        "title": "Earthquake: Office Building Evacuation",
        "difficultyLevel": "INTERMEDIATE",
        "maxScore": 100
      }
    },
    {
      "id": "a2t3t4e5-m6p7-t8i9-0123-456789abcdef",
      "status": "ABANDONED",
      "score": 30,
      "timeSpentSecs": 300,
      "startedAt": "2025-07-18T10:00:00.000Z",
      "completedAt": "2025-07-18T10:05:00.000Z",
      "scenario": {
        "id": "s2c3e4n5-a6r7-i8o9-0123-456789abcdef",
        "title": "Flood: Residential Evacuation",
        "difficultyLevel": "BEGINNER",
        "maxScore": 80
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

## Endpoint Summary

| # | Method | Endpoint | Access |
|---|--------|----------|--------|
| | **Authentication** | | |
| 1 | `POST` | `/api/v1/auth/register` | Public |
| 2 | `POST` | `/api/v1/auth/login` | Public |
| 3 | `POST` | `/api/v1/auth/logout` | Authenticated |
| 4 | `GET` | `/api/v1/auth/me` | Authenticated |
| | **Users** | | |
| 5 | `GET` | `/api/v1/users` | ADMIN |
| 6 | `GET` | `/api/v1/users/:id` | ADMIN |
| 7 | `PATCH` | `/api/v1/users/:id` | ADMIN / Own |
| 8 | `DELETE` | `/api/v1/users/:id` | ADMIN |
| | **Disasters** | | |
| 9 | `GET` | `/api/v1/disasters` | Public |
| 10 | `GET` | `/api/v1/disasters/:id` | Public |
| 11 | `POST` | `/api/v1/disasters` | ADMIN |
| 12 | `PATCH` | `/api/v1/disasters/:id` | ADMIN |
| 13 | `DELETE` | `/api/v1/disasters/:id` | ADMIN |
| | **Alerts** | | |
| 14 | `GET` | `/api/v1/alerts` | Public |
| 15 | `GET` | `/api/v1/alerts/:id` | Public |
| 16 | `POST` | `/api/v1/alerts` | AUTHORITY, ADMIN |
| 17 | `PATCH` | `/api/v1/alerts/:id` | Creator / ADMIN |
| 18 | `DELETE` | `/api/v1/alerts/:id` | ADMIN |
| | **Events** | | |
| 19 | `GET` | `/api/v1/events` | Public |
| 20 | `GET` | `/api/v1/events/:id` | Public |
| 21 | `POST` | `/api/v1/events` | AUTHORITY, ADMIN |
| 22 | `PATCH` | `/api/v1/events/:id` | Organizer / ADMIN |
| 23 | `DELETE` | `/api/v1/events/:id` | ADMIN |
| | **Registrations** | | |
| 24 | `POST` | `/api/v1/events/:eventId/register` | CITIZEN |
| 25 | `DELETE` | `/api/v1/events/:eventId/register` | CITIZEN |
| 26 | `GET` | `/api/v1/events/:eventId/registrations` | Organizer / ADMIN |
| 27 | `GET` | `/api/v1/users/me/registrations` | Authenticated |
| | **Notifications** | | |
| 28 | `GET` | `/api/v1/notifications` | Authenticated |
| 29 | `PATCH` | `/api/v1/notifications/:id/read` | Authenticated |
| 30 | `PATCH` | `/api/v1/notifications/read-all` | Authenticated |
| 31 | `DELETE` | `/api/v1/notifications/:id` | Authenticated |
| | **Emergency Resources** | | |
| 32 | `GET` | `/api/v1/emergency-resources` | Public |
| 33 | `GET` | `/api/v1/emergency-resources/:id` | Public |
| 34 | `POST` | `/api/v1/emergency-resources` | AUTHORITY, ADMIN |
| 35 | `PATCH` | `/api/v1/emergency-resources/:id` | AUTHORITY, ADMIN |
| 36 | `DELETE` | `/api/v1/emergency-resources/:id` | ADMIN |
| | **Incident Reports** | | |
| 37 | `GET` | `/api/v1/incident-reports` | AUTHORITY, ADMIN |
| 38 | `GET` | `/api/v1/incident-reports/:id` | AUTHORITY, ADMIN, Reporter |
| 39 | `POST` | `/api/v1/incident-reports` | CITIZEN |
| 40 | `PATCH` | `/api/v1/incident-reports/:id` | AUTHORITY, ADMIN |
| 41 | `GET` | `/api/v1/users/me/incident-reports` | Authenticated |
| | **Preparedness Kit** | | |
| 42 | `GET` | `/api/v1/preparedness-kit` | Authenticated |
| 43 | `POST` | `/api/v1/preparedness-kit` | Authenticated |
| 44 | `PATCH` | `/api/v1/preparedness-kit/:id` | Authenticated (own) |
| 45 | `DELETE` | `/api/v1/preparedness-kit/:id` | Authenticated (own) |
| | **Simulations** | | |
| 46 | `GET` | `/api/v1/simulations/scenarios` | Authenticated |
| 47 | `GET` | `/api/v1/simulations/scenarios/:id` | Authenticated |
| 48 | `POST` | `/api/v1/simulations/scenarios` | ADMIN |
| 49 | `POST` | `/api/v1/simulations/attempts` | Authenticated |
| 50 | `PATCH` | `/api/v1/simulations/attempts/:id` | Authenticated (own) |
| 51 | `GET` | `/api/v1/simulations/attempts/:id` | Authenticated (own) |
| 52 | `POST` | `/api/v1/simulations/attempts/:attemptId/decisions` | Authenticated (own) |
| 53 | `GET` | `/api/v1/users/me/simulations` | Authenticated |

---

*This document is auto-generated and should be kept in sync with the codebase. Last updated: 2025.*
