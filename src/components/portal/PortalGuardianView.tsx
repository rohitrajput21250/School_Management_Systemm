import React, { useState } from "react"
import { CreditCard, Printer, X } from "lucide-react"
import HoloStudentBadge from "../3d/HoloStudentBadge"
import Tilt3DCard from "../3d/Tilt3DCard"
import { triggerPaymentCelebration } from "../3d/ConfettiBurst"
import { api, calculateGrade, formatINR, outstandingBalance, type Db, type User } from "../../lib/database"

interface PortalGuardianViewProps {
  user: User
  db: Db
  active: string
  act: (operation: () => Promise<unknown>, success: string) => Promise<void>
}

export default function PortalGuardianView({
  user,
  db,
  active,
  act,
}: PortalGuardianViewProps) {
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState("")

  const student = db.students.find((s) => s.id === selectedStudentId) || db.students[0]
  const section = db.sections.find((s) => s.id === student?.sectionId)
  const studentInvoices = db.invoices.filter((i) => i.studentId === student?.id)
  const unpaidInvoice = studentInvoices.find((i) => outstandingBalance(i) > 0)
  const studentMarks = db.marks.filter((m) => m.studentId === student?.id)
  const studentAttendance = db.attendance
    .filter((a) => a.studentId === student?.id && /^\d{4}-\d{2}-\d{2}$/.test(a.date))
    .sort((a, b) => b.date.localeCompare(a.date))

  const avgScore = studentMarks.length
    ? Math.round(
        studentMarks.reduce(
          (sum, m) => sum + calculateGrade(m.marksObtained, m.maxMarks).percentage,
          0
        ) / studentMarks.length
      )
    : 88

  const handlePay = async () => {
    if (!unpaidInvoice) return
    setPaying(true)
    try {
      const bal = outstandingBalance(unpaidInvoice)
      await act(
        () => api.pay(user, unpaidInvoice.id, bal),
        `Payment of ${formatINR(bal)} successful! Receipt issued.`
      )
      triggerPaymentCelebration()
      setPayModalOpen(false)
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="portal-subview-container">
      {/* Student Profile & 3D Holo Badge Banner */}
      <div className="guardian-hero-banner-3d">
        <div className="guardian-hero-left">
          <span className="eyebrow-accent">Family Portal · Verified Link</span>
          <h2>{student.firstName} {student.lastName}</h2>
          <label style={{ display: "block", margin: "12px 0", color: "#6e7d72", fontSize: 12 }}>
            View student
            <select value={student.id} onChange={(e) => setSelectedStudentId(e.target.value)} style={{ display: "block", marginTop: 6, padding: "8px 10px", borderRadius: 6 }}>
              {db.students.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>{candidate.firstName} {candidate.lastName}</option>
              ))}
            </select>
          </label>
          <p>
            Connected to <b>{user.name}</b> (Guardian). All academic records, attendance logs, and school fee schedules are encrypted and updated in real time.
          </p>

          <div className="guardian-quick-stats">
            <div className="stat-bubble">
              <small>Grade Section</small>
              <b>{section ? `${section.grade} · ${section.name}` : "Grade 10"}</b>
            </div>
            <div className="stat-bubble">
              <small>Admission ID</small>
              <b>{student.admissionNo}</b>
            </div>
            <div className="stat-bubble">
              <small>Academic Status</small>
              <b style={{ color: "#4ade80" }}>Good Standing</b>
            </div>
          </div>
        </div>

        {/* 3D Holographic ID Card */}
        <div className="guardian-holo-card-wrap">
          <HoloStudentBadge
            student={student}
            section={section}
            guardianName={user.name}
          />
        </div>
      </div>

      {/* KPI Deck */}
      <div className="kpi-grid-3d" style={{ marginBottom: 24 }}>
        <Tilt3DCard maxTilt={8} className="kpi-card-3d">
          <div className="kpi-card-inner">
            <span className="kpi-label">Academic Average</span>
            <div className="kpi-number" style={{ color: "#2e7246" }}>{avgScore}%</div>
            <small className="kpi-desc">Based on verified teacher grades</small>
          </div>
        </Tilt3DCard>

        <Tilt3DCard maxTilt={8} className="kpi-card-3d">
          <div className="kpi-card-inner">
            <span className="kpi-label">Recorded Sessions</span>
            <div className="kpi-number">{studentAttendance.length || 1}</div>
            <small className="kpi-desc">Live daily check-ins</small>
          </div>
        </Tilt3DCard>

        <Tilt3DCard maxTilt={8} className="kpi-card-3d">
          <div className="kpi-card-inner">
            <span className="kpi-label">Outstanding Balance</span>
            <div
              className="kpi-number"
              style={{ color: unpaidInvoice ? "#c85a67" : "#2e7246" }}
            >
              {formatINR(unpaidInvoice ? outstandingBalance(unpaidInvoice) : 0)}
            </div>
            <small className="kpi-desc">
              {unpaidInvoice ? "Term 2 tuition pending" : "All accounts reconciled"}
            </small>
          </div>
        </Tilt3DCard>
      </div>

      {/* FEES TAB OR FEE HIGHLIGHT */}
      {active === "Fees" ? (
        <div className="guardian-fee-layout">
          <div className="glass-panel-3d fee-balance-box">
            <span className="eyebrow-accent">Current Statement</span>
            <div className="huge-balance-text">
              {formatINR(unpaidInvoice ? outstandingBalance(unpaidInvoice) : 0)}
            </div>
            <p style={{ color: "#6e7d72", fontSize: 13, marginBottom: 20 }}>
              {unpaidInvoice
                ? `Due on ${unpaidInvoice.dueDate}. Instant receipt generated upon submission.`
                : "No outstanding balances due for this student."}
            </p>

            {unpaidInvoice && (
              <button
                className="primary-action-btn full"
                onClick={() => setPayModalOpen(true)}
              >
                <CreditCard size={16} />
                <span>Pay Outstanding Balance →</span>
              </button>
            )}
          </div>

          <div className="glass-panel-3d" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, color: "#1e2923", marginTop: 0 }}>
              Tuition History & Payments
            </h3>
            <div className="invoice-history-list">
              {studentInvoices.map((inv) => (
                <div className="invoice-history-item" key={inv.id}>
                  <div>
                    <b>{inv.title}</b>
                    <small style={{ display: "block", color: "#6e7d72", marginTop: 2 }}>
                      Invoice #{inv.invoiceNo} · Due {inv.dueDate}
                    </small>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600, color: "#1e2923" }}>{formatINR(inv.amountDue)}</div>
                    <span
                      className={
                        inv.status === "PAID"
                          ? "status-badge-emerald"
                          : "status-badge-amber"
                      }
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : active === "Attendance" ? (
        /* ATTENDANCE HISTORY */
        <div className="glass-panel-3d" style={{ padding: 24 }}>
          <div className="panel-title-bar">
            <div>
              <span className="eyebrow-accent">Daily Check-ins</span>
              <h3>Recorded Attendance History</h3>
            </div>
          </div>

          <div className="glass-table-wrapper" style={{ marginTop: 16 }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Faculty Verification</th>
                </tr>
              </thead>
              <tbody>
                {studentAttendance.map((att) => (
                  <tr key={att.id}>
                    <td><b>{att.date}</b></td>
                    <td>{att.session}</td>
                    <td>
                      <span
                        className={
                          att.status === "PRESENT"
                            ? "status-badge-emerald"
                            : att.status === "LATE"
                            ? "status-badge-amber"
                            : "status-badge-rose"
                        }
                      >
                        {att.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "#74c69d", fontSize: 12 }}>
                        Verified by Karan Johar
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* REPORT CARDS & MARKS VIEW */
        <div className="glass-panel-3d" style={{ padding: 24 }}>
          <div className="panel-title-bar">
            <div>
              <span className="eyebrow-accent">Academic Transcripts</span>
              <h3>Term 2 Published Report Card</h3>
            </div>
            <button className="secondary-action-btn" onClick={() => window.print()}>
              <Printer size={15} />
              <span>Print Transcript</span>
            </button>
          </div>

          <div className="subject-marks-grid" style={{ marginTop: 20 }}>
            {(db.subjects || []).map((subject) => {
              const m = studentMarks.find((mark) => mark.subject === subject.name)
              const grade = m ? calculateGrade(m.marksObtained, m.maxMarks) : null
              return (
                <div className="subject-mark-card-3d" key={subject.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600, color: "#1e2923", fontSize: 15 }}>{subject.name}</div>
                    {grade ? <span className={`grade-letter-badge grade-${grade.letter.toLowerCase().replace("+", "-plus")}`}>{grade.letter}</span> : <span className="status-badge-amber">Pending</span>}
                  </div>

                  <div style={{ margin: "14px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: "#6e7d72" }}>{m ? `Exam: ${m.exam}` : "No marks published"}</span>
                      {grade && m && <b style={{ color: "#2e7246" }}>{m.marksObtained} / {m.maxMarks} ({grade.percentage}%)</b>}
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill emerald"
                        style={{ width: `${grade?.percentage || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SIMULATED PAYMENT MODAL */}
      {payModalOpen && unpaidInvoice && (
        <div className="modal-backdrop-3d" onClick={() => setPayModalOpen(false)}>
          <div className="modal-card-3d" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-3d">
              <div>
                <span className="eyebrow-accent">Secure Gateway</span>
                <h2>Simulate Fee Payment</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setPayModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 20, padding: 16, background: "rgba(68, 105, 80, 0.08)", borderRadius: 12, border: "1px solid rgba(68, 105, 80, 0.2)" }}>
              <div style={{ fontSize: 12, color: "#6e7d72" }}>Settling invoice:</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1e2923", marginTop: 2 }}>{unpaidInvoice.title}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#2e7246", marginTop: 6 }}>
                {formatINR(outstandingBalance(unpaidInvoice))}
              </div>
            </div>

            <div className="simulated-card-input-box">
              <label>
                Simulated Card Number
                <input readOnly value="4242 •••• •••• 4242" />
              </label>
              <div className="form-two-col">
                <label>
                  Expires
                  <input readOnly value="12/28" />
                </label>
                <label>
                  CVC
                  <input readOnly value="•••" />
                </label>
              </div>
            </div>

            <div className="modal-actions-3d" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="secondary-action-btn"
                onClick={() => setPayModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-action-btn"
                onClick={handlePay}
                disabled={paying}
              >
                {paying ? "Processing Transaction…" : `Confirm Payment (${formatINR(outstandingBalance(unpaidInvoice))}) →`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
