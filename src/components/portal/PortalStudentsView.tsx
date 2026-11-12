import React, { useState } from "react"
import { Search, Plus, Trash2, LayoutGrid, List, UserCheck, X } from "lucide-react"
import Tilt3DCard from "../3d/Tilt3DCard"
import { triggerConfetti } from "../3d/ConfettiBurst"
import { api, type Db, type User } from "../../lib/database"

interface PortalStudentsViewProps {
  user: User
  db: Db
  refresh: () => Promise<void>
  act: (operation: () => Promise<unknown>, success: string) => Promise<void>
}

export default function PortalStudentsView({
  user,
  db,
  refresh,
  act,
}: PortalStudentsViewProps) {
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [formOpen, setFormOpen] = useState(false)

  const filtered = db.students.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.admissionNo}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove student "${name}"?`)) {
      await act(() => api.deleteStudent(user, id), `Student ${name} deleted.`)
    }
  }

  return (
    <div className="portal-subview-container">
      {/* View Header */}
      <div className="subview-header">
        <div>
          <span className="eyebrow-accent">Enrollment & Records</span>
          <h2>Student Directory</h2>
        </div>

        <div className="subview-actions">
          <div className="view-toggle-pill">
            <button
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
              title="3D Card Grid"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              className={viewMode === "table" ? "active" : ""}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>

          <button className="primary-action-btn" onClick={() => setFormOpen(true)}>
            <Plus size={16} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by student name or admission ID (e.g. ALG-24001)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="filter-count">
          Showing <b>{filtered.length}</b> of {db.students.length} students
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === "grid" ? (
        <div className="students-3d-grid">
          {filtered.map((student) => {
            const section = db.sections.find((s) => s.id === student.sectionId)
            return (
              <Tilt3DCard key={student.id} maxTilt={14} className="student-card-3d">
                <div className="student-card-content">
                  <div className="student-card-top">
                    <div className="student-avatar-sphere">
                      {student.firstName[0]}
                    </div>
                    <span className="student-grade-badge">
                      {section ? `${section.grade} · ${section.name}` : "General"}
                    </span>
                  </div>

                  <div className="student-details">
                    <h3 className="student-fullname">
                      {student.firstName} {student.lastName}
                    </h3>
                    <div className="student-adm-tag">
                      <span>Admission:</span> <code>{student.admissionNo}</code>
                    </div>
                    <div className="student-meta-item">
                      <UserCheck size={13} color="#74c69d" />
                      <span>Guardian: Urvi Singh</span>
                    </div>
                  </div>

                  <div className="student-card-actions">
                    <button
                      className="delete-student-btn"
                      onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)}
                      title="Remove record"
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </Tilt3DCard>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="glass-table-wrapper">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No.</th>
                <th>Grade / Section</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => {
                const section = db.sections.find((s) => s.id === student.sectionId)
                return (
                  <tr key={student.id}>
                    <td>
                      <div className="table-student-name">
                        <span className="table-avatar">{student.firstName[0]}</span>
                        <b>{student.firstName} {student.lastName}</b>
                      </div>
                    </td>
                    <td><code>{student.admissionNo}</code></td>
                    <td>{section ? `${section.grade} · ${section.name}` : "General"}</td>
                    <td>
                      <span className="status-badge-emerald">Enrolled</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="delete-icon-btn"
                        onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {formOpen && (
        <AddStudentModal
          user={user}
          db={db}
          onClose={() => setFormOpen(false)}
          refresh={refresh}
        />
      )}
    </div>
  )
}

function AddStudentModal({
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
  const [values, setValues] = useState({
    admissionNo: `ALG-${Math.floor(24000 + Math.random() * 999)}`,
    firstName: "",
    lastName: "",
    sectionId: db.sections[0]?.id || "",
    guardianId: "u-guardian",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api.saveStudent(user, values)
      triggerConfetti({ count: 70 })
      await refresh()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to register this student.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop-3d" onClick={onClose}>
      <div className="modal-card-3d" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-3d">
          <div>
            <span className="eyebrow-accent">New Enrollment</span>
            <h2>Register Student</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-3d">
          {error && <div className="form-error" role="alert">{error}</div>}
          <label>
            Admission Number
            <input
              required
              value={values.admissionNo}
              onChange={(e) => setValues({ ...values, admissionNo: e.target.value })}
            />
          </label>

          <div className="form-two-col">
            <label>
              First Name
              <input
                required
                placeholder="e.g. Leo"
                value={values.firstName}
                onChange={(e) => setValues({ ...values, firstName: e.target.value })}
              />
            </label>
            <label>
              Last Name
              <input
                required
                placeholder="e.g. Vance"
                value={values.lastName}
                onChange={(e) => setValues({ ...values, lastName: e.target.value })}
              />
            </label>
          </div>

          <label>
            Academic Section
            <select
              value={values.sectionId}
              onChange={(e) => setValues({ ...values, sectionId: e.target.value })}
            >
              {db.sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.grade} · {sec.name}
                </option>
              ))}
            </select>
          </label>

          <div className="modal-actions-3d">
            <button type="button" className="secondary-action-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-action-btn" disabled={loading}>
              {loading ? "Registering…" : "Save Student →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
