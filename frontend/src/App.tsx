import { useState } from 'react'
import TopNav from './components/TopNav'
import ImageUpload from './components/ImageUpload'
import ChatPanel from './components/ChatPanel'
import ChangeDetection from './components/ChangeDetection'
import CrossModalUpload from './components/CrossModalUpload'
import ImageViewer from './components/ImageViewer'
import ExecutionTracePanel, { TraceData } from './components/ExecutionTracePanel'

type Tab = 'analyze' | 'compare' | 'history'

export default function App() {
  const [tab, setTab] = useState<Tab>('analyze')
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
      setImageUrl('/static/img_' + optId + '.jpg')
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
    <div className="min-h-screen bg-canvas-900 text-stone-100 font-ui flex flex-col">
      <TopNav activeTab={tab} onTabChange={setTab} />

      <main className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
        {tab === 'analyze' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-7 space-y-6">
              <ImageUpload onUploaded={handleUploaded} currentMeta={imageMeta} />
              {imageUrl ? (
                <ImageViewer src={imageUrl} alt="Loaded satellite imagery" />
              ) : (
                <div className="bg-canvas-800 border border-canvas-700 rounded-card p-12 flex flex-col items-center justify-center text-center min-h-[360px]">
                  <svg className="w-12 h-12 text-stone-500 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <p className="text-sm font-medium text-stone-200">Upload an image to begin</p>
                  <p className="text-xs text-stone-500 mt-1">GeoTIFF, PNG, or JPEG satellite imagery</p>
                </div>
              )}
            </section>

            <section className="lg:col-span-5 space-y-6">
              <ChatPanel imageId={imageId} disabled={!imageId} />
              <ExecutionTracePanel
                trace={traceData}
                confidence={confidence}
                lastAnswer={lastAnswer}
                lastQuery={lastQuery}
              />
            </section>
          </div>
        )}

        {tab === 'compare' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-7 space-y-6">
              <CrossModalUpload onCrossModalSubmitted={handleCrossModalSubmit} loading={loadingCrossModal} />

              <ChangeDetection />

              {imageUrl && <ImageViewer src={imageUrl} alt="Analysis result" />}
            </section>

            <section className="lg:col-span-5 space-y-6">
              <ChatPanel imageId={imageId} disabled={!imageId} />
              <ExecutionTracePanel
                trace={traceData}
                confidence={confidence}
                lastAnswer={lastAnswer}
                lastQuery={lastQuery}
              />
            </section>
          </div>
        )}

        {tab === 'history' && (
          <div className="bg-canvas-800 border border-canvas-700 rounded-card p-12 min-h-[60vh] flex flex-col items-center justify-center text-center">
            <svg className="w-12 h-12 text-stone-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7l-2-2H5a2 2 0 0 0-2 2z" />
            </svg>
            <h2 className="text-lg font-display font-semibold text-stone-200">No analyses yet</h2>
            <p className="text-sm text-stone-500 mt-2 max-w-md">
              Your past queries will appear here once you run an analysis.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}