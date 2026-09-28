import { useState } from 'react'
import TopNav from './components/TopNav'
import ImageUpload from './components/ImageUpload'
import ChatPanel from './components/ChatPanel'
import ChangeDetection from './components/ChangeDetection'
import CrossModalUpload from './components/CrossModalUpload'
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <TopNav activeTab={tab} onTabChange={setTab} />

      <main className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
        {tab === 'analyze' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Left Panel - Image Viewer (60%) */}
            <section className="lg:col-span-7 lg:col-start-1 space-y-6 overflow-y-auto">
              <ImageUpload onUploaded={handleUploaded} currentMeta={imageMeta} />

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
                      className="max-h-[400px] w-full rounded-lg object-contain border border-slate-800 bg-slate-950"
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-2 text-slate-500">
                    <div className="text-3xl">🛰️</div>
                    <p className="text-sm font-medium text-slate-300">Upload an image to begin</p>
                    <p className="text-xs text-slate-500">Upload a GeoTIFF, PNG, or JPEG satellite image to begin.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Right Panel - Chat & Execution Trace (40%) */}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Left Panel - Cross-Modal Upload (60%) */}
            <section className="lg:col-span-7 lg:col-start-1 space-y-6 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
                    Cross-Modal Reasoning (Optical + SAR)
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                    Sentinel-1 / Sentinel-2 / GeoTIFF
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Upload co-registered Optical (Sentinel-2 / Cartosat) and SAR (Sentinel-1 / RISAT) image pairs in GeoTIFF (.tif) or standard formats.
                </p>
                <CrossModalUpload onCrossModalSubmitted={handleCrossModalSubmit} loading={loadingCrossModal} />
              </div>

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
                      className="max-h-[400px] w-full rounded-lg object-contain border border-slate-800 bg-slate-950"
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-2 text-slate-500">
                    <div className="text-3xl">🛰️</div>
                    <p className="text-sm font-medium text-slate-300">Upload an image to begin</p>
                    <p className="text-xs text-slate-500">Upload a GeoTIFF, PNG, or JPEG satellite image to begin.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Right Panel - Chat & Execution Trace (40%) */}
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
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 min-h-[60vh] flex flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-4xl text-slate-600">📂</div>
              <h2 className="text-xl font-bold text-slate-300">Your analysis history will appear here</h2>
              <p className="text-sm text-slate-500 max-w-md">
                No queries yet. Your past analyses will appear here.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}