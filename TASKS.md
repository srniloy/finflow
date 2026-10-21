# FinFlow Frontend — Task Plan

> Single source of truth for build order. Derived from `FRONTEND-FEATURES.md`.
> Command format: `do Txx` — implement, run build/lint, tick status + DoD, stop.

---

## How this works

- One task = one command = one reviewable diff.
- Every task must end **green**: `ng build` and `ng lint` pass, app still runs.
- Never start a task whose dependencies are not `done`.
- After each task: update **Status** below and tick its DoD checkboxes.
- If a task proves too large mid-way, split it (e.g. `T11a`/`T11b`) and note it.

**Status legend:** `todo` | `doing` | `done` | `blocked`

---

## Task board

| ID  | Task                                | Depends on | Status |
| --- | ----------------------------------- | ---------- | ------ |
| T00 | Scaffold workspace                  | —          | done   |
| T01 | Typed models                        | T00        | todo   |
| T02 | TokenStorageService + AuthService   | T01        | todo   |
| T03 | authInterceptor                     | T02        | todo   |
| T04 | ToastService + errorInterceptor     | T00        | todo   |
| T05 | loadingInterceptor + global spinner | T00        | todo   |
| T06 | authGuard + noAuthGuard             | T02        | todo   |
| T07 | Routing skeleton + shell + theme    | T06        | todo   |
| T08 | Auth feature (login/register)       | T07        | todo   |
| T09 | Dashboard                           | T08        | todo   |
| T10 | Accounts (list/detail/create/block) | T09        | todo   |
| T11 | Transactions: transfer + confirm    | T10        | todo   |
| T12 | OTP verification + polling          | T11        | todo   |
| T13 | Transaction history                 | T11        | todo   |
| T14 | Transaction detail + timeline       | T13        | todo   |
| T15 | Deposit + withdrawal                | T11        | todo   |
| T16 | Payments (Razorpay add-money)       | T09        | todo   |
| T17 | Notifications + header bell         | T09        | todo   |
| T18 | Profile + settings                  | T08        | todo   |
| T19 | Polish: responsive, a11y, dark mode | T10–T18    | todo   |
| T20 | Unit tests + README                 | T19        | todo   |

---

## Task details

### T00 — Scaffold workspace

- **Deliverables:** `ng new` (standalone components, routing, CSS), Angular Material, ESLint + Prettier, `src/environments/environment.ts` + `environment.prod.ts`, feature-first folder skeleton (`core/`, `shared/`, `features/`, `layout/`).
- **DoD:**
  - [x] `ng serve` renders a running app
  - [x] `ng lint` and `ng build` clean
  - [x] Environment files exist with `apiBaseUrl` + `razorpayKeyId`
  - [x] Folder structure matches §0.1 of the spec

### T01 — Typed models

- **Deliverables:** interfaces in `core/models/` — `account`, `transaction`, `payment`, `auth`, `notification` (§1.2). Includes `PagedResponse<T>`.
- **DoD:**
  - [ ] All model files compile
  - [ ] No `any` anywhere in models
  - [ ] Field names match backend DTOs (see §4 API contract)

### T02 — TokenStorageService + AuthService

- **Deliverables:** `TokenStorageService` (sessionStorage), typed `AuthService` with login/register/logout/current-user.
- **DoD:**
  - [ ] API URLs come from environment, not hardcoded
  - [ ] Service is unit-testable (HTTP injected)
  - [ ] Token never logged

### T03 — authInterceptor

- **Deliverables:** functional interceptor attaching `Authorization: Bearer <token>`; on `401` clears session and redirects to `/login`.
- **DoD:**
  - [ ] Token attached to outgoing requests
  - [ ] 401 clears session + redirects
  - [ ] No infinite redirect loop on login route

### T04 — ToastService + errorInterceptor

- **Deliverables:** `ToastService` wrapping `MatSnackBar`; functional error interceptor mapping `400/401/403/404/409/500` to messages; parses `{ timestamp, status, error, message }`.
- **DoD:**
  - [ ] Errors surface as snackbars
  - [ ] Error re-thrown for component-level handling
  - [ ] No silent failures

### T05 — loadingInterceptor + global spinner

- **Deliverables:** functional interceptor tracking in-flight requests with debounce; global spinner component.
- **DoD:**
  - [ ] Spinner shows on slow calls, hides when done
  - [ ] Debounce prevents flicker
  - [ ] Concurrent requests tracked correctly (counter)

### T06 — authGuard + noAuthGuard

- **Deliverables:** functional `authGuard` (→ `/login`) and `noAuthGuard` (→ `/dashboard`).
- **DoD:**
  - [ ] Protected routes blocked when unauthenticated
  - [ ] Auth routes blocked when authenticated
  - [ ] Redirect targets correct

### T07 — Routing skeleton + shell + theme

- **Deliverables:** `app.routes.ts` with lazy `loadChildren`/`loadComponent` for every feature; `layout/` shell (`header`, `sidebar`, `page-container`); CSS variable theme (§3.3); scroll restoration; `withComponentInputBinding`.
- **DoD:**
  - [ ] All routes navigate; lazy chunks load
  - [ ] Header has nav, bell placeholder, user menu, logout
  - [ ] Theme colors via CSS variables only

### T08 — Auth feature

- **Deliverables:** `login-form` + `register-form` (reactive, validated), `features/auth` routes.
- **DoD:**
  - [ ] Inline validation on blur/touch
  - [ ] Submit disabled + spinner while in flight
  - [ ] Success stores token → navigates to `/dashboard`
  - [ ] No password retained in state after submit

### T09 — Dashboard

- **Deliverables:** balance card, quick actions, recent transactions (5–10), mini stats, notifications preview; single `DashboardService` using `forkJoin`.
- **DoD:**
  - [ ] Skeletons while loading, empty state when no data
  - [ ] Refresh via `switchMap` (no `setInterval` leaks)
  - [ ] Quick actions route correctly

### T10 — Accounts

- **Deliverables:** `account-list` (MatTable, search/filter, responsive→card), `account-detail`, `create-account` form, block/unblock with confirm dialog.
- **DoD:**
  - [ ] Search by account number / holder name
  - [ ] Destructive action confirmed via `MatDialog`
  - [ ] Backend `409` (duplicate) shown inline
  - [ ] Mobile card layout works

### T11 — Transactions: transfer + confirm

- **Deliverables:** `transfer` reactive form (sender, receiver, amount, description) + summary confirm dialog; calls `POST /transactions/transfer`.
- **DoD:**
  - [ ] Amount validator: min > 0, max custom
  - [ ] Confirm dialog summarizes before submit
  - [ ] Handles `409` (limit) / `400` (insufficient funds)
  - [ ] `PENDING_VERIFICATION` routes toward OTP

### T12 — OTP verification + polling

- **Deliverables:** `otp-verification` component; `POST /transactions/{id}/verify?otp=`; poll/refresh final status.
- **DoD:**
  - [ ] OTP entry validates length/format
  - [ ] Final status shown (`COMPLETED`/`FLAGGED`/`FAILED`)
  - [ ] Subscriptions cleaned up (`takeUntilDestroyed`)

### T13 — Transaction history

- **Deliverables:** paginated + filterable list (date range, type, status); sent **and** received; row click → detail.
- **DoD:**
  - [ ] Columns: date, counterparty, type badge, amount, status, description
  - [ ] Pagination controls work
  - [ ] Filters applied via query params

### T14 — Transaction detail + timeline

- **Deliverables:** `transaction-detail` with status timeline, fees, reference number, receipt (print/PDF).
- **DoD:**
  - [ ] Timeline renders PENDING→PROCESSING→COMPLETED/FLAGGED
  - [ ] Receipt downloadable/printable

### T15 — Deposit + withdrawal

- **Deliverables:** `deposit` and `withdrawal` forms calling new endpoints (§4).
- **DoD:**
  - [ ] Updated balance shown after success
  - [ ] Validation + error handling consistent with transfer

### T16 — Payments (Razorpay)

- **Deliverables:** `add-money`, `payment-status`, `payment-history`; `RazorpayService` wrapping checkout `open()` in a Promise.
- **DoD:**
  - [ ] Order → checkout → poll `GET /payments/{id}` → result
  - [ ] User-dismissed checkout handled gracefully
  - [ ] Only public key ID used; never secret
  - [ ] History shows status badges

### T17 — Notifications

- **Deliverables:** `notification-list`, header `notification-bell` with unread count; mark-as-read; filter by type; relative timestamps.
- **DoD:**
  - [ ] Unread badge count accurate
  - [ ] Manual refresh + polling
  - [ ] Empty state present

### T18 — Profile + settings

- **Deliverables:** `profile`, `settings` (change password with match validator, notification prefs), optional `kyc-status`.
- **DoD:**
  - [ ] Confirm-password match validator
  - [ ] Success toast on save
  - [ ] Inputs disabled appropriately

### T19 — Polish

- **Deliverables:** responsive pass, accessibility (labels/aria/keyboard/focus), dark/light toggle, spacing scale.
- **DoD:**
  - [ ] Mobile + desktop layouts verified
  - [ ] Keyboard navigation works
  - [ ] Dark mode toggle persists

### T20 — Tests + README

- **Deliverables:** unit tests for services/guards/forms (mocked HTTP), README with run instructions + screenshots.
- **DoD:**
  - [ ] `ng test` green
  - [ ] Auth flow, form validation, error handling, guard logic covered
  - [ ] README complete

---

## Senior-level self-review (from spec §6)

- [ ] Feature-first folder structure, lazy-loaded modules
- [ ] Typed models for every API response; no `any`
- [ ] Reactive forms with proper validation + error display
- [ ] All subscriptions cleaned up (async pipe / `takeUntilDestroyed`)
- [ ] HTTP interceptors for auth, errors, loading
- [ ] Guards protect routes; no unauthenticated access
- [ ] Loading, empty, and error states on every data view
- [ ] Responsive layout (mobile + desktop)
- [ ] Accessible (labels, aria, keyboard)
- [ ] Environment-based config; no secrets in code
- [ ] ESLint/Prettier clean; no unused imports
- [ ] Unit tests for services + key components
- [ ] README with run instructions and screenshots
