# Frontend Integration Guide

## 1. Purpose

**Purpose of this document:** This document is the definitive integration contract for the frontend applications (Organizer and Participant). It provides all necessary details to consume the backend APIs and Socket.IO events.

**Intended Audience:** Frontend engineers and frontend AI agents building the user interfaces.

**Relationship with BACKEND.md:** While `BACKEND.md` describes *how* the backend works internally, this document describes *what* the backend exposes. The backend is considered **feature frozen**.

**Core Principles:**
- **Backend is the single source of truth.**
- Frontend renders backend state.
- Frontend must **not** duplicate business logic.
- Frontend must **not** infer state.
- Frontend must **not** invent values.
- Frontend must **not** calculate statistics (e.g., capture rate, total investment, averages).
- Frontend must **not** determine package ownership.
- Frontend **only** presents backend data exactly as provided.

## 2. Authentication

The backend utilizes **Clerk** for authentication.

- **Authentication Method:** The frontend must use Clerk's client SDKs to handle user sign-in and session management.
- **Authorization Header:** Every authenticated request must include the JWT token in the `Authorization` header as a Bearer token:
  `Authorization: Bearer <clerk_jwt_token>`
- **JWT Usage:** The JWT is automatically generated and managed by Clerk.
- **Authenticated Routes:** Almost all routes require authentication. The only exception is the `/health` check.
- **Role-Based Access:** The backend natively enforces roles (`PRIMARY_ORGANIZER`, `SECONDARY_ORGANIZER`, `PARTICIPANT`). The backend determines this role from its internal database, mapped via the Clerk ID.
- **Handling 401 Unauthorized:** If the backend returns `401`, the JWT is missing, invalid, or expired. The frontend should redirect the user to the Clerk sign-in flow.
- **Handling 403 Forbidden:** If the backend returns `403`, the authenticated user is either not registered in the event database or lacks the required role for the endpoint. The frontend should display a "Permission Denied" or "Not Registered" empty state.

## 3. API Conventions

- **Base URL Assumption:** The frontend should be configured with a configurable base URL (e.g., `process.env.NEXT_PUBLIC_API_URL`) pointing to the backend.
- **JSON Request Format:** All `POST` requests require `Content-Type: application/json`.
- **JSON Response Format:** All endpoints return JSON payloads.
- **Success Responses:** Successful operations return `200 OK` with the requested data or a confirmation message.
- **Error Responses:** Errors return a JSON payload with a `message` string detailing the failure.
- **Expected Error Response Structure:**
  ```json
  {
    "message": "Package already active."
  }
  ```
- **HTTP Status Codes:**
  - `200 OK`: Success.
  - `400 Bad Request`: Validation failure on request body.
  - `401 Unauthorized`: Authentication failure.
  - `403 Forbidden`: Authorization failure (role/registration).
  - `404 Not Found`: Target resource does not exist.
  - `409 Conflict`: Business rule violation (e.g., event not running).
  - `500 Internal Server Error`: Unexpected backend failure.

## 4. Endpoint Reference

*(Note: Roles are denoted as `ORGANIZERS` for Primary/Secondary Organizers, and `ALL` for Organizers + Participants).*

### Health
**GET `/health`**
- **Purpose:** Check if the API is responsive.
- **Authentication:** None required.
- **Response:**
  ```json
  {
    "status": "ok",
    "service": "backend",
    "timestamp": "2026-07-17T09:00:00.000Z"
  }
  ```
  - `status` (string): Always "ok" if reachable.
  - `service` (string): Always "backend".
  - `timestamp` (string): ISO 8601 date string of server time.

### Auth
**GET `/auth/me`**
- **Purpose:** Fetch the profile and role of the currently logged-in user.
- **Authentication:** Required.
- **Allowed Roles:** `ALL`
- **Response:**
  ```json
  {
    "user": {
      "id": "cuid_xyz",
      "clerkId": "user_xyz",
      "role": "PARTICIPANT",
      "teamId": "cuid_team",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
  ```
  - `id` (string): Backend primary key.
  - `clerkId` (string): Identity provider ID.
  - `role` (string): `PRIMARY_ORGANIZER`, `SECONDARY_ORGANIZER`, or `PARTICIPANT`.
  - `teamId` (string | null): The team ID if assigned, otherwise null.
  - `name` (string): User's full name.
  - `email` (string): User's email.

### Event
**GET `/event/`**
- **Purpose:** Retrieve the current status of the event and the ID of the active package.
- **Authentication:** Required.
- **Allowed Roles:** `ALL`
- **Response:**
  ```json
  {
    "status": "WAITING",
    "activePackageId": null
  }
  ```
  - `status` (string): `WAITING`, `IPO_RUNNING`, `IPO_PAUSED`, or `IPO_COMPLETED`.
  - `activePackageId` (string | null): ID of the currently active package up for auction, or null if none.

**POST `/event/start`**
- **Purpose:** Transition the event from WAITING to IPO_RUNNING.
- **Authentication:** Required.
- **Allowed Roles:** `ORGANIZERS`
- **Response:**
  ```json
  {
    "message": "Event started."
  }
  ```
- **Possible Errors:** `409 Conflict` if the event is already running or completed.

**POST `/event/pause`**
- **Purpose:** Transition the event from IPO_RUNNING to IPO_PAUSED.
- **Authentication:** Required.
- **Allowed Roles:** `ORGANIZERS`
- **Response:**
  ```json
  {
    "message": "Event paused."
  }
  ```
- **Possible Errors:** `409 Conflict` if the event is not running.

**POST `/event/resume`**
- **Purpose:** Transition the event from IPO_PAUSED back to IPO_RUNNING.
- **Authentication:** Required.
- **Allowed Roles:** `ORGANIZERS`
- **Response:**
  ```json
  {
    "message": "Event resumed."
  }
  ```
- **Possible Errors:** `409 Conflict` if the event is not paused.

**POST `/event/complete`**
- **Purpose:** Transition the event to IPO_COMPLETED, finalizing the auction.
- **Authentication:** Required.
- **Allowed Roles:** `ORGANIZERS`
- **Response:**
  ```json
  {
    "message": "Event completed."
  }
  ```
- **Possible Errors:** `409 Conflict` if a package is still currently active.

### Packages
**GET `/packages/`**
- **Purpose:** Fetch all packages in the system regardless of status.
- **Authentication:** Required.
- **Allowed Roles:** `ALL`
- **Response:**
  ```json
  [
    {
      "id": "cuid_pkg",
      "name": "Package Alpha",
      "description": "Tech starter pack",
      "basePrice": 1000,
      "status": "NOT_REVEALED",
      "winningBid": null,
      "ownerTeamId": null,
      "createdAt": "2026-07-17T09:00:00.000Z",
      "updatedAt": "2026-07-17T09:00:00.000Z"
    }
  ]
  ```
  - `id` (string): Package ID.
  - `name` (string): Package name.
  - `description` (string | null): Description text.
  - `basePrice` (number): Minimum bid allowed.
  - `status` (string): `NOT_REVEALED`, `ACTIVE`, `SOLD`, or `UNSOLD`.
  - `winningBid` (number | null): The final sale price, populated only if SOLD.
  - `ownerTeamId` (string | null): The winning team ID, populated only if SOLD.
  - `createdAt` (string): ISO 8601 creation timestamp.
  - `updatedAt` (string): ISO 8601 update timestamp.

> **Note:** `GET /packages/` returns lightweight package summaries — scalar fields only, with no company data. To retrieve the full company composition of a specific package, use `GET /packages/:id`.


**GET `/packages/active`**
- **Purpose:** Fetch the details of the currently active package up for auction.
- **Authentication:** Required.
- **Allowed Roles:** `ALL`
- **Response:**
  ```json
  {
    "id": "cuid_pkg",
    "name": "Package Alpha",
    "description": "Tech starter pack",
    "basePrice": 1000,
    "status": "ACTIVE",
    "winningBid": null,
    "ownerTeamId": null,
    "createdAt": "2026-07-17T09:00:00.000Z",
    "updatedAt": "2026-07-17T09:00:00.000Z"
  }
  ```
- **Possible Errors:** `404 Not Found` if no package is currently active.

**GET `/packages/:id`**
- **Purpose:** Fetch the complete details of a specific package, including all companies it contains.
- **Authentication:** Required.
- **Allowed Roles:** `ALL`
- **Path Parameters:** `id` (string)
- **Response:**
  ```json
  {
    "id": "cuid_pkg",
    "name": "Package Alpha",
    "description": "Tech starter pack",
    "basePrice": 1000,
    "status": "NOT_REVEALED",
    "winningBid": null,
    "ownerTeamId": null,
    "createdAt": "2026-07-17T09:00:00.000Z",
    "updatedAt": "2026-07-17T09:00:00.000Z",
    "companies": [
      {
        "id": "cuid_co_1",
        "name": "Tech Corp",
        "sector": "Technology",
        "description": "A leading technology company.",
        "logo": "https://example.com/logos/techcorp.png",
        "initialPrice": 500,
        "shares": 200
      },
      {
        "id": "cuid_co_2",
        "name": "Bank Inc",
        "sector": "Finance",
        "description": "A major financial institution.",
        "logo": null,
        "initialPrice": 300,
        "shares": 150
      }
    ]
  }
  ```
  All standard package scalar fields are returned unchanged:
  - `id` (string): Package ID.
  - `name` (string): Package name.
  - `description` (string | null): Description text.
  - `basePrice` (number): Minimum bid allowed.
  - `status` (string): `NOT_REVEALED`, `ACTIVE`, `SOLD`, or `UNSOLD`.
  - `winningBid` (number | null): The final sale price, populated only if SOLD.
  - `ownerTeamId` (string | null): The winning team ID, populated only if SOLD.
  - `createdAt` (string): ISO 8601 creation timestamp.
  - `updatedAt` (string): ISO 8601 update timestamp.

  Additionally, a `companies` array is appended. Each object in the array contains:
  - `id` (string): Company ID.
  - `name` (string): Company name.
  - `sector` (string): Industry sector the company belongs to.
  - `description` (string): Company description text.
  - `logo` (string | null): URL of the company logo, or null if not set.
  - `initialPrice` (number): The company's initial share price.
  - `shares` (number): Number of shares of this company included in the package (sourced from the join table).

> **Note:** The `companies` array is embedded directly in this response. The frontend does **not** need to make any additional API request to retrieve the companies belonging to a package.
- **Possible Errors:** `404 Not Found` if the package does not exist.


**POST `/packages/:id/activate`**
- **Purpose:** Set a package as the active auction item.
- **Authentication:** Required.
- **Allowed Roles:** `ORGANIZERS`
- **Path Parameters:** `id` (string)
- **Response:**
  ```json
  {
    "message": "Package activated."
  }
  ```
- **Possible Errors:** `409 Conflict` if event is not running, package is not NOT_REVEALED, or another package is already active.

**POST `/packages/:id/unsold`**
- **Purpose:** Discard the currently active package without a winner.
- **Authentication:** Required.
- **Allowed Roles:** `ORGANIZERS`
- **Path Parameters:** `id` (string)
- **Response:**
  ```json
  {
    "message": "Package marked as unsold."
  }
  ```
- **Possible Errors:** `409 Conflict` if the package is not ACTIVE.

### Transactions
**POST `/transactions/`**
- **Purpose:** Record a successful package sale to a team.
- **Authentication:** Required.
- **Allowed Roles:** `ORGANIZERS`
- **Request Body:** 
  ```json
  {
    "packageId": "cuid_pkg",
    "teamId": "cuid_team",
    "winningBid": 1500
  }
  ```
- **Validation Rules:** `packageId` and `teamId` must not be empty. `winningBid` must be a positive integer.
- **Response:**
  ```json
  {
    "message": "Transaction recorded successfully."
  }
  ```
- **Possible Errors:** `409 Conflict` for a multitude of business rules: event not running, package not active, bid lower than base price, team has insufficient cash, or package is not the active package on the event.

### Announcements
**GET `/announcements/`**
- **Purpose:** Fetch all global announcements.
- **Authentication:** Required.
- **Allowed Roles:** `ALL`
- **Response:**
  ```json
  [
    {
      "id": "cuid_announcement",
      "message": "Auction will resume in 5 minutes.",
      "createdAt": "2026-07-17T09:00:00.000Z",
      "author": {
        "id": "cuid_author",
        "name": "Jane Smith"
      }
    }
  ]
  ```
  - `id` (string): Announcement ID.
  - `message` (string): The broadcast message.
  - `createdAt` (string): ISO 8601 timestamp.
  - `author` (object): Contains `id` and `name` of the user who posted it.

**POST `/announcements/`**
- **Purpose:** Create a new global announcement.
- **Authentication:** Required.
- **Allowed Roles:** `ORGANIZERS`
- **Request Body:**
  ```json
  {
    "message": "Auction will resume in 5 minutes."
  }
  ```
- **Validation Rules:** `message` cannot be empty, max 500 characters.
- **Response:**
  ```json
  {
    "message": "Announcement created."
  }
  ```

### Dashboards & Participants
**GET `/dashboard/live`**
- **Purpose:** Provide the Organizer with a global snapshot of the event, all teams, and package states.
- **Authentication:** Required.
- **Allowed Roles:** `ORGANIZERS`
- **Response:**
  ```json
  {
    "event": {
      "status": "IPO_RUNNING",
      "activePackageId": "cuid_pkg_active"
    },
    "availablePackages": [
      {
        "id": "cuid_pkg_1",
        "name": "Package Alpha"
      }
    ],
    "unsoldPackages": [],
    "soldPackages": [
      {
        "id": "cuid_pkg_2",
        "name": "Package Beta"
      }
    ],
    "teams": [
      {
        "id": "cuid_team_1",
        "name": "Team One",
        "remainingCash": 8500
      }
    ]
  }
  ```
  - `event.status` (string): Current event state.
  - `event.activePackageId` (string | null): The active package.
  - `availablePackages`, `unsoldPackages`, `soldPackages` (array of objects): Simplified package summaries containing only `id` and `name` to populate lists.
  - `teams` (array of objects): Contains `id`, `name`, and `remainingCash`.

**GET `/teams/:id`**
- **Purpose:** Provide the Organizer with detailed information about a specific team's history.
- **Authentication:** Required.
- **Allowed Roles:** `ORGANIZERS`
- **Path Parameters:** `id` (string)
- **Response:**
  ```json
  {
    "id": "cuid_team_1",
    "name": "Team One",
    "remainingCash": 8500,
    "members": [
      {
        "id": "cuid_user_1",
        "name": "Alice"
      }
    ],
    "ownedPackages": [
      {
        "id": "cuid_pkg_2",
        "name": "Package Beta"
      }
    ],
    "purchaseHistory": [
      {
        "package": {
          "id": "cuid_pkg_2",
          "name": "Package Beta"
        },
        "winningBid": 1500,
        "createdAt": "2026-07-17T09:10:00.000Z"
      }
    ]
  }
  ```
  - `members` (array of objects): Users belonging to the team (contains `id` and `name`).
  - `ownedPackages` (array of objects): Simplified package summaries (contains `id` and `name`).
  - `purchaseHistory` (array of objects): Historical transactions ordered newest to oldest, returning the `package` (with `id` and `name`), `winningBid`, and `createdAt` timestamp.

**GET `/participant/team-console`**
- **Purpose:** Provide a deeply aggregated statistical view of the participant's team portfolio and history.
- **Authentication:** Required.
- **Allowed Roles:** `PARTICIPANT`
- **Response:**
  ```json
  {
    "portfolio": {
      "cashBalance": 8500,
      "packagesWon": 1,
      "companiesOwned": 2,
      "totalShares": 1500,
      "totalInvestment": 1500,
      "investmentUtilized": 15,
      "cashRemaining": 8500,
      "holdingsBySector": [
        { "sector": "Tech", "shares": 1000 },
        { "sector": "Finance", "shares": 500 }
      ],
      "companyHoldings": [
        { "company": "Tech Corp", "shares": 1000 },
        { "company": "Bank Inc", "shares": 500 }
      ]
    },
    "transactions": [
      {
        "package": {
          "id": "cuid_pkg_2",
          "name": "Package Beta"
        },
        "winningBid": 1500,
        "createdAt": "2026-07-17T09:10:00.000Z"
      }
    ],
    "statistics": {
      "packagesAuctioned": 1,
      "packagesWon": 1,
      "captureRate": 100,
      "highestWinningBid": 1500,
      "averageWinningBid": 1500,
      "companiesOwned": 2,
      "totalShares": 1500,
      "investmentUtilized": 15,
      "cashRemaining": 8500,
      "portfolioAllocation": [
        { "sector": "Tech", "shares": 1000 },
        { "sector": "Finance", "shares": 500 }
      ]
    }
  }
  ```
  - `portfolio.cashBalance` (number): Current team balance.
  - `portfolio.packagesWon` (number): Total packages bought.
  - `portfolio.companiesOwned` (number): Unique companies owned across packages.
  - `portfolio.totalShares` (number): Sum of all shares.
  - `portfolio.totalInvestment` (number): Sum of all winning bids.
  - `portfolio.investmentUtilized` (number): Percentage of derived starting cash (0-100).
  - `portfolio.cashRemaining` (number): Duplicate of cash balance.
  - `portfolio.holdingsBySector` (array): Shares aggregated by company sector.
  - `portfolio.companyHoldings` (array): Shares aggregated by company name.
  - `transactions` (array): Exact same structure as `TeamDetail.purchaseHistory`.
  - `statistics` (object): Deep statistical aggregates for dashboard rendering. `captureRate` and `investmentUtilized` are percentages (0-100). `portfolioAllocation` matches `holdingsBySector`.
- **Possible Errors:** `403 Forbidden` if the user is not assigned to a team.

**GET `/participant/dashboard`**
- **Purpose:** Provide a lighter, live view of the participant's team metrics and event status.
- **Authentication:** Required.
- **Allowed Roles:** `PARTICIPANT`
- **Response:**
  ```json
  {
    "event": {
      "status": "IPO_RUNNING",
      "activePackageId": "cuid_pkg_active"
    },
    "statistics": {
      "remainingCash": 8500,
      "packagesWon": 1,
      "packagesAuctioned": 1,
      "captureRate": 100,
      "totalInvestment": 1500,
      "highestWinningBid": 1500
    }
  }
  ```
  - `event` (object): Current event state and active package ID.
  - `statistics` (object): Top-level metrics. `captureRate` is a percentage (0-100).
- **Possible Errors:** `403 Forbidden` if the user is not assigned to a team.

## 5. Endpoint Behaviour

- **`GET /dashboard/live`**: Represents the "Control Room" for the organizer. It avoids returning full package details, returning only ID and Name arrays grouped by status to quickly populate lists. The frontend should display these lists and track team cash balances in real-time.
- **`GET /participant/dashboard`**: A lightweight heads-up display (HUD) for the participant. It returns the current event status (so the frontend knows if an auction is running) and basic financial statistics. All capture rates and totals are pre-calculated by the backend. The frontend must simply bind these variables to UI widgets.
- **`GET /participant/team-console`**: An intensive, deep-dive portfolio view. The backend iterates through all nested associations to group the team's acquired companies by sector and calculates their total market exposure (`holdingsBySector`, `companyHoldings`). The frontend must use this exact data to render charts (e.g., a Sector Allocation Pie Chart).

## 6. Socket.IO Integration

Socket.IO is used exclusively to notify the frontend that state has changed on the backend. 

**CRITICAL NOTE:** The backend emits signals **WITHOUT PAYLOADS**. When the frontend receives a socket event, it must react by making standard HTTP `GET` requests to refresh its data.

- **Connection:** Connect to the base backend URL.
- **Rooms:** All connected sockets automatically join the global `event` room on the backend. No explicit join request is required by the frontend.

### Events

| Event Name | Payload | When Emitted | Reacting Screens |
| :--- | :--- | :--- | :--- |
| `eventStarted` | None | Event transitions to `IPO_RUNNING`. | Organizer Dashboard, Participant HUD |
| `eventPaused` | None | Event transitions to `IPO_PAUSED`. | Organizer Dashboard, Participant HUD |
| `eventResumed` | None | Event transitions to `IPO_RUNNING` from `IPO_PAUSED`. | Organizer Dashboard, Participant HUD |
| `eventEnded` | None | Event transitions to `IPO_COMPLETED`. | All Screens (triggers end-of-event UI) |
| `packageActivated` | None | An organizer sets a package to active. | Active Package Screen, Dashboards |
| `packageSold` | None | An organizer records a sale. | Dashboards, Team Console |
| `packageUnsold` | None | An organizer discards a package. | Dashboards |
| `announcementCreated`| None | An organizer posts a message. | Global notification toaster |

*Example Frontend Reaction Flow:*
1. Frontend listens for `packageActivated`.
2. Socket receives `packageActivated`.
3. Frontend fires `GET /packages/active` and `GET /dashboard/live`.
4. Frontend updates React state with new data.

## 7. Screen → API Mapping

| Screen / Feature | Primary Endpoints | Relevant Socket Events |
| :--- | :--- | :--- |
| **Organizer Control Room** | `GET /dashboard/live`<br>`GET /event/` | `eventStarted`, `eventPaused`, `eventResumed`, `eventEnded`, `packageActivated`, `packageSold`, `packageUnsold` |
| **Organizer Package Management**| `GET /packages/`<br>`POST /packages/:id/activate`<br>`POST /packages/:id/unsold`<br>`POST /transactions/` | `packageActivated`, `packageSold`, `packageUnsold` |
| **Participant HUD** | `GET /participant/dashboard`<br>`GET /packages/active` | `eventStarted`, `eventPaused`, `eventEnded`, `packageActivated`, `packageSold`, `packageUnsold` |
| **Participant Portfolio** | `GET /participant/team-console` | `packageSold` |
| **Global UI (Announcements)**| `GET /announcements/` | `announcementCreated` |

## 8. Frontend Responsibilities

### What frontend SHOULD do:
- **Render State:** Bind UI components strictly to the JSON values returned by the backend APIs.
- **Loading States:** Display spinners or skeletons while HTTP requests are in flight.
- **Empty States:** Render friendly messages when arrays are empty (e.g., "No active package", "No transactions yet").
- **Error States:** Display toaster notifications or inline errors using the `message` string returned in 4xx/5xx responses.
- **Realtime Updates:** Bind Socket.IO listeners in global contexts (or top-level React hooks) to trigger React Query/SWR invalidations.

### What frontend SHOULD NOT do:
- **Never calculate statistics:** Do not attempt to calculate `captureRate`, `investmentUtilized`, or sector groupings on the client. Always use the backend's `statistics` payload.
- **Never infer state:** Do not assume a package is sold just because a transaction was submitted. Wait for the `200 OK` response or the `packageSold` socket event before updating the UI.
- **Never duplicate business rules:** Do not hardcode rules like "minimum bid is X" or "you must have Y cash". Send the user's input to the backend and let the backend return a `409 Conflict` if the rule is violated. Display that error message to the user.
- **No Optimistic UI for Bidding:** Because this is a financial/auction system with strict concurrency rules, optimistic UI updates for transactions are forbidden. A transaction must be confirmed by the backend before the UI reflects the cash deduction or ownership change.

## 9. UI Data Ownership

### Computed strictly by Backend
- Capture Rate.
- Total Investment and Investment Utilized percentage.
- Remaining Cash (deductions).
- Sector groupings and share counts.
- Event status transitions.

### Rendered/Handled by Frontend
- Sorting arrays (e.g., sorting the `availablePackages` alphabetically or by base price, if not already sorted).
- Formatting currency numbers (e.g., formatting `1000` as `$1,000` or `1,000 MC`).
- Displaying UI badges based on `status` strings (e.g., mapping `IPO_RUNNING` to a pulsing green indicator).
- Responsive layouts and animations.

## 10. Error Handling

- **400 Bad Request:** Form validation failure (e.g., string instead of number). The frontend should highlight the invalid input field.
- **401 Unauthorized:** Session expired. The frontend must log the user out and redirect to Clerk sign-in.
- **403 Forbidden:** User is not allowed here. The frontend should hide the route and display a "Permission Denied" boundary.
- **404 Not Found:** A specific entity was not found (e.g., fetching a package ID that doesn't exist). The frontend should render a 404 UI component.
- **409 Conflict:** Business rule violation. The backend explicitly returns a human-readable `message` (e.g., "Team does not have sufficient remaining cash."). The frontend MUST display this exact message to the user in a toast or error alert.
- **500 Internal Server Error:** System failure. Display a generic "Something went wrong" message.

## 11. Integration Checklist

A frontend engineer should ensure the following before considering a feature complete:

- [ ] **Authentication:** Clerk provider is wrapping the app; JWT is successfully attached to `Authorization` header on all API calls.
- [ ] **API Integration:** All HTTP methods align with the documented routes (e.g., using `POST` for activations, not `PUT`).
- [ ] **Data Binding:** UI uses exactly the JSON responses documented in Section 4. No undefined fields are being accessed.
- [ ] **Socket Integration:** A singleton Socket.IO client connects on app mount. Listeners trigger API re-fetches rather than mutating local state manually.
- [ ] **Loading States:** Every async action (fetch, submit) has a visual loading indicator.
- [ ] **Empty States:** Graceful fallbacks exist for `null` active packages and empty arrays.
- [ ] **Error States:** `409 Conflict` messages from the backend are displayed directly to the user.
- [ ] **Permission Handling:** Role-based routing is enforced on the frontend to match backend roles, hiding Organizer screens from Participants.
- [ ] **Realtime Verification:** When multiple browser windows are open, an action in window A updates the state in window B automatically via Socket invalidations.
- [ ] **Responsive Testing:** UI handles varying data lengths gracefully (e.g., a team buying 50 packages).
