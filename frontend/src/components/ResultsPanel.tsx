'use client'

import { useState } from 'react'
import { PlatformDraft } from '@/app/page'
import ScoreCard from '@/components/ScoreCard'

type Props = {
  drafts: PlatformDraft[]
}

const PLATFORM_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    bg: '#EBF3FB',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect width="16" height="16" rx="3" fill="#0A66C2" />
        <path d="M4 6.5h1.8V12H4V6.5zM4.9 5.7a1 1 0 110-2 1 1 0 010 2zM6.8 6.5h1.7v.75h.02C8.77 6.85 9.4 6.4 10.2 6.4c1.8 0 2.1 1.2 2.1 2.7V12h-1.8V9.5c0-.66-.01-1.5-.92-1.5-.93 0-1.07.72-1.07 1.47V12H6.8V6.5z" fill="white" />
      </svg>
    ),
  },
  twitter: {
    label: 'Twitter / X',
    color: '#000000',
    bg: '#F7F7F7',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect width="16" height="16" rx="3" fill="#000" />
        <path d="M9.3 7.2L12.7 3.5h-.8L8.95 6.7 6.8 3.5H4l3.6 5.2L4 12.5h.8l3.1-3.6 2.5 3.6H13L9.3 7.2zm-1.1 1.3l-.35-.5L5 4.1h1.2l2.25 3.2.35.5 2.9 4.1h-1.2l-2.35-3.4z" fill="white" />
      </svg>
    ),
  },
  instagram: {
    label: 'Instagram',
    color: '#E1306C',
    bg: '#FEF0F5',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <defs>
          <linearGradient id="ig-grad" x1="0" y1="16" x2="16" y2="0">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="50%" stopColor="#DD2A7B" />
            <stop offset="100%" stopColor="#8134AF" />
          </linearGradient>
        </defs>
        <rect width="16" height="16" rx="3" fill="url(#ig-grad)" />
        <rect x="4" y="4" width="8" height="8" rx="2.5" stroke="white" strokeWidth="1.2" />
        <circle cx="8" cy="8" r="2" stroke="white" strokeWidth="1.2" />
        <circle cx="11" cy="5" r=".5" fill="white" />
      </svg>
    ),
  },
}

const SCORE_CRITERIA = [
  { key: 'score_brief',    label: 'Brief faithfulness' },
  { key: 'score_platform', label: 'Platform nativity' },
  { key: 'score_hook',     label: 'Hook strength' },
  { key: 'score_factual',  label: 'Factual accuracy' },
  { key: 'score_cta',      label: 'CTA clarity' },
  { key: 'score_voice',    label: 'Brand voice match' },
]

export default function ResultsPanel({ drafts }: Props) {
  const [activeTab, setActiveTab] = useState(drafts[0]?.platform || 'linkedin')
  const [copied, setCopied]       = useState<string | null>(null)

  const draft = drafts.find(d => d.platform === activeTab)

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text)
    setCopied(platform)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        {drafts.map(d => {
          const meta = PLATFORM_META[d.platform] || { label: d.platform, color: '#6b7280', bg: '#f9fafb', icon: null }
          const isActive = d.platform === activeTab
          return (
            <button
              key={d.platform}
              onClick={() => setActiveTab(d.platform)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-base font-medium transition-colors border-b-2 ${
                isActive
                  ? 'border-emerald-500 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {meta.icon}
                {meta.label}
              </span>
              {d.score_weighted !== null && (
                <span className={`text-sm px-1.5 py-0.5 rounded-full font-medium ${
                  d.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-600'
                }`}>
                  {d.score_weighted}/5
                </span>
              )}
              {d.revision_count > 0 && (
                <span className="text-sm px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  rev
                </span>
              )}
            </button>
          )
        })}
      </div>

      {draft && (
        <div className="p-5 space-y-5">
          {/* Post text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">Post</span>
              <button
                onClick={() => copyToClipboard(draft.post_text, draft.platform)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-700 transition-colors"
              >
                {copied === draft.platform ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M8 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h1" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-base text-gray-800 leading-relaxed whitespace-pre-wrap border border-gray-100">
              {draft.post_text}
            </div>
          </div>

          {/* Eval scores */}
          {draft.score_weighted !== null && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">Eval scores</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                    draft.passed
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-orange-50 text-orange-600'
                  }`}>
                    {draft.passed ? 'PASSED' : 'FAILED'} · {draft.score_weighted}/5.0
                  </span>
                  {draft.revision_count > 0 && (
                    <span className="text-sm text-gray-600">
                      {draft.revision_count} revision{draft.revision_count > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SCORE_CRITERIA.map(({ key, label }) => {
                  const score = draft[key as keyof PlatformDraft] as number | null
                  const annotation = draft.score_annotations?.find(a =>
                    a.criterion.toLowerCase().includes(label.split(' ')[0].toLowerCase())
                  )
                  return (
                    <ScoreCard key={key} label={label} score={score} note={annotation?.note} />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
