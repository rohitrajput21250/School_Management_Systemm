import React, { useState } from "react"
import { ClipboardCheck, Calendar, Sun, Moon, Award, Printer, Check, CheckCheck, Clock, XCircle } from "lucide-react"
import Tilt3DCard from "../3d/Tilt3DCard"
import { triggerConfetti } from "../3d/ConfettiBurst"
import { api, calculateGrade, type Db, type User, type AttendanceStatus } from "../../lib/database"

interface PortalTeacherViewProps {
  user: User
  db: Db
  active: string
  refresh: () => Promise<void>
  act: (operation: () => Promise<unknown>, success: string) => Promise<void>
}

export default function PortalTeacherView({
  user,
  db,
  active,
  refresh,
  act,
}: PortalTeacherViewProps) {
  const [date, setDate] = useState("2026-11-13")
  const [session, setSession] = useState<"MORNING" | "AFTERNOON">("MORNING")
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({})
  const [marksMap, setMarksMap] = useState<Record<string, number>>({})
  const [selectedSubject, setSelectedSubject] = useState("Mathematics")

  const assigned = db.students

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {}
    assigned.forEach((s) => {
      updated[s.id] = status
    })
    setStatusMap(updated)
  }

  const handleSubmitAttendance = async () => {
    await act(async () => {
      for (const student of assigned) {
        await api.submitAttendance(user, {
          studentId: student.id,
          sectionId: student.sectionId,
          date,
          session,
          status: statusMap[student.id] || "PRESENT",
        })
      }
      triggerConfetti({ count: 80 })
    }, `Attendance recorded for ${assigned.length} students on ${date} (${session.toLowerCase()})`)
  }

  const handleSaveMark = async (studentId: string, name: string) => {
    const value =
      marksMap[studentId] ??
      db.marks.find((m) => m.studentId === studentId)?.marksObtained ??
      85
    await act(
      () => api.saveMarks(user, studentId, selectedSubject, "Midterm", value, 100),
      `${selectedSubject} grade saved for ${name} (${value}/100)`
    )
    triggerConfetti({ count: 40 })
  }

  if (active === "Report cards") {
    const reportRows = assigned.map((student) => {
      const studentMarks = db.marks.filter((mark) => mark.studentId === student.id)
      const average = studentMarks.length
        ? Math.round(studentMarks.reduce((sum, mark) => sum + calculateGrade(mark.marksObtained, mark.maxMarks).percentage, 0) / studentMarks.length)
        : 0
      return { student, studentMarks, average }
    }).sort((a, b) => b.average - a.average)
    const publishedCount = reportRows.reduce((count, row) => count + row.studentMarks.length, 0)
    const totalSlots = assigned.length * (db.subjects?.length || 5)
    const topStudent = reportRows[0]

    return (
      <div className="portal-subview-container">
        <div className="subview-header">
          <div>
            <span className="eyebrow-accent">Academic Intelligence</span>
            <h2>Report Card Studio</h2>
          </div>
          <button className="secondary-action-btn" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Print Class Summary</span>
          </button>
        </div>

        <div className="kpi-grid-3d" style={{ marginBottom: 24 }}>
          <div className="kpi-card-3d"><div className="kpi-card-inner"><span className="kpi-label">Class Average</span><div className="kpi-number">{reportRows.length ? Math.round(reportRows.reduce((sum, row) => sum + row.average, 0) / reportRows.length) : 0}%</div><small className="kpi-desc">Across published marks</small></div></div>
          <div className="kpi-card-3d"><div className="kpi-card-inner"><span className="kpi-label">Report Completion</span><div className="kpi-number">{totalSlots ? Math.round((publishedCount / totalSlots) * 100) : 0}%</div><small className="kpi-desc">{publishedCount} of {totalSlots} subject results</small></div></div>
          <div className="kpi-card-3d"><div className="kpi-card-inner"><span className="kpi-label">Top Performer</span><div className="kpi-number" style={{ fontSize: 22 }}>{topStudent ? `${topStudent.student.firstName} ${topStudent.student.lastName}` : "—"}</div><small className="kpi-desc">{topStudent ? `${topStudent.average}% overall average` : "No results yet"}</small></div></div>
        </div>

        <div className="glass-panel-3d" style={{ padding: 24 }}>
          <div className="panel-title-bar">
            <div>
              <span className="eyebrow-accent">Class Ranking</span>
              <h3>Student Progress Snapshot</h3>
            </div>
            <span style={{ color: "#6e7d72", fontSize: 12 }}>Term 2 Midterm</span>
          </div>
          <div className="glass-table-wrapper" style={{ marginTop: 16 }}>
            <table className="glass-table">
              <thead><tr><th>Rank</th><th>Student</th><th>Subjects Published</th><th>Average</th><th>Readiness</th></tr></thead>
              <tbody>
                {reportRows.map((row, index) => (
                  <tr key={row.student.id}>
                    <td><b>#{index + 1}</b></td>
                    <td><b>{row.student.firstName} {row.student.lastName}</b><small style={{ display: "block", color: "#6e7d72" }}>{row.student.admissionNo}</small></td>
                    <td>{row.studentMarks.length} / {db.subjects?.length || 5}</td>
                    <td><b style={{ color: row.average >= 75 ? "#2e7246" : "#b7791f" }}>{row.average}%</b></td>
                    <td><span className={row.average >= 75 ? "status-badge-emerald" : "status-badge-amber"}>{row.average >= 75 ? "On track" : "Needs support"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Attendance Tab
  if (active === "Attendance") {
    return (
      <div className="portal-subview-container">
        <div className="subview-header">
          <div>
            <span className="eyebrow-accent">All assigned students</span>
            <h2>Daily Attendance Register</h2>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="secondary-action-btn" onClick={() => handleMarkAll("PRESENT")}>
              <CheckCheck size={14} />
              <span>Mark All Present</span>
            </button>
            <button className="primary-action-btn" onClick={handleSubmitAttendance}>
              <ClipboardCheck size={16} />
              <span>Submit Attendance</span>
            </button>
          </div>
        </div>

        {/* Date & Session Controls Bar */}
        <div className="attendance-toolbar-3d">
          <div className="control-group">
            <Calendar size={16} color="#446950" />
            <label>Date</label>
            <input
              type="date"
              value={date}
              min="2026-11-01"
              max="2026-11-13"
              onChange={(e) => setDate(e.target.value)}
              className="glass-date-input"
            />
          </div>

          <div className="control-group">
            {session === "MORNING" ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#38bdf8" />}
            <label>Session</label>
            <div className="session-toggle-pill">
              <button
                className={session === "MORNING" ? "active" : ""}
                onClick={() => setSession("MORNING")}
              >
                Morning
              </button>
              <button
                className={session === "AFTERNOON" ? "active" : ""}
                onClick={() => setSession("AFTERNOON")}
              >
                Afternoon
              </button>
            </div>
          </div>
        </div>

        {/* Student Attendance 3D Cards */}
        <div className="attendance-grid-3d">
          {assigned.map((s, index) => {
            const currentStatus = statusMap[s.id] || "PRESENT"
            return (
              <Tilt3DCard key={s.id} maxTilt={8} className="attendance-student-card">
                <div className="attendance-card-body">
                  <div className="student-profile-row">
                    <div className="student-avatar-sphere small">
                      {s.firstName[0]}
                    </div>
                    <div>
                      <div className="student-card-name">
                        {s.firstName} {s.lastName}
                      </div>
                      <small className="student-card-adm">{s.admissionNo}</small>
                    </div>
                  </div>

                  {/* 3 Tactile Status Buttons */}
                  <div className="status-selector-row">
                    <button
                      type="button"
                      className={`status-btn present ${currentStatus === "PRESENT" ? "selected" : ""}`}
                      onClick={() => setStatusMap({ ...statusMap, [s.id]: "PRESENT" })}
                    >
                      <Check size={13} />
                      <span>Present</span>
                    </button>

                    <button
                      type="button"
                      className={`status-btn late ${currentStatus === "LATE" ? "selected" : ""}`}
                      onClick={() => setStatusMap({ ...statusMap, [s.id]: "LATE" })}
                    >
                      <Clock size={13} />
                      <span>Late</span>
                    </button>

                    <button
                      type="button"
                      className={`status-btn absent ${currentStatus === "ABSENT" ? "selected" : ""}`}
                      onClick={() => setStatusMap({ ...statusMap, [s.id]: "ABSENT" })}
                    >
                      <XCircle size={13} />
                      <span>Absent</span>
                    </button>
                  </div>
                </div>
              </Tilt3DCard>
            )
          })}
        </div>
      </div>
    )
  }

  // Exam Marks & Report Cards Tab
  return (
    <div className="portal-subview-container">
      <div className="subview-header">
        <div>
          <span className="eyebrow-accent">Curriculum Assessment</span>
          <h2>Midterm Examination Marks</h2>
        </div>

        <button className="secondary-action-btn" onClick={() => window.print()}>
          <Printer size={15} />
          <span>Print Report Cards</span>
        </button>
      </div>

      <div className="glass-panel-3d" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Award size={20} color="#446950" />
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: "#1e2923" }}>Term 2 Midterm</h3>
              <div role="tablist" aria-label="Select subject" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {(db.subjects?.length ? db.subjects : [
                  { id: "sub-math", name: "Mathematics", code: "MATH-10" },
                  { id: "sub-english", name: "English", code: "ENG-10" },
                  { id: "sub-science", name: "Science", code: "SCI-10" },
                  { id: "sub-social", name: "Social Studies", code: "SST-10" },
                  { id: "sub-computer", name: "Computer Science", code: "CS-10" },
                ]).map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedSubject === subject.name}
                    onClick={() => setSelectedSubject(subject.name)}
                    style={{
                      padding: "7px 11px",
                      borderRadius: 999,
                      border: `1px solid ${selectedSubject === subject.name ? "#4a6b53" : "#dfe7df"}`,
                      background: selectedSubject === subject.name ? "#4a6b53" : "#fff",
                      color: selectedSubject === subject.name ? "#fff" : "#446950",
                      cursor: "pointer",
                      transition: "all 180ms ease",
                    }}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 12, color: "#6e7d72" }}>Maximum Score: 100</span>
        </div>

        <div className="marks-list-3d">
          {assigned.map((s) => {
            const currentScore =
              marksMap[s.id] ??
              db.marks.find((m) => m.studentId === s.id && m.subject === selectedSubject)?.marksObtained ??
              85
            const grade = calculateGrade(currentScore, 100)
            return (
              <div className="mark-student-row-3d" key={s.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div className="student-avatar-sphere small">{s.firstName[0]}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: "#1e2923", fontSize: 14 }}>
                      {s.firstName} {s.lastName}
                    </div>
                    <small style={{ color: "#6e7d72", fontSize: 11 }}>{s.admissionNo}</small>
                  </div>
                </div>

                <div className="mark-controls">
                  <div className="mark-input-wrap">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={currentScore}
                      onChange={(e) =>
                        setMarksMap({ ...marksMap, [s.id]: Math.min(100, Math.max(0, Number(e.target.value))) })
                      }
                      className="mark-input-field"
                    />
                    <span>/ 100</span>
                  </div>

                  <span className={`grade-letter-badge grade-${grade.letter.toLowerCase().replace("+", "-plus")}`}>
                    {grade.letter}
                  </span>

                  <button
                    className="save-mark-btn"
                    onClick={() => handleSaveMark(s.id, `${s.firstName} ${s.lastName}`)}
                  >
                    Save
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
