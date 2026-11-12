# ALGIONS data model

```mermaid
erDiagram
  USER ||--o| GUARDIAN : has
  USER ||--o| TEACHER : has
  GUARDIAN ||--o{ STUDENT : cares_for
  SECTION ||--o{ STUDENT : contains
  CLASS ||--o{ SECTION : groups
  TEACHER ||--o{ CLASS_SUBJECT_ASSIGNMENT : receives
  SECTION ||--o{ CLASS_SUBJECT_ASSIGNMENT : offers
  SUBJECT ||--o{ CLASS_SUBJECT_ASSIGNMENT : teaches
  STUDENT ||--o{ ATTENDANCE_RECORD : has
  SECTION ||--o{ ATTENDANCE_RECORD : scopes
  USER ||--o{ ATTENDANCE_RECORD : records
  EXAM ||--o{ EXAM_MARK : contains
  STUDENT ||--o{ EXAM_MARK : receives
  SUBJECT ||--o{ EXAM_MARK : assesses
  GRADING_RULE ||--o{ EXAM : configures
  STUDENT ||--o{ FEE_INVOICE : billed
  FEE_INVOICE ||--o{ FEE_PAYMENT : settles
  USER ||--o{ AUDIT_LOG : creates
  USER { string id PK string email UK string passwordHash Role role string name }
  GUARDIAN { string id PK string userId FK string phone string address }
  TEACHER { string id PK string userId FK string employeeCode UK string department }
  CLASS { string id PK string name }
  SECTION { string id PK string classId FK string name }
  STUDENT { string id PK string admissionNo UK string firstName string lastName date dob string sectionId FK string guardianId FK }
  SUBJECT { string id PK string name }
  CLASS_SUBJECT_ASSIGNMENT { string id PK string teacherId FK string sectionId FK string subjectId FK }
  ATTENDANCE_RECORD { string id PK string studentId FK string sectionId FK date date Session session AttendanceStatus status string recordedById FK }
  EXAM { string id PK string title date examDate string gradingRuleId FK }
  GRADING_RULE { string id PK string name json thresholds }
  EXAM_MARK { string id PK string examId FK string studentId FK string subjectId FK decimal marksObtained decimal maxMarks }
  FEE_INVOICE { string id PK string invoiceNo UK string studentId FK decimal amountDue date dueDate InvoiceStatus status }
  FEE_PAYMENT { string id PK string invoiceId FK decimal amountPaid PaymentMethod paymentMethod string transactionRef date paidAt }
  AUDIT_LOG { string id PK string actorUserId FK string action string entityType string entityId json metadataJson date createdAt }
```

`ATTENDANCE_RECORD` has a unique composite index on `(studentId, date, session)`. Fee payment inserts and invoice status updates execute in one transaction in the production adapter.
