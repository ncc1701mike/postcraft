'use client'

type Props = {
  open: boolean
  onToggle: () => void
}

export default function VoicePanel({ open, onToggle }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-base font-medium text-gray-900">Voice profile</span>
          <span className="text-sm text-gray-400">Demo — Disruptive Tech Brand</span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1.5">Tone</p>
              <div className="flex flex-wrap gap-1.5">
                {['direct', 'conversational', 'confident', 'human', 'anti-corporate'].map(t => (
                  <span key={t} className="text-sm px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1.5">Avoid</p>
              <div className="flex flex-wrap gap-1.5">
                {['synergy', 'excited to announce', 'thought leader', 'leverage', 'paradigm shift'].map(t => (
                  <span key={t} className="text-sm px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Audience</p>
            <p className="text-sm text-gray-600">Tech-savvy professionals, founders, and operators at growth-stage companies</p>
          </div>
          <p className="text-sm text-gray-400">Exemplar upload coming in v2 — using gold standard posts as quality benchmark.</p>
        </div>
      )}
    </div>
  )
}
