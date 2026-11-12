import React, { useState, useEffect } from "react"
import { Search, Sparkles, LogOut, ArrowRight, X } from "lucide-react"
import type { Db } from "../../lib/database"

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  navItems: string[]
  activeItem: string
  onSelectNav: (item: string) => void
  db: Db | null
  onSignOut: () => void
  onSwitchRole?: (role: "ADMIN" | "TEACHER" | "GUARDIAN") => void
}

export default function CommandPalette({
  isOpen,
  onClose,
  navItems,
  onSelectNav,
  db,
  onSignOut,
  onSwitchRole,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("")

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const filteredNav = navItems.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  )

  const filteredStudents = (db?.students || []).filter((s) =>
    `${s.firstName} ${s.lastName} ${s.admissionNo}`.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4)

  return (
    <div
      className="palette-backdrop-3d"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30, 40, 32, 0.45)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        paddingLeft: 16,
        paddingRight: 16,
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        className="command-palette-card-3d"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 620,
          background: "#ffffff",
          border: "1px solid rgba(180, 195, 180, 0.45)",
          borderRadius: 18,
          boxShadow: "0 25px 60px rgba(40, 55, 45, 0.18), 0 0 25px rgba(217, 138, 43, 0.08)",
          overflow: "hidden",
          color: "#1e2923",
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "18px 22px",
            borderBottom: "1px solid #eee8df",
          }}
        >
          <Search size={20} color="#446950" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, section, or student name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#1e2923",
              fontSize: 16,
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#8e9c91",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content list */}
        <div style={{ maxHeight: 380, overflowY: "auto", padding: "12px 14px" }}>
          {/* Navigation Section */}
          <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "#446950", fontWeight: 700, padding: "8px 10px", textTransform: "uppercase" }}>
            Workspace Navigation
          </div>
          {filteredNav.map((item) => (
            <button
              key={item}
              onClick={() => {
                onSelectNav(item)
                onClose()
              }}
              className="palette-item"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                borderRadius: 10,
                background: "transparent",
                border: "none",
                color: "#1e2923",
                fontSize: 14,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Sparkles size={16} color="#446950" />
                <span>{item}</span>
              </div>
              <ArrowRight size={14} color="#8e9c91" />
            </button>
          ))}

          {/* Student Matches if any */}
          {query.trim().length > 0 && filteredStudents.length > 0 && (
            <>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "#d98a2b", fontWeight: 700, padding: "14px 10px 6px", textTransform: "uppercase" }}>
                Matching Students
              </div>
              {filteredStudents.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "rgba(68, 105, 80, 0.05)",
                    marginBottom: 4,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: "#1e2923" }}>
                      {s.firstName} {s.lastName}
                    </span>
                    <span style={{ marginLeft: 8, color: "#6e7d72", fontSize: 11 }}>
                      {s.admissionNo}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "#388e5a", fontWeight: 600 }}>Grade 10</span>
                </div>
              ))}
            </>
          )}

          {/* Switch Demo Role Quick Access */}
          {onSwitchRole && (
            <>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "#3b82a6", fontWeight: 700, padding: "14px 10px 6px", textTransform: "uppercase" }}>
                Switch Demo Perspective
              </div>
              <div style={{ display: "flex", gap: 8, padding: "4px 10px" }}>
                <button
                  onClick={() => {
                    onSwitchRole("ADMIN")
                    onClose()
                  }}
                  className="quick-role-btn"
                >
                  Admin View
                </button>
                <button
                  onClick={() => {
                    onSwitchRole("TEACHER")
                    onClose()
                  }}
                  className="quick-role-btn"
                >
                  Teacher View
                </button>
                <button
                  onClick={() => {
                    onSwitchRole("GUARDIAN")
                    onClose()
                  }}
                  className="quick-role-btn"
                >
                  Guardian View
                </button>
              </div>
            </>
          )}

          {/* Quick Sign out */}
          <div style={{ borderTop: "1px solid #eee8df", marginTop: 12, paddingTop: 6 }}>
            <button
              onClick={() => {
                onSignOut()
                onClose()
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                color: "#c85a67",
                fontSize: 13,
                cursor: "pointer",
                borderRadius: 8,
              }}
            >
              <LogOut size={15} />
              <span>Sign out of session</span>
            </button>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: "10px 20px",
            background: "#f9f6f0",
            borderTop: "1px solid #eee8df",
            fontSize: 11,
            color: "#6e7d72",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Use <b>↑</b> <b>↓</b> to navigate</span>
          <span><b>ESC</b> to close</span>
        </div>
      </div>
    </div>
  )
}
