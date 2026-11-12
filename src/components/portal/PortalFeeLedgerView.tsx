import React, { useState } from "react"
import { Plus, CheckCircle2, AlertCircle, Clock, X } from "lucide-react"
import Tilt3DCard from "../3d/Tilt3DCard"
import { triggerPaymentCelebration } from "../3d/ConfettiBurst"
import { api, formatINR, outstandingBalance, type Db, type User, type Invoice } from "../../lib/database"

interface PortalFeeLedgerViewProps {
  user: User
  db: Db
  refresh: () => Promise<void>
  act: (operation: () => Promise<unknown>, success: string) => Promise<void>
}

export default function PortalFeeLedgerView({
  user,
  db,
  refresh,
  act,
}: PortalFeeLedgerViewProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const totalBilled = db.invoices.reduce((sum, i) => sum + i.amountDue, 0)
  const totalPaid = db.invoices.reduce((sum, i) => sum + i.payments, 0)
  const totalPending = totalBilled - totalPaid

  const handleSimulatePayment = async (inv: Invoice) => {
    const bal = outstandingBalance(inv)
    if (bal <= 0) return
    await act(async () => {
      await api.pay(user, inv.id, bal)
      triggerPaymentCelebration()
    }, `Payment of ${formatINR(bal)} recorded for invoice ${inv.invoiceNo}!`)
  }

  return (
    <div className="portal-subview-container">
      {/* Subview Header */}
      <div className="subview-header">
        <div>
          <span className="eyebrow-accent">Treasury & Reconciliation</span>
          <h2>School Fee Ledger</h2>
        </div>

        <button className="primary-action-btn" onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="kpi-grid-3d" style={{ marginBottom: 24 }}>
        <Tilt3DCard maxTilt={8} className="kpi-card-3d">
          <div className="kpi-card-inner">
            <span className="kpi-label">Total Invoiced</span>
            <div className="kpi-number">{formatINR(totalBilled)}</div>
            <small className="kpi-desc">Across all terms</small>
          </div>
        </Tilt3DCard>

        <Tilt3DCard maxTilt={8} className="kpi-card-3d">
          <div className="kpi-card-inner">
            <span className="kpi-label">Reconciled Collections</span>
            <div className="kpi-number" style={{ color: "#2e7246" }}>
              {formatINR(totalPaid)}
            </div>
            <div className="progress-bar-bg" style={{ marginTop: 8 }}>
              <div
                className="progress-bar-fill emerald"
                style={{ width: `${totalBilled ? (totalPaid / totalBilled) * 100 : 0}%` }}
              />
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard maxTilt={8} className="kpi-card-3d">
          <div className="kpi-card-inner">
            <span className="kpi-label">Outstanding Arrears</span>
            <div className="kpi-number" style={{ color: "#c85a67" }}>
              {formatINR(totalPending)}
            </div>
            <small className="kpi-desc">{db.invoices.filter((i) => outstandingBalance(i) > 0).length} Unsettled Accounts</small>
          </div>
        </Tilt3DCard>
      </div>

      {/* Ledger Glass Table */}
      <div className="glass-table-wrapper">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Student</th>
              <th>Term / Title</th>
              <th>Due Date</th>
              <th>Billed</th>
              <th>Remaining</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Simulate Action</th>
            </tr>
          </thead>
          <tbody>
            {db.invoices.map((inv) => {
              const student = db.students.find((s) => s.id === inv.studentId)
              const bal = outstandingBalance(inv)
              return (
                <tr key={inv.id}>
                  <td><code>{inv.invoiceNo}</code></td>
                  <td>
                    <b>{student ? `${student.firstName} ${student.lastName}` : "—"}</b>
                  </td>
                  <td>{inv.title}</td>
                  <td>
                    <span style={{ color: "#6e7d72", fontSize: 12 }}>{inv.dueDate}</span>
                  </td>
                  <td>{formatINR(inv.amountDue)}</td>
                  <td>
                    <b style={{ color: bal > 0 ? "#c85a67" : "#2e7246" }}>
                      {formatINR(bal)}
                    </b>
                  </td>
                  <td>
                    {inv.status === "PAID" ? (
                      <span className="status-badge-emerald">
                        <CheckCircle2 size={12} style={{ marginRight: 4 }} /> Paid
                      </span>
                    ) : inv.status === "PARTIAL" ? (
                      <span className="status-badge-amber">
                        <Clock size={12} style={{ marginRight: 4 }} /> Partial
                      </span>
                    ) : (
                      <span className="status-badge-rose">
                        <AlertCircle size={12} style={{ marginRight: 4 }} /> Unpaid
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {bal > 0 ? (
                      <button
                        className="simulate-pay-btn"
                        onClick={() => handleSimulatePayment(inv)}
                      >
                        Settle Balance ↗
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: "#388e5a", fontWeight: 600 }}>Reconciled ✓</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* CREATE INVOICE MODAL */}
      {modalOpen && (
        <CreateInvoiceModal
          user={user}
          db={db}
          onClose={() => setModalOpen(false)}
          refresh={refresh}
        />
      )}
    </div>
  )
}

function CreateInvoiceModal({
  user,
  db,
  onClose,
  refresh,
}: {
  user: User
  db: Db
  onClose: () => void
  refresh: () => Promise<void>
}) {
  const [studentId, setStudentId] = useState(db.students[0]?.id || "")
  const [title, setTitle] = useState("Term 2 Tuition & Materials")
  const [amount, setAmount] = useState("1800")
  const [dueDate, setDueDate] = useState("2026-12-01")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createInvoice(user, {
        studentId,
        title,
        amountDue: Number(amount),
        dueDate,
      })
      triggerPaymentCelebration()
      await refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop-3d" onClick={onClose}>
      <div className="modal-card-3d" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-3d">
          <div>
            <span className="eyebrow-accent">Billing Issue</span>
            <h2>Create New Invoice</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-3d">
          <label>
            Assign to Student
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              {db.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.admissionNo})
                </option>
              ))}
            </select>
          </label>

          <label>
            Invoice Description
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <div className="form-two-col">
            <label>
              Amount ($)
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label>
              Due Date
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
          </div>

          <div className="modal-actions-3d">
            <button type="button" className="secondary-action-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-action-btn" disabled={loading}>
              {loading ? "Generating…" : "Issue Invoice →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
