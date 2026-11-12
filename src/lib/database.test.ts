import {
  ApiError, authenticate, calculateGrade, getGuardianStudent, recordAttendance, recordPayment, invoices, users,
} from "./database"

test("teacher can record attendance for all assigned sections", () => {
  const teacher = authenticate("teacher@algions.edu", "Teacher@123")
  expect(() => recordAttendance(teacher, { studentId: "stu-001", sectionId: "sec-10a", date: "2026-11-13", session: "MORNING", status: "PRESENT" })).not.toThrow()
  expect(() => recordAttendance(teacher, { studentId: "stu-003", sectionId: "sec-10b", date: "2026-11-13", session: "MORNING", status: "PRESENT" })).not.toThrow()
})

test("attendance uniqueness prevents duplicate student date session", () => {
  const teacher = authenticate("teacher@algions.edu", "Teacher@123")
  const record = { studentId: "stu-002", sectionId: "sec-10a", date: "2026-11-13", session: "AFTERNOON" as const, status: "ABSENT" as const }
  recordAttendance(teacher, record)
  expect(() => recordAttendance(teacher, record)).toThrow("already exists")
})

test("grading rules calculate percentage, letter, and GPA", () => {
  expect(calculateGrade(87, 100)).toEqual({ percentage: 87, letter: "A", gpa: 3.7 })
  expect(calculateGrade(45, 50).letter).toBe("A+")
})

test("guardian can only access the linked student", () => {
  const guardian = authenticate("guardian@algions.edu", "Guardian@123")
  expect(getGuardianStudent(guardian, "stu-001").firstName).toBe("Rishika")
  expect(() => getGuardianStudent(guardian, "stu-003")).toThrow(ApiError)
})

test("payments reconcile against invoice due amount", () => {
  const admin = users[0]
  const invoice = invoices.find((entry) => entry.id === "inv-1")!
  recordPayment(admin, invoice.id, 600)
  expect(invoice.amountDue - invoice.payments).toBe(0)
  expect(invoice.status).toBe("PAID")
})
