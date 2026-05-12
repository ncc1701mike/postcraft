export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1D9E75' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7 L5 10 L12 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-[15px]">Postcraft</span>
          <span className="text-[11px] text-gray-400 font-normal ml-1">AI Content Pipeline</span>
        </div>
        <span className="text-[11px] text-gray-400">claude-sonnet-4-20250514</span>
      </div>
    </header>
  )
}
