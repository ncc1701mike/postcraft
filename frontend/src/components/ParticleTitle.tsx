'use client'

import { useEffect, useRef } from 'react'

const PHRASES = [
  { text: 'Brief in.', color: '#1a1a2e' },
  { text: 'Posts out.', color: '#1D9E75' },
]

const CYCLE_DURATION = 1000
const PARTICLE_COUNT = 600
const FONT_SIZE = 52
const FONT_FAMILY = 'Syne, sans-serif'
const FONT_WEIGHT = '800'

type Particle = {
  tx: number
  ty: number
  ox: number
  oy: number
  x: number
  y: number
  alpha: number
  size: number
  color: string
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function sampleTextPixels(
  text: string,
  width: number,
  height: number,
): Array<{ x: number; y: number }> {
  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height
  const ctx = offscreen.getContext('2d')!
  ctx.clearRect(0, 0, width, height)
  ctx.font = `${FONT_WEIGHT} ${FONT_SIZE}px ${FONT_FAMILY}`
  ctx.fillStyle = '#000'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 8, height / 2)
  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels: Array<{ x: number; y: number }> = []
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4
      if (imageData.data[idx + 3] > 128) {
        pixels.push({ x, y })
      }
    }
  }
  return pixels
}

function buildParticles(
  pixels: Array<{ x: number; y: number }>,
  color: string,
  canvasWidth: number,
  canvasHeight: number
): Particle[] {
  if (pixels.length === 0) return []
  const result: Particle[] = []
  const count = Math.min(PARTICLE_COUNT, pixels.length)
  const step = Math.max(1, Math.floor(pixels.length / count))
  for (let i = 0; i < pixels.length && result.length < count; i += step) {
    const { x, y } = pixels[i]
    const scatter = 80
    const ox = x + (Math.random() - 0.5) * scatter * 2
    const oy = y + (Math.random() - 0.5) * scatter * 2
    result.push({
      tx: x, ty: y,
      ox, oy,
      x: ox, y: oy,
      alpha: 0,
      size: Math.random() * 1.2 + 0.8,
      color,
    })
  }
  return result
}

export default function ParticleTitle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Wait for fonts to load before sampling
    const run = () => {
      const ctx = canvas.getContext('2d')!
      const W = canvas.parentElement?.offsetWidth || 600
      const H = Math.round(FONT_SIZE * 2.2)
      canvas.width  = W
      canvas.height = H
      canvas.style.height = H + 'px'

      const pixelSets = PHRASES.map(p => sampleTextPixels(p.text, W, H))

      let phraseIndex = 0
      let phase       = 0   // 0 = materialize in, 1 = crossfade
      let phaseStart  = performance.now()

      let particles     = buildParticles(pixelSets[0], PHRASES[0].color, W, H)
      let nextParticles: Particle[] = []

      function tick(now: number) {
        const elapsed = now - phaseStart
        const t = Math.min(elapsed / CYCLE_DURATION, 1)
        const e = easeInOut(t)

        ctx.clearRect(0, 0, W, H)

        if (phase === 0) {
          // Materialize current phrase in
          for (const p of particles) {
            p.x = p.ox + (p.tx - p.ox) * e
            p.y = p.oy + (p.ty - p.oy) * e
            ctx.globalAlpha = e
            ctx.fillStyle   = p.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
          }

          if (t >= 1) {
            phase      = 1
            phaseStart = now
            const ni   = (phraseIndex + 1) % PHRASES.length
            nextParticles = buildParticles(pixelSets[ni], PHRASES[ni].color, W, H)
          }

        } else {
          // Crossfade: dissolve current, materialize next simultaneously
          const eCurr = 1 - e
          const eNext = e

          for (const p of particles) {
            const dx = (p.ox - p.tx) * (1 - eCurr)
            const dy = (p.oy - p.ty) * (1 - eCurr)
            ctx.globalAlpha = Math.max(0, eCurr)
            ctx.fillStyle   = p.color
            ctx.beginPath()
            ctx.arc(p.tx + dx, p.ty + dy, p.size, 0, Math.PI * 2)
            ctx.fill()
          }

          for (const p of nextParticles) {
            p.x = p.ox + (p.tx - p.ox) * eNext
            p.y = p.oy + (p.ty - p.oy) * eNext
            ctx.globalAlpha = Math.max(0, eNext)
            ctx.fillStyle   = p.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
          }

          if (t >= 1) {
            phraseIndex   = (phraseIndex + 1) % PHRASES.length
            particles     = nextParticles
            nextParticles = []
            phase         = 0
            phaseStart    = now
            const scatter = 80
            for (const p of particles) {
              p.ox = p.tx + (Math.random() - 0.5) * scatter * 2
              p.oy = p.ty + (Math.random() - 0.5) * scatter * 2
              p.x  = p.ox
              p.y  = p.oy
            }
          }
        }

        ctx.globalAlpha = 1
        rafRef.current  = requestAnimationFrame(tick)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    // Wait for Syne font to be available
    if (document.fonts) {
      document.fonts.ready.then(run)
    } else {
      setTimeout(run, 300)
    }

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        display: 'block',
        marginBottom: '4px',
      }}
    />
  )
}
