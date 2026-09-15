import { useRef, useState } from 'react'

type Props = {
  onUploaded: (id: string, url: string, trace?: any, confidence?: number, lastAnswer?: string, lastQuery?: string) => void
}

export default function ChangeDetection({ onUploaded }: Props) {
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [beforeDragging, setBeforeDragging] = useState(false)
  const [afterDragging, setAfterDragging] = useState(false)
  const [question, setQuestion] = useState("What structural and land cover changes occurred between Date 1 and Date 2?")
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
      fd.append('question', question)

      const res = await fetch('/api/change', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Change VQA failed')
      const data = await res.json()
      setResult({ overlay: data.overlay_image_url, description: data.description, pct: data.change_percentage })
      
      onUploaded('', '', data.execution_trace, data.confidence, data.description, question)
    } catch (e) {
      console.error(e)
      alert('Change-VQA analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent, setFile: (f: File) => void, setDrag: (b: boolean) => void) => {
    e.preventDefault()
    e.stopPropagation()
    setDrag(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setFile(file)
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-200">
          Multitemporal Change-VQA & Visual Diff
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
          CDVQA Benchmark Compliant
        </span>
      </div>
      <p className="text-xs text-slate-400">
        Upload bi-temporal satellite scenes (GeoTIFF, PNG, JPEG) and ask natural language questions about what changed.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Before Image */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Date A (Temporal Baseline)
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
                accept="image/*,.tif,.tiff"
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
              Date B (Temporal Follow-up)
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
                accept="image/*,.tif,.tiff"
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

        <div>
          <label className="block text-xs text-slate-400 mb-1 font-medium">Change-VQA Question Prompt</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            placeholder="e.g. What structural changes occurred between Date 1 and Date 2?"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
          disabled={loading || !beforeFile || !afterFile}
        >
          {loading ? 'Executing Change-VQA Analysis...' : 'Run Change-VQA & Spatial Diff'}
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
          <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800/80 leading-relaxed font-sans">
            {result.description}
          </div>
        </div>
      )}
    </div>
  )
}
