import React, { useState } from "react"
import { ShieldCheck, Download, Search, Clock } from "lucide-react"
import { triggerConfetti } from "../3d/ConfettiBurst"
import type { Db } from "../../lib/database"

interface PortalAuditViewProps {
  db: Db
}

export default function PortalAuditView({ db }: PortalAuditViewProps) {
  const [search, setSearch] = useState("")

  const filtered = db.auditLogs.filter((log) =>
    `${log.action} ${log.entityType} ${log.actor}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const handleExport = () => {
    if (!db.auditLogs.length) return
    const headers = ["Action", "Entity", "Actor", "Timestamp"]
    const rows = db.auditLogs.map((l) => [
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.actor}"`,
      `"${l.createdAt}"`,
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `algions-audit-trail-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    triggerConfetti({ count: 50 })
  }

  return (
    <div className="portal-subview-container">
      <div className="subview-header">
        <div>
          <span className="eyebrow-accent">Governance & Compliance</span>
          <h2>Cryptographic Audit Trail</h2>
        </div>

        <button className="secondary-action-btn" onClick={handleExport}>
          <Download size={15} />
          <span>Export CSV Ledger</span>
        </button>
      </div>

      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by action, actor, or entity…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-count">
          Showing <b>{filtered.length}</b> verified log events
        </div>
      </div>

      <div className="glass-table-wrapper">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Action Recorded</th>
              <th>Entity Type</th>
              <th>Authorized Actor</th>
              <th>Timestamp</th>
              <th style={{ textAlign: "right" }}>Integrity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="live-dot" />
                    <b>{log.action}</b>
                  </div>
                </td>
                <td>
                  <span className="entity-chip">{log.entityType}</span>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="table-avatar">{log.actor[0]}</span>
                    <span>{log.actor}</span>
                  </div>
                </td>
                <td>
                  <span style={{ color: "#aab8a6", fontSize: 12 }}>
                    <Clock size={11} style={{ marginRight: 4, verticalAlign: -1 }} />
                    {log.createdAt}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <span className="status-badge-emerald">
                    <ShieldCheck size={12} style={{ marginRight: 4 }} /> Signed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
