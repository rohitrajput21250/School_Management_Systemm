import React, { useRef, useState } from "react"
import { QrCode, Cpu, School } from "lucide-react"
import type { Student, Section } from "../../lib/database"

interface HoloStudentBadgeProps {
  student: Student
  section?: Section
  guardianName?: string
}

export default function HoloStudentBadge({
  student,
  section,
}: HoloStudentBadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null)
  const [rotate, setRotate] = useState({ x: 0, y: 0 })
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })
  const [isFlipped, setIsFlipped] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!badgeRef.current) return
    const rect = badgeRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotX = -((y - centerY) / centerY) * 15
    const rotY = ((x - centerX) / centerX) * 15

    const glareX = (x / rect.width) * 100
    const glareY = (y / rect.height) * 100

    setRotate({ x: rotX, y: rotY })
    setGlare({ x: glareX, y: glareY, opacity: 0.75 })
  }

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 })
    setGlare((prev) => ({ ...prev, opacity: 0 }))
  }

  return (
    <div
      style={{
        perspective: "1200px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        ref={badgeRef}
        onClick={() => setIsFlipped(!isFlipped)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="holo-badge-card"
        style={{
          width: "100%",
          maxWidth: 360,
          height: 220,
          borderRadius: 20,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `perspective(1200px) rotateX(${rotate.x}deg) rotateY(${
            rotate.y + (isFlipped ? 180 : 0)
          }deg) scale3d(1.02, 1.02, 1.02)`,
          transition: "transform 0.15s ease-out, box-shadow 0.3s ease",
          cursor: "pointer",
          boxShadow:
            glare.opacity > 0
              ? "0 20px 45px -10px rgba(74, 107, 83, 0.22), 0 0 25px rgba(217, 138, 43, 0.18)"
              : "0 14px 35px -10px rgba(60, 80, 65, 0.12)",
          background: "linear-gradient(135deg, #ffffff 0%, #faf6ee 50%, #f4ede0 100%)",
          border: "1px solid rgba(200, 185, 160, 0.5)",
          padding: 22,
          color: "#1e2923",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {/* Holographic Pearlescent Sheen Layer */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: "inherit",
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.7) 0%, rgba(220, 240, 225, 0.4) 30%, rgba(250, 220, 180, 0.3) 55%, transparent 80%)`,
            opacity: glare.opacity,
            mixBlendMode: "color-burn",
            transition: "opacity 0.25s ease",
            zIndex: 12,
          }}
        />

        {/* Diagonal pearlescent pastel rainbow foil */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: "inherit",
            background:
              "linear-gradient(115deg, transparent 20%, rgba(74, 107, 83, 0.08) 35%, rgba(217, 138, 43, 0.1) 50%, rgba(200, 125, 101, 0.08) 65%, transparent 80%)",
            opacity: 0.8,
            zIndex: 2,
          }}
        />

        {/* FRONT SIDE */}
        <div
          style={{
            backfaceVisibility: "hidden",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transform: "translateZ(30px)",
            position: "relative",
            zIndex: 5,
          }}
        >
          {/* Top Bar: Brand + Chip */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "linear-gradient(135deg, #446950, #2c4735)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(68, 105, 80, 0.35)",
                }}
              >
                <School size={18} color="#fff" />
              </div>
              <div>
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    fontWeight: 700,
                    color: "#1e2923",
                    display: "block",
                  }}
                >
                  ALGIONS ACADEMY
                </span>
                <span style={{ fontSize: 9, color: "#446950", letterSpacing: "0.1em", fontWeight: 600 }}>
                  OFFICIAL STUDENT PASS
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(74, 107, 83, 0.1)",
                border: "1px solid rgba(74, 107, 83, 0.25)",
                padding: "3px 8px",
                borderRadius: 20,
              }}
            >
              <Cpu size={12} color="#446950" />
              <span style={{ fontSize: 9, color: "#2c4735", fontWeight: 700 }}>NFC 3.0</span>
            </div>
          </div>

          {/* Middle: Student Details & Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: "linear-gradient(135deg, #dce8df, #c2d9c7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 700,
                color: "#2c4735",
                border: "2px solid rgba(255, 255, 255, 0.8)",
                boxShadow: "0 4px 14px rgba(68, 105, 80, 0.18)",
                transform: "translateZ(20px)",
              }}
            >
              {student.firstName[0]}
            </div>

            <div style={{ flex: 1, minWidth: 0, transform: "translateZ(15px)" }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  color: "#1e2923",
                  letterSpacing: "-0.01em",
                }}
              >
                {student.firstName} {student.lastName}
              </div>
              <div style={{ fontSize: 11, color: "#556b5a", marginTop: 2 }}>
                ID: <span style={{ fontFamily: "monospace", color: "#1e2923", fontWeight: 600 }}>{student.admissionNo}</span>
              </div>
              <div style={{ fontSize: 10, color: "#7a8a7c", marginTop: 2 }}>
                {section ? `${section.grade} • ${section.name}` : "Senior Division"}
              </div>
            </div>
          </div>

          {/* Bottom Bar: Status Beacon & Barcode */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderTop: "1px solid rgba(180, 170, 150, 0.3)",
              paddingTop: 10,
              marginTop: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#2e7246",
                  boxShadow: "0 0 6px #388e5a",
                }}
              />
              <span style={{ fontSize: 9, fontWeight: 700, color: "#2e7246", letterSpacing: "0.08em" }}>
                VERIFIED ACTIVE
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <QrCode size={18} color="#446950" />
              <span style={{ fontSize: 9, color: "#7a8a7c", letterSpacing: "0.05em" }}>
                TAP TO FLIP ↻
              </span>
            </div>
          </div>
        </div>
      </div>
      <small style={{ marginTop: 8, color: "#7a8a7c", fontSize: 10 }}>
        ✨ Hover to tilt in 3D • Click card to flip
      </small>
    </div>
  )
}
