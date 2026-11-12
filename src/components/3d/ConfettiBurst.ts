import confetti from "canvas-confetti"

export function triggerConfetti(options?: { count?: number; spread?: number; originY?: number }) {
  const count = options?.count || 60
  const spread = options?.spread || 70
  const originY = options?.originY ?? 0.6

  confetti({
    particleCount: count,
    spread: spread,
    origin: { y: originY },
    colors: ["#52b788", "#74c69d", "#f59e0b", "#d8f3dc", "#2f4a38"],
    disableForReducedMotion: true,
  })
}

export function triggerPaymentCelebration() {
  const end = Date.now() + 1.2 * 1000
  const colors = ["#52b788", "#f59e0b", "#38bdf8", "#4ade80"]

  ;(function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}
