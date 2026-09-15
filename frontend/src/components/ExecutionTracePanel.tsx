import React from 'react'

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

export default function ExecutionTracePanel({ trace, confidence, lastAnswer, lastQuery }: Props) {
  if (!trace) {
    return (
      <div className="bg-[#181a20] border border-[#262930] rounded-2xl p-4 text-xs text-stone-400 text-center font-sans">
        Observable execution trace & confidence metadata will appear here after running a query.
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
          format: 'json'
        })
      })

      if (!res.ok) throw new Error('Report generation failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SatQuery_Execution_Report_${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      alert('Could not download report.')
    }
  }

  const confVal = confidence || trace.confidence_score || 0.92
  const confPercent = Math.round(confVal * 100)

  return (
    <div className="bg-[#181a20] border border-[#262930] rounded-2xl p-4 space-y-3 font-sans shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-[#262930] pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-200">
            Observable Execution Trace
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
            {confPercent}% Confidence
          </span>
          <span className="text-[11px] font-mono text-stone-400">
            {trace.execution_time_ms}ms
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#121316] p-2.5 rounded-xl border border-[#262930]">
          <span className="text-stone-400 block text-[10px] uppercase">Selected Task</span>
          <span className="font-medium text-stone-200">{trace.selected_task}</span>
        </div>
        <div className="bg-[#121316] p-2.5 rounded-xl border border-[#262930]">
          <span className="text-stone-400 block text-[10px] uppercase">Active VLM Engine</span>
          <span className="font-medium text-amber-300">{trace.model_used}</span>
        </div>
      </div>

      <div className="bg-[#121316] p-2.5 rounded-xl border border-[#262930] text-xs">
        <span className="text-stone-400 block text-[10px] uppercase mb-1">Fine-Tuned Adapter Checkpoint</span>
        <span className="font-mono text-amber-400 text-[11px]">{trace.checkpoint_adapter}</span>
      </div>

      <div className="bg-[#121316] p-2.5 rounded-xl border border-[#262930] text-xs space-y-1">
        <span className="text-stone-400 block text-[10px] uppercase">Tools & Pipeline Invoked</span>
        <div className="flex flex-wrap gap-1">
          {trace.tools_invoked.map((tool, idx) => (
            <span key={idx} className="bg-[#1f232b] text-stone-300 px-2 py-0.5 rounded-md text-[10px] font-mono border border-[#262930]">
              {tool}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={handleDownloadReport}
        className="w-full mt-2 bg-[#1f232b] hover:bg-amber-500/20 hover:border-amber-500/40 text-stone-200 hover:text-amber-200 text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all border border-[#262930]"
      >
        <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download Execution Audit Report (JSON)
      </button>
    </div>
  )
}

