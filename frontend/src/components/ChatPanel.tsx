import { useState, useRef, useEffect } from 'react'

type Props = {
  imageId: string | null
  disabled: boolean
}

type Message = {
  role: 'user' | 'assistant'
  content: string
  latency?: number
  error?: boolean
}

const SUGGESTED_INQUIRIES = [
  'Describe the land cover and major objects visible in this image.',
  'Is there a water body in this scene?',
  'Highlight the built-up area in the image.',
  'What is the dominant vegetation type?',
]

const LOADING_STATES = [
  'Aligning optical and SAR channels...',
  'Checking for temporal changes in vegetation...',
  'Synthesizing observations...',
  'Querying the analysis engine...',
]

function friendlyError(status: number): string {
  if (status === 404) return 'The image could not be found. Please upload it again.'
  if (status === 422) return 'The question appears to be empty. Please enter a valid query.'
  if (status === 503) return 'The analysis service is temporarily unavailable. Please try again in a moment.'
  if (status >= 500) return 'The analysis service ran into a problem. Please try again in a moment.'
  if (status >= 400) return 'The request was rejected. Please check the query and try again.'
  return 'Something went wrong. Please try again.'
}

export default function ChatPanel({ imageId, disabled }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTextIdx, setLoadingTextIdx] = useState(0)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const el = messagesContainerRef.current
  if (el) {
    el.scrollTop = el.scrollHeight
  }
}, [messages, loading])

  useEffect(() => {
    let interval: any
    if (loading) {
      interval = setInterval(() => {
        setLoadingTextIdx((prev) => (prev + 1) % LOADING_STATES.length)
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
      if (!res.ok) {
        setMessages((m) => [...m, { role: 'assistant', content: friendlyError(res.status), error: true }])
        return
      }
      const data = await res.json()
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.answer, latency: data.latency_ms },
      ])
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Could not reach the analysis service. Please check your connection.', error: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    send(input)
  }

  const copyMessage = async (content: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 1500)
    } catch {}
  }

  const downloadMessage = (content: string, idx: number) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'satquery-response-' + (idx + 1) + '.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-canvas-800 border border-canvas-700 rounded-card flex flex-col h-[60vh] md:h-[70vh] min-h-[440px] max-h-[720px] overflow-hidden">
      <div className="px-5 py-4 border-b border-canvas-700 flex items-center justify-between bg-canvas-900/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-500/15 border border-accent-500/30 flex items-center justify-center text-accent-400 font-bold text-xs">
            AI
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-100">Collaborative Analysis Assistant</h2>
            <p className="text-xs text-stone-400">
              {disabled
                ? 'Ready to analyze. Upload a satellite scene to begin.'
                : 'Scene loaded. Ask a natural language question or pick a suggestion below.'}
            </p>
          </div>
        </div>
        {imageId && (
          <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-canvas-900 text-accent-300 border border-accent-600/40">
            {imageId}
          </span>
        )}
      </div>

<div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4" role="log">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-stone-400 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-canvas-900 border border-canvas-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-stone-200">How can I assist your satellite analysis today?</p>
            <p className="text-xs text-stone-400 max-w-md">
              Upload an optical or SAR image, then ask a question or choose from the suggestions below.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={'flex gap-3 ' + (m.role === 'user' ? 'flex-row-reverse' : '')}>
            <div
              className={
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ' +
                (m.role === 'user'
                  ? 'bg-accent-500 text-canvas-950'
                  : 'bg-canvas-900 text-stone-300 border border-canvas-700')
              }
            >
              {m.role === 'user' ? 'You' : 'SQ'}
            </div>
            <div className={'max-w-[85%] ' + (m.role === 'user' ? 'text-right' : '')}>
              <div
                className={
                  m.role === 'user'
                    ? 'inline-block bg-accent-500/10 border border-accent-500/30 text-accent-100 rounded-2xl rounded-tr-sm p-3 text-sm text-left'
                    : m.error
                      ? 'inline-block bg-red-950/40 border border-red-900/60 text-red-200 rounded-2xl rounded-tl-sm p-3.5 text-sm text-left leading-relaxed'
                      : 'inline-block bg-canvas-900 border border-canvas-700 text-stone-200 rounded-2xl rounded-tl-sm p-3.5 text-sm text-left leading-relaxed'
                }
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>

              {m.role === 'assistant' && !m.error && (
                <div className="mt-1.5 flex items-center gap-3 text-[11px]">
                  <button
                    type="button"
                    onClick={() => copyMessage(m.content, i)}
                    className="text-stone-400 hover:text-accent-400 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    {copiedIdx === i ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadMessage(m.content, i)}
                    className="text-stone-400 hover:text-accent-400 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Save
                  </button>
                  {m.latency != null && <span className="text-stone-500 font-mono">{m.latency} ms</span>}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-canvas-900 text-stone-300 border border-canvas-700">
              SQ
            </div>
            <div className="flex-1 bg-canvas-900 border border-canvas-700 rounded-2xl rounded-tl-sm p-3.5 space-y-2 max-w-[85%]">
              <div className="flex items-center gap-2 text-xs text-accent-400">
                <span className="w-2 h-2 rounded-full bg-accent-400 animate-ping"></span>
                <span>{LOADING_STATES[loadingTextIdx]}</span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-2 bg-canvas-700 rounded animate-pulse" style={{ width: '85%' }}></div>
                <div className="h-2 bg-canvas-700 rounded animate-pulse" style={{ width: '70%' }}></div>
                <div className="h-2 bg-canvas-700 rounded animate-pulse" style={{ width: '55%' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {messages.length === 0 && (
        <div className="px-4 py-2 border-t border-canvas-700 bg-canvas-900/40">
          <span className="text-[11px] font-medium text-stone-400 block mb-1.5 uppercase tracking-wider">
            Suggested Inquiries
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_INQUIRIES.map((text, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInput(text)}
                disabled={disabled || loading}
                className="text-xs px-2.5 py-1 rounded-full bg-canvas-900 hover:bg-accent-500/15 hover:border-accent-500/40 text-stone-300 hover:text-accent-200 border border-canvas-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-3 border-t border-canvas-700 bg-canvas-900/80">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-canvas-950 border border-canvas-700 rounded-xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30 disabled:opacity-50"
            placeholder={disabled ? 'Upload a satellite scene first...' : 'Ask a question about the image...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled || loading}
          />
          <button
            type="submit"
            className="bg-accent-500 hover:bg-accent-400 text-canvas-950 font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
            disabled={disabled || loading || !input.trim()}
          >
            <span>Ask</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}