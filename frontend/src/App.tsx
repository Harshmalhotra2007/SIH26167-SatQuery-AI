import { useState, useRef } from 'react'
import ImageUpload from './components/ImageUpload'
import ChatPanel from './components/ChatPanel'
import ChangeDetection from './components/ChangeDetection'
import CrossModalUpload from './components/CrossModalUpload'
import ExecutionTracePanel, { TraceData } from './components/ExecutionTracePanel'

type Tab = 'vqa' | 'crossmodal' | 'change'

export default function App() {
  const [tab, setTab] = useState<Tab>('vqa')
  const [imageId, setImageId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; filename: string } | null>(null)
  const [traceData, setTraceData] = useState<TraceData | null>(null)
  const [confidence, setConfidence] = useState<number | undefined>(undefined)
  const [lastAnswer, setLastAnswer] = useState<string | undefined>(undefined)
  const [lastQuery, setLastQuery] = useState<string | undefined>(undefined)
  const [loadingCrossModal, setLoadingCrossModal] = useState(false)

  const handleUploaded = (
    id: string,
    url: string,
    meta?: { width: number; height: number; filename: string } | any,
    conf?: number,
    answer?: string,
    query?: string
  ) => {
    if (id) setImageId(id)
    if (url) setImageUrl(url)
    if (meta && meta.width) setImageMeta(meta)
    if (meta && meta.selected_task) setTraceData(meta)
    if (conf) setConfidence(conf)
    if (answer) setLastAnswer(answer)
    if (query) setLastQuery(query)
  }

  const handleCrossModalSubmit = async (optId: string, sarId: string, question: string) => {
    setLoadingCrossModal(true)
    setLastQuery(question)
    try {
      const res = await fetch('/api/query/cross-modal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optical_image_id: optId, sar_image_id: sarId, question }),
      })
      if (!res.ok) throw new Error('Cross-modal request failed')
      const data = await res.json()
      setImageId(optId)
      setImageUrl(`/static/img_${optId}.jpg`)
      setLastAnswer(data.answer)
      setConfidence(data.confidence)
      if (data.execution_trace) setTraceData(data.execution_trace)
    } catch (err) {
      alert('Cross-Modal Optical + SAR analysis failed.')
    } finally {
      setLoadingCrossModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-white shadow">
              SQ
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SatQuery AI
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-normal">
                  ISRO SIH26167
                </span>
              </h1>
              <p className="text-xs text-slate-400">Multimodal Remote Sensing Vision-Language Intelligence</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setTab('vqa')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                tab === 'vqa' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single-Image VQA / Caption
            </button>
            <button
              onClick={() => setTab('crossmodal')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                tab === 'crossmodal' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cross-Modal (Optical + SAR)
            </button>
            <button
              onClick={() => setTab('change')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                tab === 'change' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Change-VQA & Visual Diff
            </button>
          </nav>
        </div>
      </header>

      <main className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Input Component & Image Preview */}
          <section className="space-y-6">
            {tab === 'vqa' && (
              <ImageUpload onUploaded={handleUploaded} currentMeta={imageMeta} />
            )}
            {tab === 'crossmodal' && (
              <CrossModalUpload onCrossModalSubmitted={handleCrossModalSubmit} loading={loadingCrossModal} />
            )}
            {tab === 'change' && (
              <ChangeDetection onUploaded={handleUploaded} />
            )}

            {/* Display Viewer */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 min-h-[360px] flex flex-col items-center justify-center">
              {imageUrl ? (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <span className="font-mono text-emerald-400">✓ Active Remote Sensing Scene</span>
                    <span>{imageMeta ? `${imageMeta.width}x${imageMeta.height} px` : 'GeoTIFF / Multispectral'}</span>
                  </div>
                  <img
                    src={imageUrl}
                    alt="Loaded imagery"
                    className="max-h-[380px] w-full rounded-lg object-contain border border-slate-800 bg-slate-950"
                  />
                </div>
              ) : (
                <div className="text-center space-y-2 text-slate-500">
                  <div className="text-3xl">🛰️</div>
                  <p className="text-sm font-medium text-slate-300">No scene currently loaded</p>
                  <p className="text-xs text-slate-500">Upload a GeoTIFF, PNG, or JPEG satellite image to begin.</p>
                </div>
              )}
            </div>
          </section>

          {/* Right Panel - Chat & Execution Trace */}
          <section className="space-y-6">
            <ChatPanel imageId={imageId} disabled={!imageId} />
            <ExecutionTracePanel
              trace={traceData}
              confidence={confidence}
              lastAnswer={lastAnswer}
              lastQuery={lastQuery}
            />
          </section>
        </div>
      </main>
    </div>
  )
}