# FinFlow Frontend — Angular Feature Guide

> Purpose: Build a recruiter-facing, production-quality Angular SPA for FinFlow.
> Stack: Angular 17+, TypeScript, CSS (standalone components), RxJS, Angular Material.

---

## 0. Development Standards (Senior Level)

Apply these from day one — reviewers look at architecture, not just UI.

### 0.1 Project Structure (Feature-first, not type-first)

```
src/
  app/
    core/                 # Singleton services, interceptors, guards, models
      config/
      interceptors/
      guards/
      models/
      services/
    shared/               # Reusable components, pipes, directives, validators
      components/
      directives/
      pipes/
      validators/
    features/             # One folder per feature (lazy-loaded)
      auth/
      dashboard/
      accounts/
      transactions/
      payments/
      notifications/
      profile/
    layout/               # Shell: header, sidebar, footer, page wrapper
    app.component.ts
    app.config.ts
    app.routes.ts
```

### 0.2 Coding Standards

- **Standalone components** by default (no NgModules).
- **Strong typing** — every HTTP response has an interface in `core/models/`. No `any`.
- **Reactive forms** for all inputs; never template-driven forms.
- **RxJS discipline** — always unsubscribe (use `takeUntilDestroyed` or `async` pipe). No leaked subscriptions.
- **Signals** for local component state where appropriate (`signal`, `computed`).
- **Functional guards/interceptors/resolvers** — not class-based.
- **ESLint + Prettier** — strict config, no unused imports/vars.
- **Barrel files** (`index.ts`) only for public API of a folder.
- **Naming** — `kebab-case` files, `PascalCase` classes, `camelCase` members, `SCREAMING_SNAKE_CASE` constants.

### 0.3 HTTP & State Standards

- A single `ApiClient`/typed service per domain (`AccountService`, `TransactionService`, `PaymentService`).
- All API URLs come from an **environment file**, never hardcoded.
- Centralized error handling in an interceptor — map HTTP codes to user-friendly messages.
- Cache reference data (account types) in a service, not per-component.
- Use `HttpInterceptor` for: JWT attach, error toast, loading spinner, retry.

### 0.4 UI Standards

- **Angular Material** for consistent components (table, form fields, dialogs, snackbar).
- **CSS variables** for theme colors; no magic hex values scattered.
- **Responsive** — mobile-first, breakpoints in one `_breakpoints.scss`/CSS file.
- **Loading & empty states** on every data view (skeleton/spinner, empty illustration).
- **Accessibility** — labels, aria attributes, keyboard navigation, focus management.
- **Toasts/Snackbars** for success/error; never silent failures.

### 0.5 Testing Standards

- **Unit tests** with Jasmine/Karma or Jest for services and components (`*.spec.ts`).
- **Mock HTTP** with `HttpClientTestingModule`; never call real backend in unit tests.
- At minimum cover: auth flow, form validation, error handling, guard logic.

### 0.6 Security Standards

- Store JWT in `HttpOnly` cookie if possible, otherwise `sessionStorage` (not `localStorage` for sensitive apps).
- Never log tokens or PII.
- Sanitize user input; Angular does this by default — don't use `bypassSecurityTrust*`.
- Role checks both client-side (UX) and server-side (security).

---

## 1. Core Infrastructure (Build First)

### 1.1 Environment Configuration

**Files:** `src/environments/environment.ts`, `environment.prod.ts`

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080', // API Gateway
  razorpayKeyId: 'rzp_test_...',
};
```

### 1.2 API Models

Define interfaces matching backend DTOs in `core/models/`:

- `account.model.ts` — `Account`, `AccountType`, `AccountStatus`, `CreateAccountRequest`
- `transaction.model.ts` — `Transaction`, `TransactionType`, `TransactionStatus`, `TransferRequest`, `PagedResponse<T>`
- `payment.model.ts` — `Payment`, `PaymentStatus`, `CreatePaymentRequest`, `PaymentOrderResponse`
- `auth.model.ts` — `LoginRequest`, `AuthResponse`, `User`
- `notification.model.ts` — `Notification`

### 1.3 Auth Interceptor

- Attach `Authorization: Bearer <token>` to every request.
- On `401`, redirect to login and clear session.

### 1.4 Error Interceptor

- Map status codes to messages (`400` validation, `401` unauthorized, `403`, `404`, `409` conflict, `500`).
- Show snackbar; re-throw for component-level handling.

### 1.5 Loading Interceptor

- Show/hide a global spinner for in-flight requests (with debounce to avoid flicker).

### 1.6 Auth Guard

- `authGuard` — redirect to `/login` if not authenticated.
- `noAuthGuard` — redirect to `/dashboard` if already authenticated.

### 1.7 Global Exception & Toast Service

- `ToastService` wrapping `MatSnackBar`.
- Consistent error format from backend `{ timestamp, status, error, message }`.

---

## 2. Feature Modules

### 2.1 Authentication (`features/auth`)

**Pages:**

- `/login` — email/username + password
- `/register` — create user/account
- `/forgot-password` (optional)

**Components:**

- `login-form.component.ts`
- `register-form.component.ts`

**Standards:**

- Reactive form with `Validators.required`, `email`, `minLength`.
- Show inline validation messages on blur/touch.
- Disable submit while request in flight; show spinner.
- Never store password in component state longer than needed.
- On success store token, navigate to `/dashboard`.

---

### 2.2 Dashboard (`features/dashboard`)

**Purpose:** Landing page after login — the "wow" screen.

**Widgets:**

- **Balance card** — current account balance, account number, account type, status badge.
- **Quick actions** — Transfer, Add Money, Deposit, Withdraw buttons.
- **Recent transactions** — last 5–10 with type icon (debit/credit), amount, status, date.
- **Mini stats** — total in/out this month, pending count.
- **Notifications preview** — latest 3 alerts.

**Standards:**

- Load data via a single `DashboardService` using `forkJoin` for parallel requests.
- Show skeletons while loading; empty state if no data.
- Poll or use `switchMap` on refresh button; avoid `setInterval` leaks.

---

### 2.3 Accounts (`features/accounts`)

**Pages/Components:**

- `account-list.component.ts` — table of accounts
- `account-detail.component.ts` — full details + actions
- `create-account.component.ts` — form to open a new account
- `account-actions.component.ts` — block/unblock

**Features:**

- Create account (account holder name, email, phone, type, initial deposit).
- View account details + balance.
- Filter/search by account number or holder name.
- Responsive table → card layout on mobile.

**Standards:**

- Use Material `MatTable` with server-side or client-side pagination.
- Confirm destructive actions (block) via `MatDialog`.
- Show validation errors from backend (e.g., duplicate email → `409`).

---

### 2.4 Transactions (`features/transactions`)

This is the core feature — implement it thoroughly.

**Pages/Components:**

- `transfer.component.ts` — send money form
- `otp-verification.component.ts` — OTP step after suspicious transfer
- `transaction-history.component.ts` — paginated, filterable list
- `transaction-detail.component.ts` — status timeline
- `deposit.component.ts` — add money to own account
- `withdrawal.component.ts` — withdraw from own account

**Transfer Flow (must match backend SAGA):**

1. User fills sender account, receiver account, amount, description.
2. `POST /api/v1/transactions/transfer` → returns transaction (status `PROCESSING` or `PENDING_VERIFICATION`).
3. If `PENDING_VERIFICATION` → navigate to OTP screen.
4. User enters OTP → `POST /api/v1/transactions/{id}/verify?otp=...`.
5. Show final status (`COMPLETED` / `FLAGGED` / `FAILED`).
6. Poll transaction status or refresh detail after verify.

**Transaction History:**

- Show **both sent and received** (requires backend fix 3.3).
- Columns: date, counterparty, type badge (DEBIT/CREDIT), amount, status, description.
- Filters: date range, type, status. Pagination controls.
- Row click → detail view.

**Transaction Detail:**

- Status timeline (PENDING → PROCESSING → COMPLETED/FLAGGED).
- Amount, fees (if any), sender/receiver, reference number.
- "Download receipt" button (generate PDF client-side or print view).

**Deposit/Withdrawal:**

- Simple forms calling the new backend endpoints (requires backend 3.1).
- Show updated balance after success.

**Standards:**

- Amount input: `MatInput` + `type="number"`, min > 0, custom validator for max.
- Confirm dialog summarizing the transfer before submit.
- Clear success/error feedback; navigate to detail on success.
- Handle `409`/`400` from daily-limit or insufficient-funds errors.

---

### 2.5 Payments (`features/payments`)

**Purpose:** Razorpay "Add Money" integration.

**Pages/Components:**

- `add-money.component.ts` — amount + description → create order
- `payment-status.component.ts` — result of a payment
- `payment-history.component.ts` — list of payments

**Flow:**

1. User enters amount → `POST /api/v1/payments/create-order`.
2. Receive `{ orderId, razorpayPaymentId, amount, currency, razorpayKeyId }`.
3. Invoke **Razorpay Checkout** (`open()` with handler).
4. On success, Razorpay calls backend webhook → backend publishes `payment.completed`.
5. Frontend polls `GET /api/v1/payments/{id}` until `COMPLETED`/`FAILED`.
6. Show success/failure screen with receipt details.

**Integration Options:**

- Official `razorpay-checkout` via script injection, or
- `@razorpay/razorpay-checkout` npm, or
- Build a small `RazorpayService` that loads the checkout JS and wraps `open()` in a Promise.

**Standards:**

- Never expose key secret — only the key ID is public (correct).
- Show a processing state while payment is in flight.
- Handle user closing the checkout (dismiss) gracefully.
- Display payment history with status badges.

---

### 2.6 Notifications (`features/notifications`)

**Pages/Components:**

- `notification-list.component.ts` — list of alerts
- `notification-bell.component.ts` — header bell with unread count

**Features:**

- List notifications (requires backend persistence + endpoint 4.2).
- Mark as read; unread badge count.
- Filter by type (OTP, transaction, fraud, payment).
- Relative timestamps ("2 min ago").

**Standards:**

- Poll or WebSocket for new notifications; provide manual refresh.
- Empty state with friendly message.

---

### 2.7 Profile & Settings (`features/profile`)

**Pages/Components:**

- `profile.component.ts` — user info
- `settings.component.ts` — change password, notification prefs
- `kyc-status.component.ts` — KYC verification status (if implemented)

**Standards:**

- Change password form with confirm-password match validator.
- Disable inputs appropriately; show success toast.

---

## 3. Layout & Navigation

### 3.1 Shell (`layout/`)

- `header.component.ts` — logo, nav links, notification bell, user menu, logout.
- `sidebar.component.ts` — navigation (Dashboard, Accounts, Transfer, Payments, Notifications, Profile).
- `page-container.component.ts` — consistent page padding/title wrapper.

### 3.2 Routing (`app.routes.ts`)

- Lazy-load every feature: `loadChildren: () => import(...)`.
- Protect routes with `authGuard`.
- `RouterModule` with `withComponentInputBinding` (Angular 16+).
- Scroll restoration on navigation.

### 3.3 Theming

- CSS variables for primary/success/warning/error.
- Dark/light toggle (optional but impressive).
- Consistent spacing scale (4/8/16/24).

---

## 4. API Contract (Frontend ↔ Backend)

| Feature              | Method | Endpoint                                                   |
| -------------------- | ------ | ---------------------------------------------------------- |
| Login                | POST   | `/api/v1/auth/login`                                       |
| Register             | POST   | `/api/v1/auth/register`                                    |
| Create account       | POST   | `/api/v1/accounts`                                         |
| Get account          | GET    | `/api/v1/accounts/{accountNumber}`                         |
| Get balance          | GET    | `/api/v1/accounts/{accountNumber}/balance`                 |
| Block account        | PUT    | `/api/v1/accounts/{accountNumber}/block`                   |
| Transfer             | POST   | `/api/v1/transactions/transfer`                            |
| Deposit              | POST   | `/api/v1/transactions/deposit`                             |
| Withdraw             | POST   | `/api/v1/transactions/withdrawal`                          |
| Get transaction      | GET    | `/api/v1/transactions/{transactionId}`                     |
| History              | GET    | `/api/v1/transactions/account/{accountNumber}?page=&size=` |
| Verify OTP           | POST   | `/api/v1/transactions/{transactionId}/verify?otp=`         |
| Create payment order | POST   | `/api/v1/payments/create-order`                            |
| Payment status       | GET    | `/api/v1/payments/{paymentId}`                             |
| Payment history      | GET    | `/api/v1/payments/account/{accountNumber}`                 |
| Refund               | POST   | `/api/v1/payments/{paymentId}/refund`                      |
| Notifications        | GET    | `/api/v1/notifications/account/{accountNumber}`            |

> Note: Endpoints marked as new require the corresponding backend work in `BACKEND-IMPROVEMENTS.md`.

---

## 5. Suggested Build Order

1. **Core infrastructure** — models, interceptors, guards, toast, environments.
2. **Auth feature** — login/register, token storage.
3. **Layout shell** — header, sidebar, routing.
4. **Dashboard** — balance + recent transactions.
5. **Accounts** — list, detail, create.
6. **Transactions** — transfer + OTP flow + history + detail (the highlight).
7. **Payments** — Razorpay add-money flow.
8. **Notifications** — list + bell.
9. **Profile/Settings**.
10. **Polish** — responsive, accessibility, tests, dark mode.

---

## 6. Senior-Level Checklist (Self-Review)

- [ ] Feature-first folder structure, lazy-loaded modules.
- [ ] Typed models for every API response; no `any`.
- [ ] Reactive forms with proper validation + error display.
- [ ] All subscriptions cleaned up (async pipe / `takeUntilDestroyed`).
- [ ] HTTP interceptors for auth, errors, loading.
- [ ] Guards protect routes; no unauthenticated access.
- [ ] Loading, empty, and error states on every data view.
- [ ] Responsive layout (mobile + desktop).
- [ ] Accessible (labels, aria, keyboard).
- [ ] Environment-based config; no secrets in code.
- [ ] ESLint/Prettier clean; no unused imports.
- [ ] Unit tests for services + key components.
- [ ] README with run instructions and screenshots.
