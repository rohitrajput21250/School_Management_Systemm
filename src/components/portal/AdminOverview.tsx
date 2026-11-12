import React from "react"
import { Users, TrendingUp, DollarSign, ShieldAlert, Sparkles, Plus, ArrowUpRight, Clock, RefreshCw } from "lucide-react"
import Tilt3DCard from "../3d/Tilt3DCard"
import Hero3DCanvas from "../3d/Hero3DCanvas"
import type { Db, User } from "../../lib/database"
import { formatINR, outstandingBalance } from "../../lib/database"

interface AdminOverviewProps {
  user: User
  db: Db
  refresh: () => Promise<void>
  onNavigate: (section: string) => void
  onOpenAddStudent: () => void
  onOpenAddInvoice: () => void
}

export default function AdminOverview({
  user,
  db,
  refresh,
  onNavigate,
  onOpenAddStudent,
  onOpenAddInvoice,
}: AdminOverviewProps) {
  const pendingTotal = db.invoices.reduce((sum, i) => sum + outstandingBalance(i), 0)
  const paidInvoices = db.invoices.filter((i) => i.status === "PAID").length
  const attendanceRate = db.attendance.length
    ? Math.round((db.attendance.filter((a) => a.status === "PRESENT").length / db.attendance.length) * 100)
    : 85

  return (
    <div className="admin-overview-container">
      {/* 3D Atmospheric Hero Banner */}
      <div className="admin-hero-banner-3d">
        <Hero3DCanvas accentColor="#4a6b53" />
        <div className="hero-banner-content">
          <div className="hero-badge-pill">
            <Sparkles size={13} color="#446950" />
            <span>3D Interactive School Operating System</span>
          </div>
          <h2>
            Welcome back, <em>{user.name.split(" ")[0]}.</em>
          </h2>
          <p>
            Algions Academy is running smoothly. Classes, attendance, and finances are synced in real time across all roles.
          </p>

          <div className="hero-action-buttons">
            <button className="banner-primary-btn" onClick={onOpenAddStudent}>
              <Plus size={16} />
              <span>Enroll Student</span>
            </button>
            <button className="banner-secondary-btn" onClick={() => onNavigate("Fee ledger")}>
              <span>View Ledger</span>
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 3D KPI Tilt Cards Deck */}
      <div className="kpi-grid-3d">
        <Tilt3DCard maxTilt={10} className="kpi-card-3d">
          <div className="kpi-card-inner">
            <div className="kpi-header">
              <span className="kpi-label">Total Enrollment</span>
              <div className="kpi-icon-bubble emerald">
                <Users size={18} />
              </div>
            </div>
            <div className="kpi-number">{db.students.length}</div>
            <div className="kpi-footer">
              <span className="trend-pill positive">
                <TrendingUp size={12} /> Active Students
              </span>
              <small>Across 3 Grade Sections</small>
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard maxTilt={10} className="kpi-card-3d">
          <div className="kpi-card-inner">
            <div className="kpi-header">
              <span className="kpi-label">Today's Attendance</span>
              <div className="kpi-icon-bubble blue">
                <Sparkles size={18} />
              </div>
            </div>
            <div className="kpi-number">{attendanceRate}%</div>
            <div className="kpi-footer">
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill emerald"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
              <small>Submitted by faculty</small>
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard maxTilt={10} className="kpi-card-3d">
          <div className="kpi-card-inner">
            <div className="kpi-header">
              <span className="kpi-label">Outstanding Tuition</span>
              <div className="kpi-icon-bubble amber">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="kpi-number">{formatINR(pendingTotal)}</div>
            <div className="kpi-footer">
              <span className="trend-pill amber">
                {paidInvoices} of {db.invoices.length} Paid
              </span>
              <small>Term 2 Tuition</small>
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard maxTilt={10} className="kpi-card-3d">
          <div className="kpi-card-inner">
            <div className="kpi-header">
              <span className="kpi-label">Audit & Governance</span>
              <div className="kpi-icon-bubble rose">
                <ShieldAlert size={18} />
              </div>
            </div>
            <div className="kpi-number">{db.auditLogs.length}</div>
            <div className="kpi-footer">
              <span className="live-pulse-badge">
                <span className="live-dot" /> Live Ledger
              </span>
              <small>Tamper-proof logs</small>
            </div>
          </div>
        </Tilt3DCard>
      </div>

      <div className="glass-panel-3d" style={{ padding: 24, marginBottom: 24 }}>
        <div className="panel-title-bar">
          <div>
            <span className="eyebrow-accent">Academic Catalog</span>
            <h3>All Subjects</h3>
          </div>
          <span style={{ color: "#6e7d72", fontSize: 12 }}>{db.subjects.length} subjects</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          {db.subjects.map((subject) => (
            <div key={subject.id} style={{ padding: "10px 14px", border: "1px solid #dfe7df", borderRadius: 10, background: "#fff" }}>
              <b style={{ display: "block", color: "#1e2923", fontSize: 13 }}>{subject.name}</b>
              <small style={{ color: "#6e7d72" }}>{subject.code}</small>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics & Activity Split Grid */}
      <div className="analytics-split-grid">
        {/* Weekly Attendance 3D Chart Panel */}
        <div className="glass-panel-3d chart-panel">
          <div className="panel-title-bar">
            <div>
              <span className="eyebrow-accent">Attendance Pulse</span>
              <h3>Weekly Engagement Overview</h3>
            </div>
            <div className="chart-legend">
              <span className="legend-item"><i className="leg-dot emerald" /> Present (avg 94%)</span>
              <span className="legend-item"><i className="leg-dot amber" /> Late / Excused</span>
            </div>
          </div>

          <div className="bars-3d-container">
            {[
              { day: "Mon", rate: 96, count: "96%" },
              { day: "Tue", rate: 92, count: "92%" },
              { day: "Wed", rate: 98, count: "98%" },
              { day: "Thu", rate: 89, count: "89%" },
              { day: "Fri", rate: 95, count: "95%" },
            ].map((bar, i) => (
              <div className="bar-column-3d" key={bar.day}>
                <div className="bar-tooltip">{bar.count}</div>
                <div className="bar-tube-3d">
                  <div
                    className="bar-fill-3d"
                    style={{
                      height: `${bar.rate}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                </div>
                <span className="bar-day-label">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="glass-panel-3d activity-panel">
          <div className="panel-title-bar">
            <div>
              <span className="eyebrow-accent">Real-Time Ledger</span>
              <h3>Recent System Events</h3>
            </div>
            <button className="icon-refresh-btn" onClick={() => void refresh()} title="Sync now">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="activity-timeline-3d">
            {db.auditLogs.slice(0, 5).map((log, idx) => (
              <div className="timeline-event-3d" key={log.id || idx}>
                <div className="timeline-node">
                  <div className="timeline-pulse" />
                </div>
                <div className="timeline-info">
                  <div className="timeline-title-row">
                    <b>{log.action}</b>
                    <time><Clock size={11} style={{ marginRight: 3, verticalAlign: -1 }} />{log.createdAt}</time>
                  </div>
                  <div className="timeline-sub">
                    <span className="entity-chip">{log.entityType}</span>
                    <span className="actor-text">by {log.actor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
