import React, { useState } from "react"
import { Search, Volume2, VolumeX, Menu, X, ChevronDown, LogOut } from "lucide-react"
import type { User as UserType } from "../../lib/database"

interface PortalHeaderProps {
  user: UserType
  activeTitle: string
  breadcrumb: string
  onOpenPalette: () => void
  onSignOut: () => void
  onToggleMobileNav: () => void
  mobileNavOpen: boolean
  onSwitchRole?: (role: "ADMIN" | "TEACHER" | "GUARDIAN") => void | Promise<void>
  soundActive?: boolean
  onToggleSound?: () => void
}

export default function PortalHeader({
  user,
  activeTitle,
  breadcrumb,
  onOpenPalette,
  onSignOut,
  onToggleMobileNav,
  mobileNavOpen,
  onSwitchRole,
  soundActive = false,
  onToggleSound,
}: PortalHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="portal-header-3d">
      {/* Left: Mobile Toggle & Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          className="mobile-menu-trigger"
          onClick={onToggleMobileNav}
          aria-label="Toggle navigation menu"
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div>
          <div className="portal-breadcrumb-3d">
            <span>Workspace</span>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: "#74c69d" }}>{breadcrumb}</span>
          </div>
          <h1 className="portal-title-3d">{activeTitle}</h1>
        </div>
      </div>

      {/* Right: Actions, Command Palette, Sound Toggle, User Profile */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Quick Search / Command Palette button */}
        <button
          className="command-btn-3d"
          onClick={onOpenPalette}
          title="Open search and navigation"
        >
          <Search size={14} color="#74c69d" />
          <span className="command-btn-text">Quick Search</span>
          <kbd>⌘K</kbd>
        </button>

        {/* Ambient Sound / Audio Feedback Toggle if provided */}
        {onToggleSound && (
          <button
            className={`icon-pill-btn ${soundActive ? "active-sound" : ""}`}
            onClick={onToggleSound}
            title={soundActive ? "Mute ambient audio" : "Enable ambient audio"}
          >
            {soundActive ? <Volume2 size={16} color="#4ade80" /> : <VolumeX size={16} color="#aab8a6" />}
          </button>
        )}

        {/* Role Switcher Pill */}
        {onSwitchRole && (
          <div className="role-switch-pill">
            <span style={{ fontSize: 10, color: "#6e7d72", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Role:
            </span>
            <select
              value={user.role}
              onChange={(e) => onSwitchRole(e.target.value as "ADMIN" | "TEACHER" | "GUARDIAN")}
              className="role-selector-dropdown"
            >
              <option value="ADMIN">Admin</option>
              <option value="TEACHER">Teacher</option>
              <option value="GUARDIAN">Guardian</option>
            </select>
          </div>
        )}

        {/* User Mini Profile Badge with dropdown */}
        <div style={{ position: "relative" }}>
          <button
            className="user-profile-trigger"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="user-avatar-glow">
              {user.name ? user.name[0] : "A"}
            </div>
            <div className="user-profile-meta">
              <span className="user-profile-name">{user.name}</span>
              <span className="user-profile-role">{user.role.toLowerCase()}</span>
            </div>
            <ChevronDown size={14} color="rgba(30, 41, 35, 0.5)" />
          </button>

          {userMenuOpen && (
            <div
              className="user-dropdown-menu"
              onClick={() => setUserMenuOpen(false)}
            >
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #eee8df" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1e2923" }}>{user.name}</div>
                <div style={{ fontSize: 10, color: "#6e7d72", marginTop: 2 }}>{user.email}</div>
              </div>
              <button
                className="dropdown-item-signout"
                onClick={onSignOut}
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
