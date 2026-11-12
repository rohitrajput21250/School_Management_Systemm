const express = require("express")
const cookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const db = require("./db")

const app = express()
const secret = process.env.SESSION_SECRET || "development-only-change-me"
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }))
app.use(express.json())
app.use(cookieParser())
const publicUser = row => ({ id: row.id, email: row.email, name: row.name, role: row.role })
const fail = (res, status, message) => res.status(status).json({ error: message })
function auth(req, res, next) {
  try {
    const token = req.cookies.algions_session
    if (!token) return fail(res, 401, "Authentication required.")
    req.user = jwt.verify(token, secret)
    next()
  } catch { return fail(res, 401, "Session expired. Please sign in again.") }
}
const roles = (...allowed) => (req, res, next) => allowed.includes(req.user.role) ? next() : fail(res, 403, "Forbidden.")
function log(actor, action, entityType, entityId, metadata = {}) {
  db.prepare("INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?)").run(crypto.randomUUID(), actor, action, entityType, entityId || null, JSON.stringify(metadata), new Date().toISOString())
}
function balance(invoiceId) {
  const invoice = db.prepare("SELECT amount_due AS amountDue FROM invoices WHERE id=?").get(invoiceId)
  const paid = db.prepare("SELECT COALESCE(SUM(amount_paid), 0) AS paid FROM payments WHERE invoice_id=?").get(invoiceId).paid
  return Math.max(0, invoice.amountDue - paid)
}
function invoiceRows() {
  return db.prepare(`SELECT i.id, i.invoice_no AS invoiceNo, i.student_id AS studentId, i.title, i.amount_due AS amountDue,
    i.due_date AS dueDate, COALESCE(SUM(p.amount_paid),0) AS paid,
    CASE WHEN COALESCE(SUM(p.amount_paid),0) >= i.amount_due THEN 'PAID'
      WHEN COALESCE(SUM(p.amount_paid),0) > 0 THEN 'PARTIAL' ELSE 'UNPAID' END AS status
    FROM invoices i LEFT JOIN payments p ON p.invoice_id=i.id GROUP BY i.id ORDER BY i.due_date`).all()
}

app.post("/api/auth/login", (req, res) => {
  const row = db.prepare("SELECT * FROM users WHERE email=?").get(req.body.email)
  if (!row || !bcrypt.compareSync(req.body.password || "", row.password_hash)) return fail(res, 401, "Email or password is incorrect.")
  const token = jwt.sign({ id: row.id, email: row.email, role: row.role, name: row.name }, secret, { expiresIn: "8h" })
  const isProduction = process.env.NODE_ENV === "production"
  res.cookie("algions_session", token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 8 * 60 * 60 * 1000,
  })
  res.json(publicUser(row))
})
app.post("/api/auth/logout", (req, res) => { res.clearCookie("algions_session"); res.status(204).end() })
app.get("/api/auth/me", auth, (req, res) => res.json(req.user))
app.get("/api/snapshot", auth, (req, res) => {
  const students = req.user.role === "GUARDIAN"
    ? db.prepare("SELECT id, admission_no AS admissionNo, first_name AS firstName, last_name AS lastName, section_id AS sectionId, guardian_id AS guardianId FROM students").all()
    : req.user.role === "TEACHER"
      ? db.prepare(`SELECT s.id, s.admission_no AS admissionNo, s.first_name AS firstName, s.last_name AS lastName, s.section_id AS sectionId, s.guardian_id AS guardianId FROM students s JOIN teacher_sections ts ON ts.section_id=s.section_id WHERE ts.teacher_id=?`).all(req.user.id)
      : db.prepare("SELECT id, admission_no AS admissionNo, first_name AS firstName, last_name AS lastName, section_id AS sectionId, guardian_id AS guardianId FROM students").all()
  const studentIds = students.map(s => s.id)
  const inClause = studentIds.length ? `WHERE student_id IN (${studentIds.map(() => "?").join(",")})` : "WHERE 1=0"
  const attendance = db.prepare(`SELECT id, student_id AS studentId, section_id AS sectionId, date, session, status, recorded_by_id AS recordedById FROM attendance_records ${inClause} AND date BETWEEN '2026-11-01' AND '2026-11-13'`).all(...studentIds)
  const marks = db.prepare(`SELECT id, student_id AS studentId, subject, exam, marks_obtained AS marksObtained, max_marks AS maxMarks FROM marks ${inClause}`).all(...studentIds)
  const invoices = req.user.role === "GUARDIAN" ? invoiceRows().filter(i => studentIds.includes(i.studentId)) : invoiceRows()
  const sections = db.prepare("SELECT * FROM sections").all()
  const auditLogs = req.user.role === "ADMIN" ? db.prepare("SELECT a.id,a.action,a.entity_type AS entityType,u.name AS actor,a.created_at AS createdAt FROM audit_logs a JOIN users u ON u.id=a.actor_user_id ORDER BY a.created_at DESC LIMIT 50").all() : []
  const subjects = db.prepare("SELECT * FROM subjects ORDER BY name").all()
  const assignments = db.prepare("SELECT id, teacher_id AS teacherId, section_id AS sectionId, subject_id AS subjectId FROM class_subject_assignments").all()
  const announcements = db.prepare(`SELECT a.id,a.title,a.body,a.audience,a.created_at AS createdAt,u.name AS author
    FROM announcements a JOIN users u ON u.id=a.author_id
    WHERE a.audience='ALL' OR a.audience=? ORDER BY a.created_at DESC`).all(req.user.role)
  res.json({ users: [], sections, students, attendance, marks, invoices, auditLogs, subjects, assignments, announcements })
})
app.post("/api/announcements", auth, roles("ADMIN", "TEACHER"), (req, res) => {
  const id = crypto.randomUUID()
  if (!req.body.title || !req.body.body) return fail(res, 400, "Title and message are required.")
  db.prepare("INSERT INTO announcements VALUES (?, ?, ?, ?, ?, ?)").run(id, req.body.title, req.body.body, req.body.audience || "ALL", req.user.id, new Date().toISOString())
  log(req.user.id, "Announcement published", "Announcement", id, { audience: req.body.audience || "ALL" })
  res.status(201).json({ id })
})
app.get("/api/admin/catalog", auth, roles("ADMIN"), (req, res) => res.json({
  guardians: db.prepare("SELECT g.id,u.name,u.email,g.phone,g.address FROM guardians g JOIN users u ON u.id=g.id").all(),
  teachers: db.prepare("SELECT t.id,u.name,u.email,t.employee_code AS employeeCode,t.department FROM teachers t JOIN users u ON u.id=t.id").all(),
  sections: db.prepare("SELECT * FROM sections").all(),
  subjects: db.prepare("SELECT * FROM subjects ORDER BY name").all(),
  assignments: db.prepare("SELECT id,teacher_id AS teacherId,section_id AS sectionId,subject_id AS subjectId FROM class_subject_assignments").all(),
}))
app.post("/api/admin/subjects", auth, roles("ADMIN"), (req, res) => {
  const id = crypto.randomUUID()
  try { db.prepare("INSERT INTO subjects VALUES (?, ?, ?)").run(id, req.body.name, req.body.code); res.status(201).json({ id, name: req.body.name, code: req.body.code }) } catch (error) { fail(res, 409, "Subject name or code already exists.") }
})
app.delete("/api/admin/subjects/:id", auth, roles("ADMIN"), (req, res) => { db.prepare("DELETE FROM subjects WHERE id=?").run(req.params.id); res.status(204).end() })
app.post("/api/admin/assignments", auth, roles("ADMIN"), (req, res) => {
  const id = crypto.randomUUID()
  try { db.prepare("INSERT INTO class_subject_assignments VALUES (?, ?, ?, ?)").run(id, req.body.teacherId, req.body.sectionId, req.body.subjectId); res.status(201).json({ id }) } catch { fail(res, 409, "This teacher, section, and subject assignment already exists.") }
})
app.post("/api/attendance", auth, roles("TEACHER"), (req, res) => {
  const { studentId, sectionId, date, session, status } = req.body
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < "2026-11-01" || date > "2026-11-13") return fail(res, 400, "Attendance date must be between 2026-11-01 and 2026-11-13.")
  if (!db.prepare("SELECT 1 FROM teacher_sections WHERE teacher_id=? AND section_id=?").get(req.user.id, sectionId)) return fail(res, 403, "This section is not assigned to you.")
  if (!db.prepare("SELECT 1 FROM students WHERE id=? AND section_id=?").get(studentId, sectionId)) return fail(res, 400, "The student does not belong to this section.")
  try {
    const record = { id: crypto.randomUUID(), studentId, sectionId, date, session, status, recordedById: req.user.id }
    db.prepare("INSERT INTO attendance_records VALUES (?, ?, ?, ?, ?, ?, ?)").run(record.id, studentId, sectionId, date, session, status, req.user.id)
    log(req.user.id, "Attendance submitted", "AttendanceRecord", record.id, { date, session, status })
    res.status(201).json(record)
  } catch (error) { if (String(error.message).includes("UNIQUE")) return fail(res, 409, "Attendance already exists for this student, date, and session."); return fail(res, 400, error.message) }
})
app.get("/api/attendance", auth, (req, res) => {
  const sectionId = req.query.sectionId
  const rows = db.prepare(`SELECT id, student_id AS studentId, section_id AS sectionId, date, session, status, recorded_by_id AS recordedById
    FROM attendance_records WHERE section_id=? AND date=? AND session=?`).all(sectionId, req.query.date, req.query.session)
  if (req.user.role === "TEACHER" && !db.prepare("SELECT 1 FROM teacher_sections WHERE teacher_id=? AND section_id=?").get(req.user.id, sectionId)) return fail(res, 403, "This section is not assigned to you.")
  if (req.user.role === "GUARDIAN") return fail(res, 403, "Forbidden.")
  res.json(rows)
})
app.post("/api/exams/marks", auth, roles("TEACHER", "ADMIN"), (req, res) => {
  const { studentId, subject, exam, marksObtained, maxMarks } = req.body
  const student = db.prepare("SELECT section_id AS sectionId FROM students WHERE id=?").get(studentId)
  if (req.user.role === "TEACHER" && !db.prepare("SELECT 1 FROM teacher_sections WHERE teacher_id=? AND section_id=?").get(req.user.id, student.sectionId)) return fail(res, 403, "This section is not assigned to you.")
  db.prepare(`INSERT INTO marks (id,student_id,subject,exam,marks_obtained,max_marks) VALUES (?,?,?,?,?,?)
    ON CONFLICT(student_id,subject,exam) DO UPDATE SET marks_obtained=excluded.marks_obtained,max_marks=excluded.max_marks`).run(crypto.randomUUID(), studentId, subject, exam, marksObtained, maxMarks)
  log(req.user.id, "Exam marks saved", "ExamMark", studentId, { subject, exam })
  const rule = db.prepare("SELECT letter,gpa,min_percentage AS min FROM grading_rules WHERE min_percentage <= ? ORDER BY min_percentage DESC LIMIT 1").get((marksObtained / maxMarks) * 100)
  res.status(201).json({ marksObtained, maxMarks, percentage: marksObtained / maxMarks * 100, ...rule })
})
app.get("/api/invoices", auth, (req, res) => res.json(invoiceRows()))
app.post("/api/invoices", auth, roles("ADMIN"), (req, res) => {
  const id = crypto.randomUUID()
  db.prepare("INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, `INV-${Date.now()}`, req.body.studentId, req.body.title, req.body.amountDue, req.body.dueDate, "UNPAID")
  log(req.user.id, "Invoice created", "FeeInvoice", id)
  res.status(201).json(invoiceRows().find(i => i.id === id))
})
app.post("/api/fees/pay", auth, roles("ADMIN", "GUARDIAN"), (req, res) => {
  const invoice = db.prepare("SELECT * FROM invoices WHERE id=?").get(req.body.invoiceId)
  if (!invoice) return fail(res, 404, "Invoice not found.")
  if (req.user.role === "GUARDIAN" && !db.prepare("SELECT 1 FROM students WHERE id=? AND guardian_id=?").get(invoice.student_id, req.user.id)) return fail(res, 403, "You can only pay linked student invoices.")
  const amount = Number(req.body.amount)
  if (!Number.isFinite(amount) || amount <= 0 || amount > balance(invoice.id)) return fail(res, 400, "Payment amount exceeds the remaining balance.")
  const transaction = db.transaction(() => {
    const paymentId = crypto.randomUUID()
    const ref = `TXN-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`
    db.prepare("INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?)").run(paymentId, invoice.id, amount, req.body.paymentMethod || "SIMULATED_CARD", ref, new Date().toISOString())
    log(req.user.id, "Payment recorded", "FeePayment", paymentId, { invoiceId: invoice.id, amount, transactionRef: ref })
    return { paymentId, transactionRef: ref, invoice: invoiceRows().find(i => i.id === invoice.id) }
  })
  res.status(201).json(transaction())
})
app.post("/api/students", auth, roles("ADMIN"), (req, res) => {
  const { admissionNo, firstName, lastName, sectionId, guardianId } = req.body
  if (![admissionNo, firstName, lastName, sectionId].every(value => typeof value === "string" && value.trim())) {
    return fail(res, 400, "Admission number, first name, last name, and academic section are required.")
  }
  if (!db.prepare("SELECT 1 FROM sections WHERE id=?").get(sectionId)) return fail(res, 400, "The selected academic section does not exist.")
  if (db.prepare("SELECT 1 FROM students WHERE admission_no=?").get(admissionNo.trim())) {
    return fail(res, 409, `Admission number ${admissionNo.trim()} is already in use.`)
  }
  if (guardianId && !db.prepare("SELECT 1 FROM users WHERE id=? AND role='GUARDIAN'").get(guardianId)) {
    return fail(res, 400, "The selected guardian does not exist.")
  }
  const id = crypto.randomUUID()
  db.prepare("INSERT INTO students VALUES (?,?,?,?,?,?)").run(
    id,
    admissionNo.trim(),
    firstName.trim(),
    lastName.trim(),
    sectionId,
    guardianId || null
  )
  res.status(201).json({ id, admissionNo: admissionNo.trim(), firstName: firstName.trim(), lastName: lastName.trim(), sectionId, guardianId: guardianId || null })
})
app.delete("/api/students/:id", auth, roles("ADMIN"), (req, res) => { db.prepare("DELETE FROM students WHERE id=?").run(req.params.id); res.status(204).end() })

if (require.main === module) app.listen(process.env.PORT || 3001, () => console.log(`ALGIONS API listening on ${process.env.PORT || 3001}`))
module.exports = app
