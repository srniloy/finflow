# FinFlow – Banking Frontend (Angular + Tailwind CSS)

Standalone-component Angular app with lazy-loaded routes, route guards, JWT + error + loading interceptors, reactive forms, toasts and a spinner.

## Run

```bash
npm install
npm run mock-server   # optional: in-memory API at http://localhost:8080/api
npm start             # http://localhost:4200
```

If you have a real backend, it must expose the endpoints below at `http://localhost:8080/api`
(change `src/app/core/config.ts` to point elsewhere) and allow CORS from `http://localhost:4200`.

## API contract

| Method | Endpoint | Payload | Response |
| --- | --- | --- | --- |
| POST | /auth/register | `{ name, email, password, phone }` | `{ message, accountId }` |
| POST | /auth/login | `{ email, password }` | `{ token, userId }` |
| GET | /accounts/me | – | `{ accountId, balance, accountType }` |
| POST | /transactions/deposit | `{ amount }` | `{ transactionId, newBalance, status }` |
| POST | /transactions/withdraw | `{ amount }` | `{ transactionId, newBalance, status }` |
| POST | /transactions/transfer | `{ toAccountId, amount }` | `{ transactionId, status }` |
| POST | /transactions/payment | `{ billerId, invoiceNumber, amount }` | `{ transactionId, status }` |
| GET | /transactions/history | – | `[{ id, type, amount, date, status }]` |

`phone` (register) and `invoiceNumber` (payment) are sent in addition to the fields listed in the original guideline, because the forms require them.

## Structure

```
src/app/
  core/       config, models, services, interceptors (jwt, error, loading), guards
  shared/     layout (sidebar / top bar / mobile nav), spinner, toasts, field-error, validators
  features/   auth, dashboard, transactions (deposit, withdraw, transfer, payment)
```

A 401 from any protected endpoint logs the user out and redirects to `/login`.
