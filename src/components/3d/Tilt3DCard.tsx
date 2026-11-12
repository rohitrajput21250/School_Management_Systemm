import React, { useRef, useState, type CSSProperties, type ReactNode } from "react"

interface Tilt3DCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  maxTilt?: number
  scale?: number
  glare?: boolean
  onClick?: () => void
  interactive?: boolean
}

export default function Tilt3DCard({
  children,
  className = "",
  style,
  maxTilt = 12,
  scale = 1.02,
  glare = true,
  onClick,
  interactive = true,
}: Tilt3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState<string>("")
  const [glarePos, setGlarePos] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return

    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = -((y - centerY) / centerY) * maxTilt
    const rotateY = ((x - centerX) / centerX) * maxTilt

    const glareX = (x / rect.width) * 100
    const glareY = (y / rect.height) * 100

    setTransform(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
    )
    setGlarePos({ x: glareX, y: glareY, opacity: 0.6 })
  }

  const handleMouseEnter = () => {
    if (!interactive) return
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    if (!interactive) return
    setIsHovered(false)
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)")
    setGlarePos((prev) => ({ ...prev, opacity: 0 }))
  }

  return (
    <div
      ref={cardRef}
      className={`tilt-3d-card ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        transform: transform || "perspective(1000px) rotateX(0deg) rotateY(0deg)",
        transformStyle: "preserve-3d",
        transition: isHovered
          ? "transform 0.08s ease-out, box-shadow 0.2s ease"
          : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {/* Real-time 3D Content */}
      <div style={{ transformStyle: "preserve-3d", width: "100%", height: "100%" }}>
        {children}
      </div>

      {/* Dynamic Specular Glare */}
      {glare && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.03) 45%, transparent 75%)`,
            opacity: glarePos.opacity,
            transition: isHovered ? "opacity 0.2s ease" : "opacity 0.6s ease",
            mixBlendMode: "overlay",
            zIndex: 10,
          }}
        />
      )}
    </div>
  )
}
