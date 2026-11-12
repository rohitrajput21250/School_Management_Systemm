import React, { useState } from "react"
import { Plus, Calendar, X, Megaphone } from "lucide-react"
import Tilt3DCard from "../3d/Tilt3DCard"
import { triggerConfetti } from "../3d/ConfettiBurst"
import { api, type Db, type User } from "../../lib/database"

interface PortalAnnouncementsViewProps {
  user: User
  db: Db
  refresh: () => Promise<void>
  act: (operation: () => Promise<unknown>, success: string) => Promise<void>
  canPublish: boolean
}

export default function PortalAnnouncementsView({
  user,
  db,
  refresh,
  act,
  canPublish,
}: PortalAnnouncementsViewProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState<string>("ALL")

  const filtered = db.announcements.filter((a) => {
    if (filter === "ALL") return true
    return a.audience === filter
  })

  return (
    <div className="portal-subview-container">
      <div className="subview-header">
        <div>
          <span className="eyebrow-accent">Campus Broadcasts</span>
          <h2>School Announcements</h2>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div className="view-toggle-pill">
            <button
              className={filter === "ALL" ? "active" : ""}
              onClick={() => setFilter("ALL")}
            >
              All
            </button>
            <button
              className={filter === "TEACHER" ? "active" : ""}
              onClick={() => setFilter("TEACHER")}
            >
              Faculty
            </button>
            <button
              className={filter === "GUARDIAN" ? "active" : ""}
              onClick={() => setFilter("GUARDIAN")}
            >
              Guardians
            </button>
          </div>

          {canPublish && (
            <button className="primary-action-btn" onClick={() => setModalOpen(true)}>
              <Plus size={16} />
              <span>Broadcast Update</span>
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state-3d">
          <Megaphone size={36} color="#74c69d" />
          <h3>No Announcements in this feed</h3>
          <p>Important campus circulars, schedules, and alerts will appear here.</p>
          {canPublish && (
            <button className="primary-action-btn" onClick={() => setModalOpen(true)}>
              Publish first update
            </button>
          )}
        </div>
      ) : (
        <div className="announcements-bento-grid">
          {filtered.map((item) => (
            <Tilt3DCard key={item.id} maxTilt={10} className="announcement-card-3d">
              <div className="announcement-card-content">
                <div className="announcement-meta-bar">
                  <span className="announcement-audience-tag">
                    {item.audience === "ALL"
                      ? "School-wide"
                      : item.audience === "TEACHER"
                      ? "Faculty Only"
                      : "Guardians"}
                  </span>
                  <span className="announcement-date">
                    <Calendar size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="announcement-title">{item.title}</h3>
                <p className="announcement-body">{item.body}</p>

                <div className="announcement-footer">
                  <small>Posted by {item.author}</small>
                  <span className="live-dot" />
                </div>
              </div>
            </Tilt3DCard>
          ))}
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {modalOpen && (
        <CreateAnnouncementModal
          user={user}
          onClose={() => setModalOpen(false)}
          refresh={refresh}
          act={act}
        />
      )}
    </div>
  )
}

function CreateAnnouncementModal({
  user,
  onClose,
  refresh,
  act,
}: {
  user: User
  onClose: () => void
  refresh: () => Promise<void>
  act: (operation: () => Promise<unknown>, success: string) => Promise<void>
}) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [audience, setAudience] = useState("ALL")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await act(
        () => api.publishAnnouncement(user, title, body, audience),
        "Announcement broadcast to community feed!"
      )
      triggerConfetti({ count: 60 })
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
            <span className="eyebrow-accent">Campus Broadcast</span>
            <h2>Create Announcement</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-3d">
          <label>
            Headline / Subject
            <input
              required
              placeholder="e.g. Annual STEM & Arts Exhibition Schedule"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label>
            Message Body
            <textarea
              required
              rows={4}
              placeholder="Write a clear notification for students, teachers, or parents…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>

          <label>
            Target Audience
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              <option value="ALL">All Campus (Everyone)</option>
              <option value="TEACHER">Faculty & Staff Only</option>
              <option value="GUARDIAN">Parents & Guardians Only</option>
            </select>
          </label>

          <div className="modal-actions-3d">
            <button type="button" className="secondary-action-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-action-btn" disabled={loading}>
              {loading ? "Publishing…" : "Broadcast Now →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
