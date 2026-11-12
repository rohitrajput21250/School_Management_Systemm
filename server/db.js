const fs = require("fs")
const path = require("path")
const Database = require("better-sqlite3")
const bcrypt = require("bcryptjs")

const dataDirectory = path.join(__dirname, "data")
fs.mkdirSync(dataDirectory, { recursive: true })
const db = new Database(process.env.DATABASE_PATH || path.join(dataDirectory, "algions.sqlite"))
db.pragma("foreign_keys = ON")
db.pragma("journal_mode = WAL")

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  name TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('ADMIN','TEACHER','GUARDIAN'))
);
CREATE TABLE IF NOT EXISTS sections (id TEXT PRIMARY KEY, grade TEXT NOT NULL, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY, admission_no TEXT NOT NULL UNIQUE, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
  section_id TEXT NOT NULL REFERENCES sections(id), guardian_id TEXT REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS teacher_sections (
  teacher_id TEXT NOT NULL REFERENCES users(id), section_id TEXT NOT NULL REFERENCES sections(id),
  PRIMARY KEY (teacher_id, section_id)
);
CREATE TABLE IF NOT EXISTS guardians (
  id TEXT PRIMARY KEY REFERENCES users(id), phone TEXT, address TEXT
);
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY REFERENCES users(id), employee_code TEXT NOT NULL UNIQUE, department TEXT
);
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, code TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS class_subject_assignments (
  id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL REFERENCES teachers(id), section_id TEXT NOT NULL REFERENCES sections(id),
  subject_id TEXT NOT NULL REFERENCES subjects(id), UNIQUE(teacher_id, section_id, subject_id)
);
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(id), section_id TEXT NOT NULL REFERENCES sections(id),
  date TEXT NOT NULL, session TEXT NOT NULL CHECK (session IN ('MORNING','AFTERNOON')),
  status TEXT NOT NULL CHECK (status IN ('PRESENT','ABSENT','LATE')), recorded_by_id TEXT NOT NULL REFERENCES users(id),
  UNIQUE(student_id, date, session)
);
CREATE TABLE IF NOT EXISTS marks (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(id), subject TEXT NOT NULL,
  exam TEXT NOT NULL, marks_obtained REAL NOT NULL, max_marks REAL NOT NULL,
  UNIQUE(student_id, subject, exam)
);
CREATE TABLE IF NOT EXISTS grading_rules (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, min_percentage REAL NOT NULL, letter TEXT NOT NULL, gpa REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY, invoice_no TEXT NOT NULL UNIQUE, student_id TEXT NOT NULL REFERENCES students(id),
  title TEXT NOT NULL, amount_due REAL NOT NULL CHECK(amount_due > 0), due_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('UNPAID','PARTIAL','PAID'))
);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL REFERENCES invoices(id), amount_paid REAL NOT NULL CHECK(amount_paid > 0),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('SIMULATED_CARD','SIMULATED_BANK')), transaction_ref TEXT NOT NULL UNIQUE,
  paid_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY, actor_user_id TEXT NOT NULL REFERENCES users(id), action TEXT NOT NULL,
  entity_type TEXT NOT NULL, entity_id TEXT, metadata_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, audience TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS attendance_section_date ON attendance_records(section_id, date);
CREATE INDEX IF NOT EXISTS invoices_student ON invoices(student_id);
CREATE INDEX IF NOT EXISTS audit_created ON audit_logs(created_at);
`)

function seed() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get().count
  if (count) return
  const insertUser = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)")
  insertUser.run("u-admin", "admin@algions.edu", bcrypt.hashSync("Admin@123", 10), "Rohit Vishwakarma", "ADMIN")
  insertUser.run("u-teacher", "teacher@algions.edu", bcrypt.hashSync("Teacher@123", 10), "Karan Johar", "TEACHER")
  insertUser.run("u-guardian", "guardian@algions.edu", bcrypt.hashSync("Guardian@123", 10), "Urvi Singh", "GUARDIAN")
  db.prepare("INSERT INTO guardians VALUES (?, ?, ?)").run("u-guardian", "+1 555 0142", "18 Orchard Lane")
  db.prepare("INSERT INTO teachers VALUES (?, ?, ?)").run("u-teacher", "ALG-T-001", "Mathematics")
  const insertSection = db.prepare("INSERT INTO sections VALUES (?, ?, ?)")
  insertSection.run("sec-10a", "Grade 10", "Section A")
  insertSection.run("sec-10b", "Grade 10", "Section B")
  insertSection.run("sec-9a", "Grade 9", "Section A")
  db.prepare("INSERT INTO teacher_sections VALUES (?, ?)").run("u-teacher", "sec-10a")
  db.prepare("INSERT INTO subjects VALUES (?, ?, ?)").run("sub-math", "Mathematics", "MATH-10")
  db.prepare("INSERT INTO subjects VALUES (?, ?, ?)").run("sub-english", "English", "ENG-10")
  db.prepare("INSERT INTO class_subject_assignments VALUES (?, ?, ?, ?)").run("assign-1", "u-teacher", "sec-10a", "sub-math")
  const insertStudent = db.prepare("INSERT INTO students VALUES (?, ?, ?, ?, ?, ?)")
  insertStudent.run("stu-001", "ALG-24001", "Rishika", "Naha", "sec-10a", "u-guardian")
  insertStudent.run("stu-002", "ALG-24002", "Shreya", "Shukla", "sec-10a", "u-guardian")
  insertStudent.run("stu-003", "ALG-24003", "Tanish", "Yadav", "sec-10b", null)
  insertStudent.run("stu-004", "ALG-24004", "Salman", "Khan", "sec-9a", null)
  const rules = [["rule-a-plus", 90, "A+", 4], ["rule-a", 80, "A", 3.7], ["rule-b", 70, "B", 3], ["rule-c", 60, "C", 2], ["rule-d", 50, "D", 1], ["rule-f", 0, "F", 0]]
  const insertRule = db.prepare("INSERT INTO grading_rules VALUES (?, ?, ?, ?, ?)")
  rules.forEach(([id, min, letter, gpa]) => insertRule.run(id, "Standard 2026", min, letter, gpa))
  db.prepare("INSERT INTO attendance_records VALUES (?, ?, ?, ?, ?, ?, ?)").run("att-1", "stu-001", "sec-10a", "2026-11-12", "MORNING", "PRESENT", "u-teacher")
  db.prepare("INSERT INTO attendance_records VALUES (?, ?, ?, ?, ?, ?, ?)").run("att-2", "stu-002", "sec-10a", "2026-11-12", "MORNING", "LATE", "u-teacher")
  db.prepare("INSERT INTO marks VALUES (?, ?, ?, ?, ?, ?)").run("mark-1", "stu-001", "Mathematics", "Midterm", 86, 100)
  db.prepare("INSERT INTO marks VALUES (?, ?, ?, ?, ?, ?)").run("mark-2", "stu-001", "English", "Midterm", 91, 100)
  db.prepare("INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?)").run("inv-1", "INV-2026-001", "stu-001", "Term 2 tuition", 1800, "2026-12-01", "PARTIAL")
  db.prepare("INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?)").run("pay-1", "inv-1", 1200, "SIMULATED_CARD", "TXN-SEED-001", "2026-11-01T10:00:00.000Z")
  db.prepare("INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?)").run("inv-2", "INV-2026-002", "stu-002", "Term 2 tuition", 1800, "2026-12-01", "PAID")
  db.prepare("INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?)").run("pay-2", "inv-2", 1800, "SIMULATED_BANK", "TXN-SEED-002", "2026-11-01T10:00:00.000Z")
  db.prepare("INSERT INTO announcements VALUES (?, ?, ?, ?, ?, ?)").run("announcement-1", "Welcome to Term 1", "Please review the academic calendar and updated safeguarding handbook.", "ALL", "u-admin", "2026-11-01T09:00:00.000Z")
  db.prepare("INSERT INTO announcements VALUES (?, ?, ?, ?, ?, ?)").run("announcement-2", "Mathematics clinic", "Extra support is available every Thursday after school in Room 204.", "GUARDIAN", "u-teacher", "2026-11-08T09:00:00.000Z")
}

seed()
db.prepare("UPDATE users SET name = CASE id WHEN 'u-admin' THEN 'Rohit Vishwakarma' WHEN 'u-teacher' THEN 'Karan Johar' WHEN 'u-guardian' THEN 'Urvi Singh' ELSE name END WHERE id IN ('u-admin', 'u-teacher', 'u-guardian')").run()
db.prepare("UPDATE students SET first_name = CASE id WHEN 'stu-001' THEN 'Rishika' WHEN 'stu-002' THEN 'Shreya' WHEN 'stu-003' THEN 'Tanish' WHEN 'stu-004' THEN 'Salman' ELSE first_name END, last_name = CASE id WHEN 'stu-001' THEN 'Naha' WHEN 'stu-002' THEN 'Shukla' WHEN 'stu-003' THEN 'Yadav' WHEN 'stu-004' THEN 'Khan' ELSE last_name END WHERE id IN ('stu-001', 'stu-002', 'stu-003', 'stu-004')").run()
db.prepare("DELETE FROM attendance_records WHERE date < '2026-11-01' OR date > '2026-11-13' OR date(date) IS NULL").run()
db.prepare("INSERT OR IGNORE INTO announcements VALUES (?, ?, ?, ?, ?, ?)").run("announcement-1", "Welcome to Term 1", "Please review the academic calendar and updated safeguarding handbook.", "ALL", "u-admin", "2026-11-01T09:00:00.000Z")
db.prepare("INSERT OR IGNORE INTO announcements VALUES (?, ?, ?, ?, ?, ?)").run("announcement-2", "Mathematics clinic", "Extra support is available every Thursday after school in Room 204.", "GUARDIAN", "u-teacher", "2026-11-08T09:00:00.000Z")
db.prepare("INSERT OR IGNORE INTO guardians VALUES (?, ?, ?)").run("u-guardian", "+1 555 0142", "18 Orchard Lane")
db.prepare("INSERT OR IGNORE INTO teachers VALUES (?, ?, ?)").run("u-teacher", "ALG-T-001", "Mathematics")
db.prepare("INSERT OR IGNORE INTO subjects VALUES (?, ?, ?)").run("sub-math", "Mathematics", "MATH-10")
db.prepare("INSERT OR IGNORE INTO subjects VALUES (?, ?, ?)").run("sub-english", "English", "ENG-10")
db.prepare("INSERT OR IGNORE INTO subjects VALUES (?, ?, ?)").run("sub-science", "Science", "SCI-10")
db.prepare("INSERT OR IGNORE INTO subjects VALUES (?, ?, ?)").run("sub-social", "Social Studies", "SST-10")
db.prepare("INSERT OR IGNORE INTO subjects VALUES (?, ?, ?)").run("sub-computer", "Computer Science", "CS-10")
db.prepare("INSERT OR IGNORE INTO class_subject_assignments VALUES (?, ?, ?, ?)").run("assign-1", "u-teacher", "sec-10a", "sub-math")
db.prepare("INSERT OR IGNORE INTO teacher_sections VALUES (?, ?)").run("u-teacher", "sec-10b")
db.prepare("INSERT OR IGNORE INTO teacher_sections VALUES (?, ?)").run("u-teacher", "sec-9a")
db.prepare("INSERT OR IGNORE INTO class_subject_assignments VALUES (?, ?, ?, ?)").run("assign-2", "u-teacher", "sec-10a", "sub-english")
db.prepare("INSERT OR IGNORE INTO class_subject_assignments VALUES (?, ?, ?, ?)").run("assign-3", "u-teacher", "sec-10a", "sub-science")
db.prepare("INSERT OR IGNORE INTO class_subject_assignments VALUES (?, ?, ?, ?)").run("assign-4", "u-teacher", "sec-10a", "sub-social")
db.prepare("INSERT OR IGNORE INTO class_subject_assignments VALUES (?, ?, ?, ?)").run("assign-5", "u-teacher", "sec-10a", "sub-computer")
module.exports = db
