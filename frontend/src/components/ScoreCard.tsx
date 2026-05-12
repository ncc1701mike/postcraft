type Props = {
  label: string
  score: number | null
  note?: string
}

function barColor(score: number): string {
  if (score >= 4.5) return 'bg-emerald-500'
  if (score >= 3.5) return 'bg-emerald-400'
  if (score >= 2.5) return 'bg-yellow-400'
  if (score >= 1.5) return 'bg-orange-400'
  return 'bg-red-500'
}

function textColor(score: number): string {
  if (score >= 4.5) return 'text-emerald-700'
  if (score >= 3.5) return 'text-emerald-600'
  if (score >= 2.5) return 'text-yellow-700'
  if (score >= 1.5) return 'text-orange-600'
  return 'text-red-600'
}

export default function ScoreCard({ label, score, note }: Props) {
  if (score === null) {
    return (
      <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">{label}</span>
          <span className="text-xs text-gray-400">N/A</span>
        </div>
        {note && <p className="text-xs text-gray-400 leading-relaxed">{note}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-600">{label}</span>
        <span className={`text-xs font-semibold ${textColor(score)}`}>{score.toFixed(1)}</span>
      </div>
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor(score)}`}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
      {note && <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{note}</p>}
    </div>
  )
}
