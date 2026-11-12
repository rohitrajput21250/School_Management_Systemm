# ALGIONS API specification

OpenAPI 3.0 contract for the server adapter. All routes require a signed HTTP-only session except login.

```yaml
openapi: 3.0.3
info:
  title: ALGIONS Academy API
  version: 1.0.0
servers:
  - url: http://localhost:3000/api
paths:
  /auth/login:
    post:
      summary: Start a role session
      requestBody:
        required: true
        content:
          application/json: { schema: { $ref: '#/components/schemas/Login' } }
      responses:
        '200': { description: Authenticated user }
        '401': { description: Invalid credentials }
  /auth/me:
    get: { summary: Read the current session, responses: { '200': { description: Session user }, '401': { description: Unauthenticated } } }
  /auth/logout:
    post: { summary: Clear the HTTP-only session cookie, responses: { '204': { description: Logged out } } }
  /snapshot:
    get: { summary: Read role-scoped dashboard data, responses: { '200': { description: Students, attendance, marks, invoices, and audit data } } }
  /students:
    get: { summary: List students, responses: { '200': { description: Paginated students }, '403': { description: Forbidden } } }
    post: { summary: Create student, responses: { '201': { description: Created }, '403': { description: Admin only } } }
  /attendance:
    get: { summary: Attendance history, responses: { '200': { description: Attendance records } } }
    post: { summary: Submit attendance, responses: { '201': { description: Created }, '403': { description: Unassigned section }, '409': { description: Duplicate composite key } } }
  /admin/catalog:
    get: { summary: Read guardians, teachers, sections, subjects, and assignments, responses: { '200': { description: Admin catalog } } }
  /admin/subjects:
    post: { summary: Create a subject, responses: { '201': { description: Created }, '403': { description: Admin only } } }
  /admin/subjects/{id}:
    delete: { summary: Delete a subject, responses: { '204': { description: Deleted } } }
  /admin/assignments:
    post: { summary: Assign a teacher, section, and subject, responses: { '201': { description: Created }, '409': { description: Duplicate assignment } } }
  /exams/marks:
    post: { summary: Enter marks for an assigned subject and calculate its grade, responses: { '201': { description: Created }, '403': { description: Forbidden } } }
  /invoices:
    get: { summary: Fee ledger, responses: { '200': { description: Invoices } } }
    post: { summary: Create invoice, responses: { '201': { description: Created }, '403': { description: Admin only } } }
  /fees/pay:
    post: { summary: Record simulated payment transaction, responses: { '201': { description: Payment and reconciled balance }, '400': { description: Invalid amount } } }
  /audit-logs:
    get: { summary: Audit trail, responses: { '200': { description: Material actions } } }
components:
  schemas:
    Login:
      type: object
      required: [email, password]
      properties:
        email: { type: string, format: email }
        password: { type: string, format: password }
```
