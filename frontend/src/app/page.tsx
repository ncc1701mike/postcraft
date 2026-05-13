'use client'

import { useState } from 'react'
import BriefPanel from '@/components/BriefPanel'
import ResultsPanel from '@/components/ResultsPanel'
import VoicePanel from '@/components/VoicePanel'
import Header from '@/components/Header'
import ParticleTitle from '@/components/ParticleTitle'

export type ScoreAnnotation = {
  criterion: string
  note: string
}

export type PlatformDraft = {
  platform: string
  post_text: string
  revision_count: number
  score_brief: number | null
  score_platform: number | null
  score_hook: number | null
  score_factual: number | null
  score_cta: number | null
  score_voice: number | null
  score_weighted: number | null
  score_annotations: ScoreAnnotation[]
  passed: boolean | null
}

export type GenerateResponse = {
  drafts: PlatformDraft[]
  run_complete: boolean
  workspace_id: string
}

export default function Home() {
  const [drafts, setDrafts]       = useState<PlatformDraft[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [voiceOpen, setVoiceOpen] = useState(false)

  const handleGenerate = async (briefText: string, briefUrl: string) => {
    setLoading(true)
    setError(null)
    setDrafts([])

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief_text: briefText,
          brief_url: briefUrl || null,
          workspace_id: '00000000-0000-0000-0000-000000000001',
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Generation failed')
      }

      const data: GenerateResponse = await res.json()
      setDrafts(data.drafts)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="mb-2">
          <ParticleTitle />
          <p className="text-gray-700 mt-2" style={{ fontSize: '17px' }}>
            Drop a rough idea. The pipeline generates, evaluates, and revises — then hands you three platform-ready posts.
          </p>
        </div>
        <VoicePanel open={voiceOpen} onToggle={() => setVoiceOpen(v => !v)} />
        <BriefPanel onGenerate={handleGenerate} loading={loading} />
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-base text-red-700">
            {error}
          </div>
        )}
        {drafts.length > 0 && <ResultsPanel drafts={drafts} />}
      </main>
    </div>
  )
}
