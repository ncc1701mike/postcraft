'use client'

import { useEffect, useRef } from 'react'

const PHRASES = [
  { text: 'Brief in.',  color: '#1a1a2e' },
  { text: 'Posts out.', color: '#1D9E75' },
]
const CYCLE_DURATION = 1000
const HOLD_DURATION  = 2200
const PARTICLE_COUNT = 120
const FONT_SIZE      = 36
const CANVAS_HEIGHT  = Math.round(FONT_SIZE * 2.5)

type Particle = {
  tx: number
  ty: number
  sx: number
  sy: number
  color: string
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function samplePixels(text: string, w: number, h: number): Array<[number, number]> {
  const off    = document.createElement('canvas')
  off.width    = w
  off.height   = h
  const ctx    = off.getContext('2d')!
  ctx.font         = `800 ${FONT_SIZE}px Syne, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.fillStyle    = '#000'
  ctx.fillText(text, 0, h / 2)
  const data = ctx.getImageData(0, 0, w, h).data
  const pts: Array<[number, number]> = []
  for (let y = 0; y < h; y += 3) {
    for (let x = 0; x < w; x += 3) {
      if (data[(y * w + x) * 4 + 3] > 128) pts.push([x, y])
    }
  }
  return pts
}

function buildParticles(pts: Array<[number, number]>, color: string): Particle[] {
  const step     = Math.max(1, Math.ceil(pts.length / PARTICLE_COUNT))
  const selected = pts.filter((_, i) => i % step === 0).slice(0, PARTICLE_COUNT)
  return selected.map(([tx, ty]) => ({
    tx,
    ty,
    sx: tx + (Math.random() - 0.5) * 240,
    sy: ty + (Math.random() - 0.5) * 240,
    color,
  }))
}

export default function ParticleTitle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const w = canvas.getBoundingClientRect().width || 600
    canvas.width  = w
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')!

    const pixelSets = PHRASES.map(p => samplePixels(p.text, w, CANVAS_HEIGHT))

    let particles:     Particle[] = buildParticles(pixelSets[0], PHRASES[0].color)
    let nextParticles: Particle[] = []
    let phraseIdx = 0

    type Phase = 'materialize' | 'hold' | 'transition'
    let phase: Phase = 'materialize'
    let phaseStart   = performance.now()
    let animId:      number

    function tick(now: number) {
      const elapsed = now - phaseStart
      ctx.clearRect(0, 0, w, CANVAS_HEIGHT)

      if (phase === 'materialize') {
        const et = easeInOut(Math.min(elapsed / CYCLE_DURATION, 1))
        for (const p of particles) {
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.sx + (p.tx - p.sx) * et, p.sy + (p.ty - p.sy) * et, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
        if (elapsed >= CYCLE_DURATION) { phase = 'hold'; phaseStart = now }

      } else if (phase === 'hold') {
        for (const p of particles) {
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.tx, p.ty, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
        if (elapsed >= HOLD_DURATION) {
          const next  = (phraseIdx + 1) % PHRASES.length
          nextParticles = buildParticles(pixelSets[next], PHRASES[next].color)
          phase      = 'transition'
          phaseStart = now
        }

      } else {
        const et = easeInOut(Math.min(elapsed / CYCLE_DURATION, 1))

        ctx.globalAlpha = 1 - et
        for (const p of particles) {
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.tx + (p.sx - p.tx) * et, p.ty + (p.sy - p.ty) * et, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.globalAlpha = et
        for (const p of nextParticles) {
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.sx + (p.tx - p.sx) * et, p.sy + (p.ty - p.sy) * et, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.globalAlpha = 1

        if (elapsed >= CYCLE_DURATION) {
          phraseIdx     = (phraseIdx + 1) % PHRASES.length
          particles     = nextParticles.map(p => ({ ...p }))
          nextParticles = []
          phase         = 'hold'
          phaseStart    = now
        }
      }

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${CANVAS_HEIGHT}px`, display: 'block' }}
    />
  )
}
