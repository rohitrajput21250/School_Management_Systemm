import React from "react"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bell,
  ShieldCheck,
  ClipboardCheck,
  Award,
  FileText,
  UserCheck,
  LogOut,
  Sparkles,
  School,
  X,
} from "lucide-react"
import type { User } from "../../lib/database"

interface PortalSidebarProps {
  user: User
  navItems: string[]
  activeItem: string
  onSelectNav: (item: string) => void
  onSignOut: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
  onSwitchRole?: (role: "ADMIN" | "TEACHER" | "GUARDIAN") => void | Promise<void>
}

const getNavIcon = (item: string) => {
  const norm = item.toLowerCase()
  if (norm.includes("overview")) return <LayoutDashboard size={18} />
  if (norm.includes("student") && !norm.includes("my")) return <Users size={18} />
  if (norm.includes("fee") || norm.includes("ledger")) return <CreditCard size={18} />
  if (norm.includes("announcement")) return <Bell size={18} />
  if (norm.includes("audit")) return <ShieldCheck size={18} />
  if (norm.includes("attendance")) return <ClipboardCheck size={18} />
  if (norm.includes("exam") || norm.includes("mark")) return <Award size={18} />
  if (norm.includes("report")) return <FileText size={18} />
  if (norm.includes("my student")) return <UserCheck size={18} />
  return <Sparkles size={18} />
}

export default function PortalSidebar({
  user,
  navItems,
  activeItem,
  onSelectNav,
  onSignOut,
  mobileOpen,
  onCloseMobile,
  onSwitchRole,
}: PortalSidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`portal-sidebar-3d ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Brand Header with 3D Monogram */}
        <div className="sidebar-brand-3d">
          <div className="brand-crest-3d">
            <School size={20} color="#f5f3ec" />
            <div className="crest-sheen" />
          </div>
          <div>
            <div className="brand-title">ALGIONS</div>
            <div className="brand-subtitle">ACADEMY OS</div>
          </div>
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="sidebar-close-btn"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Role Pill */}
        <div className="sidebar-role-badge">
          <span className={`role-indicator-dot ${user.role.toLowerCase()}`} />
          <span className="role-text">{user.role.toLowerCase()} workspace</span>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav-3d">
          {navItems.map((item) => {
            const isActive = activeItem === item
            return (
              <button
                key={item}
                className={`sidebar-nav-btn ${isActive ? "active" : ""}`}
                onClick={() => {
                  onSelectNav(item)
                  onCloseMobile()
                }}
              >
                <span className="nav-btn-icon">{getNavIcon(item)}</span>
                <span className="nav-btn-label">{item}</span>
                {isActive && <span className="nav-active-glow" />}
              </button>
            )
          })}
        </nav>

        {/* Quick Demo Switcher in Sidebar */}
        {onSwitchRole && (
          <div className="sidebar-demo-switcher">
            <div className="demo-switch-label">Switch Demo Role</div>
            <div className="demo-switch-buttons">
              <button
                className={user.role === "ADMIN" ? "active-role" : ""}
                onClick={() => onSwitchRole("ADMIN")}
              >
                Admin
              </button>
              <button
                className={user.role === "TEACHER" ? "active-role" : ""}
                onClick={() => onSwitchRole("TEACHER")}
              >
                Teacher
              </button>
              <button
                className={user.role === "GUARDIAN" ? "active-role" : ""}
                onClick={() => onSwitchRole("GUARDIAN")}
              >
                Parent
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Footer User info & Signout */}
        <div className="sidebar-footer-3d">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">{user.name ? user.name[0] : "A"}</div>
            <div className="sidebar-user-details">
              <b>{user.name}</b>
              <small>{user.email}</small>
            </div>
          </div>

          <button className="sidebar-signout-btn" onClick={onSignOut}>
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
