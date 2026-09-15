import { useRef, useState } from 'react'

type Props = {
  onUploaded: (id: string, url: string) => void
}

export default function ChangeDetection({ onUploaded }: Props) {
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [beforeDragging, setBeforeDragging] = useState(false)
  const [afterDragging, setAfterDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ overlay: string; description: string; pct: number } | null>(null)

  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!beforeFile || !afterFile) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('image_before', beforeFile)
      fd.append('image_after', afterFile)
      const res = await fetch('/api/change', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Change detection failed')
      const data = await res.json()
      setResult({ overlay: data.overlay_image_url, description: data.description, pct: data.change_percentage })
      onUploaded('', '')
    } catch (e) {
      console.error(e)
      alert('Change detection analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent, setFile: (f: File) => void, setDrag: (b: boolean) => void) => {
    e.preventDefault()
    e.stopPropagation()
    setDrag(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setFile(file)
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4 shadow-sm">
      <div className="text-sm font-medium text-slate-200">
        Bi-Temporal Change Detection
      </div>
      <p className="text-xs text-slate-400">
        Upload two satellite scenes of the exact same geographical location at different timestamps.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Before Image */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              T1 — Earlier Image
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setBeforeDragging(true) }}
              onDragLeave={(e) => { e.preventDefault(); setBeforeDragging(false) }}
              onDrop={(e) => handleDrop(e, setBeforeFile, setBeforeDragging)}
              onClick={() => beforeInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                beforeDragging
                  ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200'
                  : beforeFile
                  ? 'border-emerald-600/60 bg-emerald-950/20 text-emerald-300'
                  : 'border-slate-700/80 bg-slate-950/50 hover:border-slate-600 text-slate-400'
              }`}
            >
              <input
                ref={beforeInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setBeforeFile(e.target.files[0])}
              />
              <div className="text-xs truncate">
                {beforeFile ? (
                  <span className="font-medium text-emerald-400">✓ {beforeFile.name}</span>
                ) : (
                  <span>Drag & drop or <span className="text-indigo-400">browse</span></span>
                )}
              </div>
            </div>
          </div>

          {/* After Image */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              T2 — Later Image
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setAfterDragging(true) }}
              onDragLeave={(e) => { e.preventDefault(); setAfterDragging(false) }}
              onDrop={(e) => handleDrop(e, setAfterFile, setAfterDragging)}
              onClick={() => afterInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                afterDragging
                  ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200'
                  : afterFile
                  ? 'border-emerald-600/60 bg-emerald-950/20 text-emerald-300'
                  : 'border-slate-700/80 bg-slate-950/50 hover:border-slate-600 text-slate-400'
              }`}
            >
              <input
                ref={afterInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setAfterFile(e.target.files[0])}
              />
              <div className="text-xs truncate">
                {afterFile ? (
                  <span className="font-medium text-emerald-400">✓ {afterFile.name}</span>
                ) : (
                  <span>Drag & drop or <span className="text-indigo-400">browse</span></span>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
          disabled={loading || !beforeFile || !afterFile}
        >
          {loading ? 'Analyzing Differences...' : 'Run Change Detection'}
        </button>
      </form>

      {result && (
        <div className="border-t border-slate-800 pt-4 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300 font-medium">Change Matrix:</span>
            <span className="bg-indigo-950 text-indigo-300 text-xs px-2 py-0.5 rounded border border-indigo-800/40 font-semibold">
              {result.pct}% area changed
            </span>
          </div>
          <img src={result.overlay} className="rounded-lg max-h-[220px] w-full object-contain border border-slate-800" alt="Change detection overlay highlighting modified regions" />
          <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800/80 leading-relaxed">
            {result.description}
          </div>
        </div>
      )}
    </div>
  )
}
