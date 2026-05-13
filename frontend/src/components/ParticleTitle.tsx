'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const PHRASES = [
  { text: 'Brief in.', color: '#1a1a2e' },
  { text: 'Posts out.', color: '#1D9E75' },
]

const PARTICLE_COUNT = 4000
const HOLD_MS = 2500
const TRAVEL_MS = 1000
const FONT_SIZE = 56

type Dot = {
  id: number
  tx: number
  ty: number
  sx: number
  sy: number
  size: number
  delay: number
}

function sampleDots(
  text: string,
  W: number,
  H: number,
  count: number
): Dot[] | null {
  const offscreen = document.createElement('canvas')
  offscreen.width = W
  offscreen.height = H
  const ctx = offscreen.getContext('2d')!
  ctx.clearRect(0, 0, W, H)
  ctx.font = `800 ${FONT_SIZE}px Syne, sans-serif`
  ctx.fillStyle = '#000'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 4, H / 2 + 4)

  const imageData = ctx.getImageData(0, 0, W, H)
  const pixels: Array<{ x: number; y: number }> = []
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      const idx = (y * W + x) * 4
      if (imageData.data[idx + 3] > 128) pixels.push({ x, y })
    }
  }

  if (pixels.length < 20) return null

  const step = Math.max(1, Math.floor(pixels.length / count))
  const dots: Dot[] = []
  for (let i = 0; i < pixels.length && dots.length < count; i += step) {
    const { x, y } = pixels[i]
    const scatter = 100
    dots.push({
      id: i,
      tx: x,
      ty: y,
      sx: x + (Math.random() - 0.5) * scatter * 2,
      sy: y + (Math.random() - 0.5) * scatter * 2,
      size: Math.random() * 0.8 + 0.4,
      delay: Math.floor(Math.random() * 350),
    })
  }
  return dots
}

// Stage: 'scattered' | 'gathered' | 'dissolving'
type Stage = 'scattered' | 'gathered' | 'dissolving'

export default function ParticleTitle() {
  const containerRef  = useRef<HTMLDivElement>(null)
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [dots, setDots]           = useState<Dot[]>([])
  const [stage, setStage]         = useState<Stage>('scattered')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const loadPhrase = useCallback((idx: number) => {
    const container = containerRef.current
    if (!container) return
    const W = container.offsetWidth || 700
    const H = FONT_SIZE + 72
    const result = sampleDots(PHRASES[idx].text, W, H, PARTICLE_COUNT)
    if (!result) {
      timerRef.current = setTimeout(() => loadPhrase(idx), 150)
      return
    }
    setDots(result)
    // Start scattered, then after one frame move to gathered
    setStage('scattered')
    timerRef.current = setTimeout(() => {
      setStage('gathered')
      // After fully gathered, hold, then dissolve
      timerRef.current = setTimeout(() => {
        setStage('dissolving')
        // After dissolve, load next phrase
        timerRef.current = setTimeout(() => {
          const next = (idx + 1) % PHRASES.length
          setPhraseIdx(next)
          loadPhrase(next)
        }, TRAVEL_MS + 400)
      }, HOLD_MS)
    }, 50) // 50ms for browser to paint scattered positions before transitioning
  }, [])

  useEffect(() => {
    const tryLoad = () => {
      loadPhrase(0)
    }
    if (document.fonts) {
      document.fonts.load(`800 ${FONT_SIZE}px Syne`).then(() => {
        setTimeout(tryLoad, 80)
      })
    } else {
      setTimeout(tryLoad, 500)
    }
    return clear
  }, [loadPhrase])

  const phrase = PHRASES[phraseIdx]
  const H = FONT_SIZE + 72

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: H,
        marginBottom: '4px',
        overflow: 'visible',
      }}
    >
      {dots.map((dot) => {
        const isScattered  = stage === 'scattered'
        const isGathered   = stage === 'gathered'
        const isDissolving = stage === 'dissolving'

        // Position: scattered when not yet gathered, target when gathered OR dissolving
        const left = isScattered ? dot.sx : dot.tx
        const top  = isScattered ? dot.sy : dot.ty

        // Opacity: 0 when scattered, 1 when gathered, 0 when dissolving
        const opacity = isGathered ? 1 : 0

        // Transition: animate position+opacity when gathering, only opacity when dissolving, nothing when scattering
        let transition = 'none'
        if (isGathered) {
          transition = `left ${TRAVEL_MS}ms cubic-bezier(0.25,0.46,0.45,0.94) ${dot.delay}ms, top ${TRAVEL_MS}ms cubic-bezier(0.25,0.46,0.45,0.94) ${dot.delay}ms, opacity ${TRAVEL_MS * 0.6}ms ease ${dot.delay}ms`
        } else if (isDissolving) {
          transition = `opacity ${TRAVEL_MS}ms ease ${dot.delay}ms`
        }

        return (
          <div
            key={`${phraseIdx}-${dot.id}`}
            style={{
              position:     'absolute',
              left,
              top,
              width:        dot.size * 2,
              height:       dot.size * 2,
              borderRadius: '50%',
              background:   phrase.color,
              opacity,
              transition,
              willChange:   'left, top, opacity',
            }}
          />
        )
      })}
    </div>
  )
}
