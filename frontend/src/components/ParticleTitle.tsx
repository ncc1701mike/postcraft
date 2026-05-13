'use client'

import { useEffect, useRef } from 'react'

const PHRASES = [
  { text: 'Brief in.', color: '#1a1a2e' },
  { text: 'Posts out.', color: '#1D9E75' },
]

const CYCLE_DURATION = 1500
const PARTICLE_COUNT = 600
const FONT_SIZE = 48
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

function makeScatterOrigin(tx: number, ty: number, scatter: number) {
  return {
    ox: tx + (Math.random() - 0.5) * scatter * 2,
    oy: ty + (Math.random() - 0.5) * scatter * 2,
  }
}

function buildParticles(
  pixels: Array<{ x: number; y: number }>,
  color: string,
): Particle[] {
  if (pixels.length === 0) return []
  const result: Particle[] = []
  const count = Math.min(PARTICLE_COUNT, pixels.length)
  const step = Math.max(1, Math.floor(pixels.length / count))
  const scatter = 80
  for (let i = 0; i < pixels.length && result.length < count; i += step) {
    const { x, y } = pixels[i]
    const { ox, oy } = makeScatterOrigin(x, y, scatter)
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

    const run = () => {
      const ctx = canvas.getContext('2d')!
      const W = canvas.parentElement?.offsetWidth || 600
      const H = Math.round(FONT_SIZE * 3.0)
      canvas.width  = W
      canvas.height = H
      canvas.style.height = H + 'px'

      // Sample pixels for both phrases once
      const pixelSets = PHRASES.map(p => sampleTextPixels(p.text, W, H))

      // State machine:
      // phase 0 = materializing phraseIndex IN
      // phase 1 = crossfading phraseIndex OUT while (phraseIndex+1) materializes IN
      let phraseIndex = 0
      let phase       = 0
      let phaseStart  = performance.now()

      let current: Particle[] = buildParticles(pixelSets[0], PHRASES[0].color)
      let next: Particle[]    = []

      function tick(now: number) {
        const elapsed = now - phaseStart
        const t = Math.min(elapsed / CYCLE_DURATION, 1)
        const e = easeInOut(t)

        ctx.clearRect(0, 0, W, H)

        if (phase === 0) {
          // --- MATERIALIZE current phrase in ---
          for (const p of current) {
            p.x = p.ox + (p.tx - p.ox) * e
            p.y = p.oy + (p.ty - p.oy) * e
            ctx.globalAlpha = e
            ctx.fillStyle   = p.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
          }

          if (t >= 1) {
            // Fully materialized — prepare next phrase for crossfade
            const ni = (phraseIndex + 1) % PHRASES.length
            next     = buildParticles(pixelSets[ni], PHRASES[ni].color)
            phase     = 1
            phaseStart = now
          }

        } else {
          // --- CROSSFADE: dissolve current, materialize next simultaneously ---
          const eFade = e       // next materializes: 0→1
          const eDiss = 1 - e  // current dissolves: 1→0

          // Dissolve current
          for (const p of current) {
            const dx = (p.ox - p.tx) * (1 - eDiss)
            const dy = (p.oy - p.ty) * (1 - eDiss)
            ctx.globalAlpha = Math.max(0, eDiss)
            ctx.fillStyle   = p.color
            ctx.beginPath()
            ctx.arc(p.tx + dx, p.ty + dy, p.size, 0, Math.PI * 2)
            ctx.fill()
          }

          // Materialize next
          for (const p of next) {
            p.x = p.ox + (p.tx - p.ox) * eFade
            p.y = p.oy + (p.ty - p.oy) * eFade
            ctx.globalAlpha = Math.max(0, eFade)
            ctx.fillStyle   = p.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
          }

          if (t >= 1) {
            // Crossfade complete — advance phrase, reset for next materialize
            phraseIndex = (phraseIndex + 1) % PHRASES.length
            current     = next
            next        = []
            // Give current particles new scatter origins for next dissolve
            const scatter = 80
            for (const p of current) {
              const { ox, oy } = makeScatterOrigin(p.tx, p.ty, scatter)
              p.ox = ox
              p.oy = oy
              p.x  = p.tx
              p.y  = p.ty
            }
            phase      = 0
            phaseStart = now
          }
        }

        ctx.globalAlpha = 1
        rafRef.current  = requestAnimationFrame(tick)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

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
