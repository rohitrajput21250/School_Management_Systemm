# Technical report

## Architectural choices

The UI is a modular React client backed by a Node/Express modular monolith. SQLite persistence is initialized in `server/db.js`, while `server/index.js` owns HTTP controllers, cookies, role middleware, transactions, and audit writes. The typed client adapter in `src/lib/database.ts` is responsible for transport and local unit-test compatibility.

## RBAC and privacy

Role checks happen in server middleware and server-side queries, not only in navigation. Teacher attendance and mark writes validate the teacher's assigned section and return HTTP 403 otherwise. Guardian snapshots are filtered by `guardian_id`, and fee payments verify invoice ownership before amount validation. Passwords are bcrypt hashes and sessions are signed, HTTP-only cookies.

## Integrity and concurrency

Attendance uses the database composite unique key `(studentId, date, session)` and rejects a second write with 409. Payment recording runs the payment insert and audit insert in one SQLite transaction; the remaining balance is always `max(0, amountDue - sum(payments))`, and invoice status is derived from the aggregate payment total.

## Auditability

Attendance submissions, mark entry/publication, invoice creation, and payments append immutable audit records containing actor, entity, action, metadata, and timestamp. Administrative report endpoints should be paginated and filterable.

## Testing

`src/lib/database.test.ts` covers domain calculations and `server/index.test.js` covers HTTP teacher scope, duplicate attendance, configured grade calculation, guardian isolation, and payment authorization. The deterministic seed and database constraints make the server test harness repeatable.
