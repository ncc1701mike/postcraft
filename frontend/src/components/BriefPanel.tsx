'use client'

import { useState } from 'react'

type Props = {
  onGenerate: (briefText: string, briefUrl: string) => void
  loading: boolean
}

const EXAMPLE_BRIEFS = [
  "We just cut our deployment time from 4 hours to 11 minutes using a custom CI/CD pipeline. Our devs now ship 3x more often with zero increase in incidents.",
  "We're launching a new feature that lets teams automate their weekly status reports using AI. No more Sunday night scramble.",
  "Our churn rate dropped from 8.2% to 2.1% after we redesigned our onboarding flow. Here's what we changed.",
]

export default function BriefPanel({ onGenerate, loading }: Props) {
  const [briefText, setBriefText] = useState('')
  const [briefUrl, setBriefUrl]   = useState('')
  const [urlOpen, setUrlOpen]     = useState(false)

  const handleSubmit = () => {
    if (!briefText.trim() || loading) return
    onGenerate(briefText.trim(), briefUrl.trim())
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">Content brief</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Try an example:</span>
          {EXAMPLE_BRIEFS.map((ex, i) => (
            <button
              key={i}
              onClick={() => setBriefText(ex)}
              className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
            >
              #{i + 1}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={briefText}
        onChange={e => setBriefText(e.target.value)}
        placeholder="Paste your rough idea, a key message, a product update, a win — anything. The pipeline handles the rest."
        className="w-full h-28 text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      />

      <div>
        <button
          onClick={() => setUrlOpen(u => !u)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 6a2 2 0 104 0 2 2 0 00-4 0M7.5 4.5l1-1a2.121 2.121 0 013 3l-2 2M4.5 7.5l-1 1a2.121 2.121 0 01-3-3l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {urlOpen ? 'Hide URL input' : 'Add a URL to pull from'}
        </button>
        {urlOpen && (
          <input
            type="url"
            value={briefUrl}
            onChange={e => setBriefUrl(e.target.value)}
            placeholder="https://yourblog.com/post"
            className="mt-2 w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-gray-400">
          Generates LinkedIn · Twitter/X · Instagram — evaluated and revised by the pipeline
        </p>
        <button
          onClick={handleSubmit}
          disabled={!briefText.trim() || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: loading ? '#94a3b8' : '#1D9E75' }}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v6M7 1L4.5 3.5M7 1L9.5 3.5M1 9.5A2.5 2.5 0 003.5 12h7a2.5 2.5 0 002.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Generate posts
            </>
          )}
        </button>
      </div>
    </div>
  )
}
