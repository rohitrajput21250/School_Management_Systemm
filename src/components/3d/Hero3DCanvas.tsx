import React, { useEffect, useRef } from "react"

interface Hero3DCanvasProps {
  interactive?: boolean
  className?: string
  accentColor?: string
}

export default function Hero3DCanvas({
  interactive = true,
  className = "",
  accentColor = "#4a6b53",
}: Hero3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container || typeof window === "undefined") return

    let animId: number
    let cleanupFn: (() => void) | undefined
    let isDisposed = false

    // Dynamically import three so it works cleanly in all environments
    import("three").then((THREE) => {
      if (isDisposed || !container) return

      // Scene, Camera, Renderer
      const scene = new THREE.Scene()
      const width = container.clientWidth || window.innerWidth
      const height = container.clientHeight || 400

      const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000)
      camera.position.z = 18

      let renderer: any
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        container.appendChild(renderer.domElement)
      } catch (err) {
        return
      }

      // Group that holds the 3D rotating structure
      const mainGroup = new THREE.Group()
      scene.add(mainGroup)

      // 1. Outer Polyhedron (Wireframe Icosahedron in warm sage-gold)
      const icosaGeometry = new THREE.IcosahedronGeometry(4.3, 1)
      const wireframeMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#4a6b53"),
        wireframe: true,
        roughness: 0.3,
        metalness: 0.7,
        emissive: new THREE.Color("#d98a2b"),
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.55,
      })
      const icosaMesh = new THREE.Mesh(icosaGeometry, wireframeMaterial)
      mainGroup.add(icosaMesh)

      // 2. Inner Glowing Core (Warm Alabaster / Honey Octahedron)
      const octaGeometry = new THREE.OctahedronGeometry(2.3, 0)
      const coreMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#fffaf0"),
        emissive: new THREE.Color("#e9c46a"),
        emissiveIntensity: 0.65,
        roughness: 0.15,
        metalness: 0.2,
        clearcoat: 0.9,
        clearcoatRoughness: 0.15,
        transparent: true,
        opacity: 0.8,
      })
      const coreMesh = new THREE.Mesh(octaGeometry, coreMaterial)
      mainGroup.add(coreMesh)

      // 3. Orbital Rings (Sunlit brass, meadow sage, terracotta blush)
      const createRing = (radius: number, tiltX: number, tiltY: number, colorStr: string) => {
        const ringGeo = new THREE.TorusGeometry(radius, 0.045, 16, 100)
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colorStr),
          transparent: true,
          opacity: 0.45,
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.rotation.x = tiltX
        ring.rotation.y = tiltY
        return ring
      }

      const ring1 = createRing(5.6, Math.PI / 3, Math.PI / 6, "#588157")
      const ring2 = createRing(6.8, -Math.PI / 4, Math.PI / 4, "#d4a373")
      const ring3 = createRing(8.1, Math.PI / 2.2, 0, "#c87d65")
      mainGroup.add(ring1)
      mainGroup.add(ring2)
      mainGroup.add(ring3)

      // 4. Floating Sunlight Particles / Golden Meadow Pollen
      const particleCount = 220
      const particleGeometry = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 45
        positions[i * 3 + 1] = (Math.random() - 0.5) * 35
        positions[i * 3 + 2] = (Math.random() - 0.5) * 35 - 5
      }

      particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

      const canvas = document.createElement("canvas")
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext("2d")
      if (ctx) {
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
        grad.addColorStop(0, "rgba(255, 248, 220, 1)")
        grad.addColorStop(0.35, "rgba(217, 155, 65, 0.75)")
        grad.addColorStop(1, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 32, 32)
      }
      const particleTexture = new THREE.CanvasTexture(canvas)

      const particleMaterial = new THREE.PointsMaterial({
        size: 0.38,
        map: particleTexture,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        opacity: 0.65,
      })

      const particleSystem = new THREE.Points(particleGeometry, particleMaterial)
      scene.add(particleSystem)

      // 5. Warm Daylight Lighting
      const ambientLight = new THREE.AmbientLight(0xfffdfa, 1.2)
      scene.add(ambientLight)

      const sunLight = new THREE.DirectionalLight(0xfff5db, 1.8)
      sunLight.position.set(12, 16, 14)
      scene.add(sunLight)

      const warmPoint1 = new THREE.PointLight(0xe9c46a, 2.0, 50)
      warmPoint1.position.set(-10, -6, 10)
      scene.add(warmPoint1)

      const meadowPoint2 = new THREE.PointLight(0x588157, 1.5, 45)
      meadowPoint2.position.set(10, -10, 8)
      scene.add(meadowPoint2)

      // Mouse Tracking
      let mouseX = 0
      let mouseY = 0
      let targetX = 0
      let targetY = 0

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
        targetX = x * 0.7
        targetY = y * 0.7
      }

      if (interactive) {
        window.addEventListener("mousemove", handleMouseMove)
      }

      const handleResize = () => {
        if (!container) return
        const newWidth = container.clientWidth
        const newHeight = container.clientHeight
        camera.aspect = newWidth / newHeight
        camera.updateProjectionMatrix()
        renderer.setSize(newWidth, newHeight)
      }

      window.addEventListener("resize", handleResize)

      let clock = new THREE.Clock()

      const animate = () => {
        animId = requestAnimationFrame(animate)
        const elapsedTime = clock.getElapsedTime()

        mouseX += (targetX - mouseX) * 0.05
        mouseY += (targetY - mouseY) * 0.05

        mainGroup.rotation.y = elapsedTime * 0.16 + mouseX * 0.8
        mainGroup.rotation.x = Math.sin(elapsedTime * 0.14) * 0.18 + mouseY * 0.5
        mainGroup.rotation.z = Math.cos(elapsedTime * 0.1) * 0.08

        coreMesh.rotation.x = -elapsedTime * 0.35
        coreMesh.rotation.y = -elapsedTime * 0.28

        ring1.rotation.z = elapsedTime * 0.22
        ring2.rotation.z = -elapsedTime * 0.18
        ring3.rotation.z = elapsedTime * 0.14

        particleSystem.rotation.y = elapsedTime * 0.025

        renderer.render(scene, camera)
      }

      animate()

      cleanupFn = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener("resize", handleResize)
        if (interactive) {
          window.removeEventListener("mousemove", handleMouseMove)
        }
        icosaGeometry.dispose()
        wireframeMaterial.dispose()
        octaGeometry.dispose()
        coreMaterial.dispose()
        particleGeometry.dispose()
        particleMaterial.dispose()
        particleTexture.dispose()
        renderer.dispose()
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
      }
    })

    return () => {
      isDisposed = true
      if (cleanupFn) cleanupFn()
      cancelAnimationFrame(animId)
    }
  }, [interactive, accentColor])

  return (
    <div
      ref={mountRef}
      className={`hero-3d-canvas-container ${className}`}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    />
  )
}
