import { useState, useRef, useEffect } from 'react'

type Props = {
  imageId: string | null
  disabled: boolean
}

type Message = { role: 'user' | 'assistant'; content: string; latency?: number }

const SuggestedInquiries = [
  "Did the floodwaters recede between these two dates?",
  "Highlight all cargo vessels docked in the harbor.",
  "Show me high-reflectance urban sprawl in this quadrant.",
  "Auto-describe land cover & spectral characteristics.",
]

const LoadingStates = [
  "Aligning optical and SAR channels...",
  "Checking for temporal changes in vegetation...",
  "Synthesizing observations...",
  "Querying BigEarthNet QLoRA domain adapter...",
]

export default function ChatPanel({ imageId, disabled }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTextIdx, setLoadingTextIdx] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    let interval: any
    if (loading) {
      interval = setInterval(() => {
        setLoadingTextIdx((prev) => (prev + 1) % LoadingStates.length)
      }, 1400)
    } else {
      setLoadingTextIdx(0)
    }
    return () => clearInterval(interval)
  }, [loading])

  const send = async (question: string) => {
    if (!imageId || !question.trim() || loading) return
    const userMsg = question.trim()
    setMessages((m) => [...m, { role: 'user', content: userMsg }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId, question: userMsg }),
      })
      if (!res.ok) throw new Error('query failed')
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.answer, latency: data.latency_ms }])
    } catch (e) {
      console.error(e)
      setMessages((m) => [...m, { role: 'assistant', content: 'Error contacting backend. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    send(input)
  }

  return (
    <div className="bg-[#181a20] border border-[#262930] rounded-2xl flex flex-col h-[60vh] md:h-[70vh] min-h-[440px] max-h-[720px] overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Conversational Header */}
      <div className="px-5 py-4 border-b border-[#262930] flex items-center justify-between bg-[#121316]/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
            AI
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-100 flex items-center gap-2">
              Collaborative Analysis Assistant
            </h2>
            <p className="text-xs text-stone-400">
              {disabled
                ? 'Ready to analyze. Drop a satellite scene or ask about changes over time.'
                : 'Active scene loaded. Ask a natural language question or pick a suggested inquiry below.'}
            </p>
          </div>
        </div>
        {imageId && (
          <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-stone-900 text-amber-300 border border-amber-900/40">
            {imageId}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans" role="log">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-stone-400 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#1f232b] border border-[#262930] flex items-center justify-center text-amber-400 text-xl shadow">
              💡
            </div>
            <p className="text-sm font-medium text-stone-200">How can I assist your satellite analysis today?</p>
            <p className="text-xs text-stone-400 max-w-md">
              Upload an optical or SAR GeoTIFF image, then choose from the suggested prompts below or ask a custom question.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                m.role === 'user'
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-[#1f232b] text-stone-300 border border-[#262930]'
              }`}
            >
              {m.role === 'user' ? 'You' : 'SQ'}
            </div>
            <div className={`max-w-[85%] ${m.role === 'user' ? 'text-right' : ''}`}>
              <div
                className={
                  m.role === 'user'
                    ? 'inline-block bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-2xl rounded-tr-xs p-3 text-sm text-left shadow-sm'
                    : 'inline-block bg-[#1f232b] border border-[#262930] text-stone-200 rounded-2xl rounded-tl-xs p-3.5 text-sm text-left shadow-sm leading-relaxed'
                }
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
              {m.latency != null && (
                <div className="mt-1 text-[10px] font-mono text-stone-500 flex items-center justify-end gap-1">
                  <span>{m.latency} ms</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Conversational Progressive Loading State */}
        {loading && (
          <div className="flex gap-3 items-center bg-[#1f232b] border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-300 max-w-fit shadow animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>{LoadingStates[loadingTextIdx]}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Inquiries (Prompt Pills) */}
      <div className="px-4 py-2 border-t border-[#262930] bg-[#121316]/40">
        <span className="text-[11px] font-medium text-stone-400 block mb-1.5 uppercase tracking-wider">
          Suggested Inquiries
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SuggestedInquiries.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => send(promptText)}
              disabled={disabled || loading}
              className="text-xs px-2.5 py-1 rounded-full bg-[#1f232b] hover:bg-amber-500/20 hover:border-amber-500/40 text-stone-300 hover:text-amber-200 border border-[#262930] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
            >
              "{promptText}"
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#262930] bg-[#121316]/80">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-[#0d1117] border border-[#262930] rounded-xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 disabled:opacity-50"
            placeholder={disabled ? 'Upload a satellite scene first...' : 'Ask a question or type a query...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled || loading}
          />
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1 text-sm shadow"
            disabled={disabled || loading || !input.trim()}
          >
            <span>Ask</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}