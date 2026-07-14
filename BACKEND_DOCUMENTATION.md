# Mathematics Club Event 2026 — Round 1 (IPO Round) Backend Documentation

---

# 1. Introduction

## 1.1 Overview

This document describes the backend service that powers Round 1 of the Mathematics Club Event 2026, referred to throughout this document as the **IPO Round**. The IPO Round is a simulated IPO auction in which participant teams bid for predefined IPO packages during a controlled event.

The backend serves as the central operational layer for this event. It provides the infrastructure required by both organizers and participants to carry out the IPO Round — managing the event lifecycle, enforcing access controls, persisting transactional records, and delivering live data to connected clients.

## 1.2 Responsibilities

The backend is responsible for the following during the IPO Round:

- **Event State Management** — Maintaining and transitioning the current state of the event (e.g., waiting, active, paused, concluded), and ensuring all connected parties observe a consistent view of that state.

- **IPO Package Management** — Tracking the available IPO packages, their attributes, and any state changes that occur as the event progresses.

- **Transaction Recording** — Recording and persisting the outcome of completed IPO package allocations during the event.

- **Participant Dashboard Data** — Serving each participant's current holdings, transaction history, and relevant event data required to render their dashboard.

- **Authentication and Authorization** — Verifying the identity of all clients and enforcing role-based access controls to distinguish between organizers and participants, and to restrict actions accordingly.

- **Real-Time Communication** — Pushing live updates to connected clients so that changes in event state, active package information, announcements, and participant portfolio updates are reflected without requiring manual page refreshes.

## 1.3 Out of Scope

This backend is scoped exclusively to the runtime operation of the IPO Round. The following activities are considered pre-event administrative work and are explicitly outside the responsibility of this service:

- **Event Registration** — The process by which participants register to take part in the event.
- **Participant Onboarding** — The setup of participant accounts, profiles, or credentials prior to the event.
- **Team Creation** — The formation and composition of participant teams.
- **Company Creation** — The definition and configuration of companies available within the event.
- **Package Creation** — The creation and configuration of IPO packages available during the event.

These activities are completed before the IPO Round begins. The backend assumes all required event data has already been prepared before runtime.

---

# 2. Technology Stack

## 2.1 Overview

The backend is built on a modern TypeScript stack in which each technology serves a clearly defined responsibility. Dependencies were selected for type safety, maintainability, and operational reliability. The stack avoids unnecessary abstractions, keeping the layer between incoming requests and the database shallow and predictable. All components are actively maintained and widely used in production Node.js services.

## 2.2 Technology Summary

| Category | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 20+ | Executes the server-side JavaScript/TypeScript process. |
| Language | TypeScript 5.9.x | Provides static typing across the entire codebase. |
| Web Framework | Express 5 | Handles HTTP routing, middleware, and request/response lifecycle. |
| ORM | Prisma 6 | Provides a type-safe interface between the application and the PostgreSQL database. |
| Database | PostgreSQL (Supabase) | Persists all event, participant, and transaction data. |
| Authentication | Clerk | Provides identity management and authentication for organizers and participants. |
| Validation | Zod | Validates and parses incoming request data against defined schemas. |
| Logging | Pino | Records structured application logs. |
| Compression | compression | Reduces HTTP response payload sizes via gzip compression. |
| Security Headers | Helmet | Sets HTTP response headers to reduce common web vulnerabilities. |
| CORS | CORS | Controls which origins are permitted to make cross-origin requests. |
| Real-Time Communication | Socket.IO | Manages persistent WebSocket connections for live event updates. |

---

# 3. Project Structure

## 3.1 Directory Tree

```
backend/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── lib/
│   ├── middleware/
│   ├── modules/
│   │   ├── announcement/
│   │   ├── event/
│   │   ├── package/
│   │   ├── team/
│   │   ├── transaction/
│   │   └── user/
│   ├── routes/
│   ├── types/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── package.json
├── tsconfig.json
└── BACKEND_DOCUMENTATION.md
```

## 3.2 Directory Responsibilities

| Directory / File | Responsibility |
|---|---|
| `prisma/` | Contains the Prisma schema and all generated migration files. This is the single source of truth for the database structure. |
| `prisma/migrations/` | Contains the ordered history of database migrations applied to PostgreSQL. |
| `src/config/` | Holds application-level configuration: environment variable validation (`env.ts`) and the logger instance (`logger.ts`). |
| `src/lib/` | Contains shared library singletons. Currently holds the singleton Prisma client instance (`prisma.ts`). |
| `src/middleware/` | Contains Express middleware responsible for authentication, user loading, authorization, request validation, and centralized error handling. |
| `src/modules/` | The primary feature directory. Each subdirectory represents a business domain of the application. As implementation progresses, domain-specific components such as controllers, engines, and repositories are organized within these directories. |
| `src/routes/` | Registers all Express route handlers. The root router (`index.ts`) mounts all domain-specific routes, including the health endpoint (`health.ts`). |
| `src/types/` | Contains TypeScript type augmentations and shared type definitions. Currently holds Express `Request` augmentation (`express.d.ts`). |
| `src/app.ts` | Constructs and configures the Express application instance, registers global middleware, and mounts the root router. |
| `src/server.ts` | Bootstraps the HTTP server and starts the backend application by listening on the configured port. |

---

# 4. High-Level Architecture

## 4.1 Request Pipeline

```
HTTP Request
      ↓
Authentication
      ↓
Load User
      ↓
Authorization
      ↓
Validation
      ↓
Controller
      ↓
Event Engine
      ↓
Repository
      ↓
Prisma
      ↓
PostgreSQL
      ↓
HTTP Response
```

## 4.2 Layer Responsibilities

| Layer | Responsibility |
|---|---|
| Authentication | Verifies the incoming request carries a valid Clerk token. Rejects unauthenticated requests before they proceed further. |
| Load User | Resolves the authenticated Clerk identity to the corresponding user record in the application database and attaches it to the request context. |
| Authorization | Inspects the loaded user's role and rejects any request where the caller does not hold the required permission for the target endpoint. |
| Validation (planned middleware layer) | Responsible for validating incoming request data before it reaches the controller. This layer is part of the backend architecture but is not yet implemented. |
| Controller | Receives the validated, authorized request. Extracts inputs, delegates business logic to the event engine, and forms the HTTP response. |
| Event Engine | Enforces business rules and coordinates operations across multiple repositories. Applies event state constraints and any domain logic. |
| Repository | Encapsulates all data access for a given domain. Constructs and executes Prisma queries; no business logic resides here. |
| Prisma | Translates repository calls into type-safe SQL queries and manages the connection pool to the database. |
| PostgreSQL | Stores and retrieves all persisted data. Hosted on Supabase. |

---
# 5. Database Design

## 5.1 Overview

The database is a single PostgreSQL schema managed entirely through Prisma. All entities are defined in `prisma/schema.prisma` and provisioned via Prisma migrations. The schema models the full data domain required to run the IPO Round: the event itself, the teams and users participating in it, the companies and packages being auctioned, the transactions that record allocation outcomes, and the announcements broadcast during the event.

The schema defines three enumerations that represent the fixed states used throughout the application.

| Enum | Values | Purpose |
|---|---|---|
| `UserRole` | `PRIMARY_ORGANIZER`, `SECONDARY_ORGANIZER`, `PARTICIPANT` | Determines the access level of each user. |
| `EventStatus` | `WAITING`, `IPO_RUNNING`, `IPO_PAUSED`, `IPO_COMPLETED` | Represents the current phase of the event. |
| `PackageStatus` | `NOT_REVEALED`, `ACTIVE`, `SOLD`, `UNSOLD` | Represents the lifecycle state of each IPO package. |

## 5.2 Entity Descriptions

### Event

The `Event` entity represents a single instance of the IPO Round. It holds the current status of the event and a reference to the package that is currently active for bidding. Only one package may be active at a time, enforced by a unique constraint on the `activePackageId` field. The event record is the central state object that organizers manage throughout the round.

### Team

The `Team` entity represents a participant group. It holds the team's name and its current remaining cash balance. The cash balance decreases as the team successfully acquires packages. A team owns zero or more packages and is the subject of all transaction records.

### User

The `User` entity represents an individual registered for the event. Each user is linked to a Clerk identity via a unique `clerkId`, which is the bridge between the external authentication provider and the application database. A user carries a `role` that governs their access rights. Organizer users do not belong to a team. Participant users are optionally associated with a `Team`.

### Company

The `Company` entity represents a company that exists within the event's simulated market. Each company has a name, sector, description, optional logo, and an initial share price. Companies do not exist in isolation — they are constituents of IPO packages via the `PackageCompany` junction.

### Package

The `Package` entity represents an IPO lot available for bidding during the event. Each package has a base price, a lifecycle status, and an optional `winningBid` and `ownerTeamId` that are populated once the package is sold. A package references the team that won it and the transaction that recorded the allocation. The `Event` entity points to the currently active package.

### PackageCompany

`PackageCompany` is a junction entity that models the many-to-many relationship between `Package` and `Company`. A single package can contain shares in multiple companies. The schema models this relationship using a dedicated junction entity that associates each company with its package and records the corresponding number of shares. Each record in this table specifies the number of `shares` of a given company that belong to a given package. This intermediate entity exists because a direct many-to-many relation between `Package` and `Company` cannot carry the additional `shares` attribute without a dedicated join table.

### Transaction

The `Transaction` entity records the permanent outcome of a successful package allocation. It captures which team acquired the package, at what winning bid price, and which organizer recorded the transaction. A package can have at most one transaction, enforced by a unique constraint on `packageId`. Each transaction records the outcome of a completed package allocation and serves as the historical record of that allocation.

### Announcement

The `Announcement` entity stores messages broadcast to all participants during the event. Each announcement records the message content, the organizer who authored it, and the time it was created. Announcements are ordered by creation time for chronological display.

## 5.3 Relationship Summary

| Entity | Relationships |
|---|---|
| `Event` | References one optional `Package` as the currently active package. |
| `Team` | Has many `User` members. Has many owned `Package` records. Has many `Transaction` records. |
| `User` | Belongs to one optional `Team`. Has many authored `Announcement` records. Has many `Transaction` records as organizer. |
| `Company` | Participates in many packages through `PackageCompany`. |
| `Package` | Belongs to one optional owner `Team`. Has many `PackageCompany` entries. Has at most one `Transaction`. May be referenced by `Event` as the active package. |
| `PackageCompany` | Joins `Package` and `Company`; carries the `shares` attribute for that pairing. |
| `Transaction` | Belongs to one `Team`, one `Package`, and one organizer `User`. |
| `Announcement` | Belongs to one author `User`. |

## 5.4 The PackageCompany Junction Table

`PackageCompany` exists as an explicit junction table rather than an implicit many-to-many join because the relationship between a package and a company carries domain-specific data: the number of shares of that company included in the package. Prisma does not support attributes on implicit many-to-many relations. By promoting the join to a named model with a composite primary key of `(packageId, companyId)`, the schema cleanly expresses that each package–company pairing is unique and carries its own `shares` value.

---

# 6. Authentication & Authorization

## 6.1 Overview

All protected routes in the backend require a valid Clerk-issued token. Authentication and authorization are enforced through a chain of three middleware functions applied before any controller receives a request. The pipeline ensures that before the request reaches the application layer, the caller has been positively identified, their application record has been loaded, and their role has been verified against the route's requirements.

## 6.2 Authentication & Authorization Pipeline

```
Client
    ↓
Clerk Authentication
    ↓
authenticate Middleware
    ↓
loadUser Middleware
    ↓
authorize Middleware
    ↓
Controller
```

## 6.3 Pipeline Stages

**Client**
The client obtains a session token from Clerk and attaches it as a bearer token in the `Authorization` header of each HTTP request.

**Clerk Authentication**
The Clerk SDK (`clerkMiddleware`) parses the incoming request and validates the session token. The result of this verification is made available to subsequent middleware via `getAuth(req)`.

**`authenticate` Middleware**
The `authenticate` middleware calls `getAuth(req)` and inspects the resolved `userId`. If no valid `userId` is present — meaning the token was absent, expired, or invalid — the middleware immediately returns `401 Unauthorized` and halts the pipeline. If a `userId` is present, the request proceeds.

**`loadUser` Middleware**
The `loadUser` middleware takes the verified Clerk `userId` (`clerkId`) and queries the application database for a matching `User` record. If no record is found, the caller is authenticated with Clerk but is not registered as a participant or organizer in this event; the middleware returns `403 Forbidden`. If a matching record is found, the user's `id`, `clerkId`, `role`, `teamId`, `name`, and `email` are attached to `req.user` for use by downstream middleware and controllers.

**`authorize` Middleware**
The `authorize` middleware is a factory function that accepts one or more `UserRole` values. It inspects `req.user.role` and checks whether it is included in the permitted roles. If the role does not match, the middleware returns `403 Forbidden`. If the role matches, the request is passed to the controller.

**Controller**
By this point the request is fully authenticated and authorized. The controller receives `req.user` pre-populated and may proceed with business logic without performing any additional identity checks.

## 6.4 HTTP Error Responses

| Status Code | Condition |
|---|---|
| `401 Unauthorized` | The request does not carry a valid Clerk session token. The token is absent, malformed, or expired. |
| `403 Forbidden` | The caller is successfully authenticated with Clerk but either (a) does not have a corresponding user record in the application database — i.e., is not registered for this event — or (b) holds a role that is not permitted to access the requested endpoint. |


# 7. Request Lifecycle

## 7.1 Overview

This section describes the lifecycle of a protected HTTP request as it flows through the backend middleware pipeline and into the application layer. `POST /event/start` is used as a reference example solely to illustrate the sequence of steps. No business logic of that endpoint is described here.

## 7.2 Lifecycle Stages

**1. Incoming Request**
The client sends an HTTP request to the backend. The request arrives at the Express application and enters the global middleware stack registered in `app.ts`.

**2. Authentication**
The `auth` middleware extracts the bearer token from the `Authorization` header and verifies it with Clerk. If the token is absent, expired, or invalid, the middleware terminates the request with a `401 Unauthorized` response before any further processing occurs.

**3. Load User**
The `loadUser` middleware uses the verified Clerk identity (the `clerkId`) to look up the corresponding user record in the PostgreSQL database via the Prisma client. The resolved user object is attached to the Express `Request` for use by downstream middleware and controllers. If no matching record is found, a `403 Forbidden` response is returned.

**4. Authorization**
The `authorize` middleware inspects the role on the loaded user object and compares it against the role required by the route. If the caller's role does not satisfy the requirement, the request is terminated with a `403 Forbidden` response.

**5. Validation**
The validation layer applies the Zod schema associated with the route to the request body, query parameters, and route parameters. If validation fails, a `400 Bad Request` response is returned with a structured description of each validation error. The validation layer is responsible for ensuring that incoming request data conforms to the schema defined for the endpoint. Invalid requests are rejected before reaching the controller. This layer is planned but has not yet been implemented. 

**6. Controller**
The route handler (controller) receives a fully authenticated, authorized, and validated request. It extracts the required inputs and delegates the operation to the appropriate event engine function. The controller does not contain business logic.

**7. Event Engine**
The event engine enforces domain rules and coordinates the operation. It applies any event state constraints and orchestrates calls across one or more repositories.

**8. Repository**
The repository constructs and executes the necessary Prisma queries to read from or write to the database. It returns plain data objects to the engine.

**9. Database**
Prisma transmits the query to PostgreSQL (Supabase) and returns the result to the repository.

**10. Response**
The result propagates back through the engine and controller. The controller serializes the response and sends the appropriate HTTP status code and JSON body to the client.

---

# 8. Implemented APIs

## 8.1 Endpoint Reference

The following table lists all currently implemented HTTP endpoints. Endpoints will be added to this table as business features are completed.

| Method | Endpoint | Authentication Required | Description |
|---|---|---|---|
| GET | `/health` | No | Returns the current backend health status. |

---

