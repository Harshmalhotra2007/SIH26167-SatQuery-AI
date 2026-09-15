import { useState, useRef, useEffect } from 'react'

type Props = {
  imageId: string | null
  disabled: boolean
}

type Message = { role: 'user' | 'assistant'; content: string; latency?: number }

const QuickActions = [
  {
    id: 'caption',
    label: 'Auto Caption',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    prompt: 'Describe this satellite image in detail. Include land cover types, notable features, and spatial patterns.',
  },
  {
    id: 'count',
    label: 'Count Structures',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 20v-6h6v6M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
      </svg>
    ),
    prompt: 'How many buildings or artificial structures are visible in this image? Provide an approximate count and describe their spatial distribution.',
  },
  {
    id: 'landuse',
    label: 'Land Use Analysis',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
        <path d="M12 2v20M12 2l10 6.5" />
      </svg>
    ),
    prompt: 'Analyze the land use and land cover types in this satellite scene. Identify urban, agricultural, forest, water, and other land cover classes with their approximate proportions.',
  },
  {
    id: 'change',
    label: 'Detect Changes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M7 16h10" />
        <path d="M12 7v9" />
        <path d="M17 17l5 5" />
        <path d="M12 7l-5 5" />
      </svg>
    ),
    prompt: 'If this is a bi-temporal pair, describe what changed between the two time periods. Otherwise, suggest what temporal changes might be detectable in this area.',
  },
]

export default function ChatPanel({ imageId, disabled }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    <div className="panel-elevated flex flex-col h-[60vh] md:h-[70vh] min-h-[420px] max-h-[700px] overflow-hidden animate-slide-up stagger-2">
      {/* Header */}
      <div className="px-5 py-4 border-b border-space-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-vegetation-400/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-vegetation-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-display-sm font-semibold text-earth-50">Analysis Chat</h2>
            <p className="text-caption text-earth-400">Ask questions about the loaded satellite scene</p>
          </div>
        </div>
        {imageId && (
          <span className="meta-badge meta-badge-primary font-mono text-xs">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {imageId}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite" aria-label="Conversation">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-earth-400/60 px-8">
            <svg className="w-16 h-16 mb-4 text-space-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <p className="text-body-lg text-center text-balance">No conversation yet</p>
            <p className="text-body-sm text-center mt-1">Upload an image, then ask a question or use a quick action below</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 animate-fade-in stagger-${Math.min((i % 4) + 1, 4)} ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                m.role === 'user'
                  ? 'bg-vegetation-400/20 text-vegetation-400'
                  : 'bg-space-700 text-earth-400'
              }`}
              aria-hidden="true"
            >
              {m.role === 'user' ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v-4" />
                </svg>
              )}
            </div>
            <div className={`flex-1 min-w-0 ${m.role === 'user' ? 'text-right' : ''}`}>
              <div className={`text-caption font-medium mb-1 ${m.role === 'user' ? 'text-vegetation-400' : 'text-thermal-400'}`}>
                {m.role === 'user' ? 'You' : 'SatQuery AI'}
              </div>
              <div className={`prose prose-invert prose-sm max-w-none ${m.role === 'user' ? 'msg-user' : 'msg-assistant'}`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
              {m.latency != null && (
                <div className="msg-meta mt-1 flex items-center justify-end gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {m.latency} ms
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-space-700 flex items-center justify-center text-earth-400" aria-hidden="true">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex gap-2">
                <div className="skeleton h-4 w-1/4 rounded" />
                <div className="skeleton h-4 w-1/3 rounded" />
              </div>
              <div className="mt-2 flex gap-2">
                <div className="skeleton h-4 w-1/2 rounded" />
              </div>
              <div className="mt-2 flex gap-2">
                <div className="skeleton h-4 w-3/4 rounded" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4 border-t border-space-700/50">
        <div className="flex flex-wrap gap-2 mb-3">
          {QuickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => send(action.prompt)}
              disabled={disabled || loading}
              className="action-chip"
              aria-label={action.label}
            >
              <span className="w-4 h-4 flex items-center justify-center" aria-hidden="true">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2 border-t border-space-700/50">
        <div className="flex gap-2">
          <input
            type="text"
            className="input-field flex-1"
            placeholder={disabled ? 'Upload an image first...' : 'Ask about the satellite imagery...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled || loading}
            aria-label="Ask a question about the satellite image"
          />
          <button
            type="submit"
            className="btn-primary whitespace-nowrap"
            disabled={disabled || loading || !input.trim()}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  )
}