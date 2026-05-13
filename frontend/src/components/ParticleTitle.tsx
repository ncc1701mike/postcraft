'use client'

import { useEffect, useRef, useState } from 'react'

const PHRASES = [
  { text: 'Brief in.', color: '#1a1a2e' },
  { text: 'Posts out.', color: '#1D9E75' },
]

const PARTICLE_COUNT = 180
const CYCLE_MS = 2500

type Dot = {
  id: number
  x: number
  y: number
  tx: number
  ty: number
  size: number
  delay: number
}

export default function ParticleTitle() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [dots, setDots] = useState<Dot[]>([])
  const [animating, setAnimating] = useState<'in' | 'out'>('in')

  // Build dots from text using a hidden span to measure character positions
  const buildDots = (index: number) => {
    const container = containerRef.current
    if (!container) return

    const phrase = PHRASES[index]
    const W = container.offsetWidth || 600
    const H = 80

    // Sample random positions within a bounding box shaped like the text
    // Use a hidden canvas just for pixel sampling
    const offscreen = document.createElement('canvas')
    offscreen.width = W
    offscreen.height = H
    const ctx = offscreen.getContext('2d')!
    ctx.font = '800 48px Syne, sans-serif'
    ctx.fillStyle = '#000'
    ctx.textBaseline = 'middle'
    ctx.fillText(phrase.text, 0, H / 2)

    const imageData = ctx.getImageData(0, 0, W, H)
    const pixels: Array<{ x: number; y: number }> = []
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const idx = (y * W + x) * 4
        if (imageData.data[idx + 3] > 128) {
          pixels.push({ x, y })
        }
      }
    }

    if (pixels.length < 10) return null

    const step = Math.max(1, Math.floor(pixels.length / PARTICLE_COUNT))
    const newDots: Dot[] = []
    for (let i = 0; i < pixels.length && newDots.length < PARTICLE_COUNT; i += step) {
      const { x, y } = pixels[i]
      const scatter = 60
      newDots.push({
        id: i,
        tx: x,
        ty: y,
        x: x + (Math.random() - 0.5) * scatter * 2,
        y: y + (Math.random() - 0.5) * scatter * 2,
        size: Math.random() * 1.5 + 1,
        delay: Math.random() * 400,
      })
    }
    return newDots
  }

  useEffect(() => {
    const tryBuild = () => {
      const result = buildDots(0)
      if (result) {
        setDots(result)
        setAnimating('in')
      } else {
        setTimeout(tryBuild, 150)
      }
    }

    if (document.fonts) {
      document.fonts.load('800 48px Syne').then(() => setTimeout(tryBuild, 50))
    } else {
      setTimeout(tryBuild, 400)
    }
  }, [])

  useEffect(() => {
    if (dots.length === 0) return

    if (animating === 'in') {
      // After fully materialized, wait then start dissolve
      const t = setTimeout(() => {
        setAnimating('out')
      }, CYCLE_MS)
      return () => clearTimeout(t)
    }

    if (animating === 'out') {
      // After dissolved, switch phrase and materialize
      const t = setTimeout(() => {
        const nextIndex = (phraseIndex + 1) % PHRASES.length
        const result = buildDots(nextIndex)
        if (result) {
          setPhraseIndex(nextIndex)
          setDots(result)
          setAnimating('in')
        }
      }, CYCLE_MS)
      return () => clearTimeout(t)
    }
  }, [animating, dots, phraseIndex])

  const phrase = PHRASES[phraseIndex]

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '80px',
        marginBottom: '4px',
        overflow: 'visible',
      }}
    >
      {dots.map((dot) => {
        const isIn = animating === 'in'
        return (
          <div
            key={`${phraseIndex}-${dot.id}`}
            style={{
              position: 'absolute',
              left: isIn ? dot.tx : dot.x,
              top: isIn ? dot.ty : dot.y,
              width: dot.size * 2,
              height: dot.size * 2,
              borderRadius: '50%',
              background: phrase.color,
              opacity: isIn ? 1 : 0,
              transition: `left ${CYCLE_MS * 0.6}ms cubic-bezier(0.4,0,0.2,1) ${dot.delay}ms, top ${CYCLE_MS * 0.6}ms cubic-bezier(0.4,0,0.2,1) ${dot.delay}ms, opacity ${CYCLE_MS * 0.5}ms ease ${dot.delay}ms`,
              willChange: 'left, top, opacity',
            }}
          />
        )
      })}
    </div>
  )
}
