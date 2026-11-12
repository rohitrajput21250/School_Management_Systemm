import React, { useEffect, useState, useRef } from "react"
import { api, type Db, type User, users } from "../../lib/database"
import PortalHeader from "./PortalHeader"
import PortalSidebar from "./PortalSidebar"
import CommandPalette from "./CommandPalette"
import AdminOverview from "./AdminOverview"
import PortalStudentsView from "./PortalStudentsView"
import PortalFeeLedgerView from "./PortalFeeLedgerView"
import PortalTeacherView from "./PortalTeacherView"
import PortalGuardianView from "./PortalGuardianView"
import PortalAnnouncementsView from "./PortalAnnouncementsView"
import PortalAuditView from "./PortalAuditView"
import { CheckCircle2, X } from "lucide-react"

interface PortalMasterProps {
  initialUser: User
  onSignOut: () => void
}

export default function PortalMaster({ initialUser, onSignOut }: PortalMasterProps) {
  const [user, setUser] = useState<User>(initialUser)
  const [db, setDb] = useState<Db | null>(null)
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(
    initialUser.role === "ADMIN"
      ? "Overview"
      : initialUser.role === "TEACHER"
      ? "Attendance"
      : "My student"
  )
  const [notice, setNotice] = useState("")
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [soundActive, setSoundActive] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Load database snapshot
  const refresh = async () => {
    setLoading(true)
    try {
      const snap = await api.snapshot()
      setDb(snap)
    } catch {
      setNotice("Unable to refresh live records.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [user])

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  // Dynamic Navigation items per role
  const navItems =
    user.role === "ADMIN"
      ? ["Overview", "Students", "Fee ledger", "Announcements", "Audit trail"]
      : user.role === "TEACHER"
      ? ["Attendance", "Exam marks", "Report cards", "Announcements"]
      : ["My student", "Attendance", "Report cards", "Fees", "Announcements"]

  // Action wrapper for API operations
  const act = async (operation: () => Promise<unknown>, successMessage: string) => {
    try {
      await operation()
      setNotice(successMessage)
      await refresh()
    } catch (e: any) {
      setNotice(e?.message ? `${e.message}` : "Action could not be completed.")
    }
  }

  // Quick switch role
  const handleSwitchRole = async (targetRole: "ADMIN" | "TEACHER" | "GUARDIAN") => {
    const found = users.find((u) => u.role === targetRole)
    if (found) {
      try {
        const authenticatedUser = await api.login(found.email, found.password)
        setUser(authenticatedUser)
      } catch {
        setUser(found)
      }
      setActive(
        targetRole === "ADMIN"
          ? "Overview"
          : targetRole === "TEACHER"
          ? "Attendance"
          : "My student"
      )
      setNotice(`Switched to ${targetRole.toLowerCase()} preview mode.`)
    }
  }

  // Subtle ambient audio tone on demand
  const handleToggleSound = () => {
    if (!soundActive) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (AudioCtx) {
          const ctx = new AudioCtx()
          audioCtxRef.current = ctx
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sine"
          osc.frequency.value = 220
          gain.gain.value = 0.05
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start()
          setSoundActive(true)
        }
      } catch {
        setSoundActive(false)
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
        audioCtxRef.current = null
      }
      setSoundActive(false)
    }
  }

  return (
    <div className="portal-root-3d">
      {/* Sidebar Navigation */}
      <PortalSidebar
        user={user}
        navItems={navItems}
        activeItem={active}
        onSelectNav={(item) => setActive(item)}
        onSignOut={onSignOut}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main Workspace Area */}
      <div className="portal-content-wrapper">
        <PortalHeader
          user={user}
          activeTitle={active === "Overview" ? `Overview · ${user.name.split(" ")[0]}` : active}
          breadcrumb={`${user.role.toLowerCase()} / ${active.toLowerCase()}`}
          onOpenPalette={() => setPaletteOpen(true)}
          onSignOut={onSignOut}
          onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
          mobileNavOpen={mobileNavOpen}
          onSwitchRole={handleSwitchRole}
          soundActive={soundActive}
          onToggleSound={handleToggleSound}
        />

        {/* Global Toast Notification */}
        {notice && (
          <div className="portal-toast-3d" role="status">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={16} color="#4ade80" />
              <span>{notice}</span>
            </div>
            <button className="toast-dismiss-btn" onClick={() => setNotice("")}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Dynamic Views */}
        <main className="portal-view-viewport">
          {loading || !db ? (
            <div className="loading-card-3d">
              <div className="loading-pulse-ring" />
              <p>Connecting to Algions Secure Node…</p>
            </div>
          ) : user.role === "ADMIN" ? (
            /* ADMIN VIEWS */
            active === "Overview" ? (
              <AdminOverview
                user={user}
                db={db}
                refresh={refresh}
                onNavigate={(sec) => setActive(sec)}
                onOpenAddStudent={() => setActive("Students")}
                onOpenAddInvoice={() => setActive("Fee ledger")}
              />
            ) : active === "Students" ? (
              <PortalStudentsView
                user={user}
                db={db}
                refresh={refresh}
                act={act}
              />
            ) : active === "Fee ledger" ? (
              <PortalFeeLedgerView
                user={user}
                db={db}
                refresh={refresh}
                act={act}
              />
            ) : active === "Announcements" ? (
              <PortalAnnouncementsView
                user={user}
                db={db}
                refresh={refresh}
                act={act}
                canPublish={true}
              />
            ) : (
              <PortalAuditView db={db} />
            )
          ) : user.role === "TEACHER" ? (
            /* TEACHER VIEWS */
            active === "Announcements" ? (
              <PortalAnnouncementsView
                user={user}
                db={db}
                refresh={refresh}
                act={act}
                canPublish={true}
              />
            ) : (
              <PortalTeacherView
                user={user}
                db={db}
                active={active}
                refresh={refresh}
                act={act}
              />
            )
          ) : (
            /* GUARDIAN VIEWS */
            active === "Announcements" ? (
              <PortalAnnouncementsView
                user={user}
                db={db}
                refresh={refresh}
                act={act}
                canPublish={false}
              />
            ) : (
              <PortalGuardianView
                user={user}
                db={db}
                active={active}
                act={act}
              />
            )
          )}
        </main>
      </div>

      {/* Spotlight Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        navItems={navItems}
        activeItem={active}
        onSelectNav={(item) => setActive(item)}
        db={db}
        onSignOut={onSignOut}
        onSwitchRole={handleSwitchRole}
      />
    </div>
  )
}
