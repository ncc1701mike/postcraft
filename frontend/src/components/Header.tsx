export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1D9E75' }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M2 7 L5 10 L12 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.02em' }} className="text-gray-900">Postcraft</span>
          <span className="text-sm text-gray-400 font-normal ml-1">AI Content Pipeline</span>
        </div>
        <span className="text-sm text-gray-400">claude-sonnet-4-20250514</span>
      </div>
    </header>
  )
}
