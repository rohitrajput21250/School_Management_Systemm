const request = require("supertest")
const app = require("./index")
const db = require("./db")

describe("ALGIONS API acceptance flows", () => {
  let agent
  beforeAll(async () => {
    db.prepare("INSERT OR IGNORE INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?)").run("inv-test-private", "INV-TEST-PRIVATE", "stu-003", "Test invoice", 100, "2099-01-01", "UNPAID")
    agent = request.agent(app)
    await agent.post("/api/auth/login").send({ email: "teacher@algions.edu", password: "Teacher@123" })
  })
  test("teacher can submit attendance for an assigned section", async () => {
    const date = "2026-11-13"
    const response = await agent.post("/api/attendance").send({ studentId: "stu-003", sectionId: "sec-10b", date, session: "MORNING", status: "PRESENT" })
    expect(response.status).toBe(201)
  })
  test("duplicate attendance returns 409", async () => {
    const payload = { studentId: "stu-001", sectionId: "sec-10a", date: "2026-11-13", session: "AFTERNOON", status: "PRESENT" }
    expect((await agent.post("/api/attendance").send(payload)).status).toBe(201)
    expect((await agent.post("/api/attendance").send(payload)).status).toBe(409)
  })
  test("marks return configured grade", async () => {
    const response = await agent.post("/api/exams/marks").send({ studentId: "stu-001", subject: "Science", exam: "Final", marksObtained: 92, maxMarks: 100 })
    expect(response.body.letter).toBe("A+")
  })
  test("guardian cannot access another student's invoice payment", async () => {
    const guardian = request.agent(app)
    await guardian.post("/api/auth/login").send({ email: "guardian@algions.edu", password: "Guardian@123" })
    const response = await guardian.post("/api/fees/pay").send({ invoiceId: "inv-test-private", amount: 1 })
    expect(response.status).toBe(403)
  })
})
