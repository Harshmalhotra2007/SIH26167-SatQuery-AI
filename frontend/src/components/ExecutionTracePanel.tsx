import { useState } from 'react'

export interface TraceData {
  selected_task: string
  model_used: string
  checkpoint_adapter: string
  tools_invoked: string[]
  parameters: Record<string, any>
  confidence_score: number
  execution_time_ms: number
}

interface Props {
  trace: TraceData | null
  confidence?: number
  lastAnswer?: string
  lastQuery?: string
}

const TOOL_LABELS: Record<string, string> = {
  RasterImageLoader: 'Image Loader',
  GeminiVLMService: 'AI Analysis Engine',
  GeminiAnalysisEngine: 'AI Analysis Engine',
  OpticalRasterioLoader: 'Optical Image Loader',
  SARImageLoader: 'SAR Image Loader',
  RasterDiffEngine: 'Change Detection Engine',
  SpatialContourDetector: 'Contour Detector',
  BigEarthNet_VLM_Adapter: 'BigEarthNet Adapter',
}

function humanTool(name: string): string {
  return TOOL_LABELS[name] ?? name
}

type TaskStyle = { bg: string; text: string; dot: string }

function taskStyle(task: string): TaskStyle {
  const t = (task || '').toLowerCase()
  if (t.includes('cross') || t.includes('optical + sar') || t.includes('fusion')) {
    return { bg: 'bg-accent-500/10', text: 'text-accent-300', dot: 'bg-accent-400' }
  }
  if (t.includes('change') || t.includes('temporal') || t.includes('diff')) {
    return { bg: 'bg-green-900/30', text: 'text-green-300', dot: 'bg-green-400' }
  }
  return { bg: 'bg-blue-900/30', text: 'text-blue-300', dot: 'bg-blue-400' }
}

export default function ExecutionTracePanel({ trace, confidence, lastAnswer, lastQuery }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!trace) {
    return (
      <div className="bg-canvas-800 border border-canvas-700 rounded-card p-4 text-xs text-stone-400 text-center">
        Execution trace and confidence metadata will appear here after running a query.
      </div>
    )
  }

  const handleDownloadReport = async () => {
    try {
      const res = await fetch('/api/report/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_name: trace.selected_task,
          query_or_prompt: lastQuery || 'Remote sensing analysis query',
          model_used: trace.model_used,
          confidence_score: confidence || trace.confidence_score,
          execution_time_ms: trace.execution_time_ms,
          tools_invoked: trace.tools_invoked,
          output_narrative: lastAnswer || 'Analysis verified.',
          format: 'json',
        }),
      })
      if (!res.ok) throw new Error('Report generation failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'SatQuery_Execution_Report_' + Date.now() + '.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Could not download report.')
    }
  }

  const confVal = confidence || trace.confidence_score || 0
  const confPercent = Math.round(confVal * 100)
  const style = taskStyle(trace.selected_task)

  const steps = [
    { label: 'Request received', done: true },
    { label: 'Image loaded', done: trace.tools_invoked.length > 0 },
    { label: 'Analysis run', done: true },
    { label: 'Response returned', done: !!lastAnswer },
  ]

  return (
    <div className="bg-canvas-800 border border-canvas-700 rounded-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={'w-full flex items-center justify-between gap-3 px-4 py-3 ' + style.bg + ' hover:opacity-90 transition-opacity text-left'}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={'w-2 h-2 rounded-full ' + style.dot + ' flex-shrink-0'}></span>
          <span className={'text-sm font-medium truncate ' + style.text}>
            {trace.selected_task}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs flex-shrink-0">
          <span className="text-stone-400 font-mono">{trace.execution_time_ms}ms</span>
          <span className="text-stone-400 font-mono">{confPercent}%</span>
          <svg
            className={'w-4 h-4 text-stone-400 transition-transform ' + (expanded ? 'rotate-180' : '')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span className="uppercase tracking-wider">Model</span>
            <span className="font-mono text-accent-300">{trace.model_used}</span>
            <span className="mx-1 text-stone-600">|</span>
            <span className="uppercase tracking-wider">Adapter</span>
            <span className="font-mono text-stone-300">
              {trace.checkpoint_adapter === 'N/A (Gemini API)' ? 'N/A (cloud model)' : trace.checkpoint_adapter}
            </span>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-stone-500 mb-2">Pipeline</p>
            <div className="flex items-center gap-2 overflow-x-auto">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={
                        'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ' +
                        (step.done
                          ? 'bg-accent-500 text-canvas-950'
                          : 'bg-canvas-700 text-stone-500')
                      }
                    >
                      {idx + 1}
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 text-center whitespace-nowrap">
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={'h-0.5 w-8 ' + (step.done ? 'bg-accent-500/50' : 'bg-canvas-700')}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-stone-500 mb-2">Tools invoked</p>
            <div className="flex flex-wrap gap-1.5">
              {trace.tools_invoked.map((tool, idx) => (
                <span
                  key={idx}
                  className="bg-canvas-900 text-stone-300 px-2 py-1 rounded text-[11px] font-mono border border-canvas-700"
                >
                  {humanTool(tool)}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-canvas-900 border border-canvas-700 rounded p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-stone-500">Latency</p>
              <p className="text-stone-200 font-mono mt-0.5">{trace.execution_time_ms} ms</p>
            </div>
            <div className="bg-canvas-900 border border-canvas-700 rounded p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-stone-500">Confidence</p>
              <p className="text-stone-200 font-mono mt-0.5">{confPercent}%</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadReport}
            className="w-full bg-canvas-700 hover:bg-accent-500/20 hover:border-accent-500/40 text-stone-200 hover:text-accent-200 text-xs font-medium py-2 rounded flex items-center justify-center gap-1.5 transition-colors border border-canvas-700"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Execution Report (JSON)
          </button>
        </div>
      )}
    </div>
  )
}