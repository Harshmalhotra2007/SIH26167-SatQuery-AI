import { useState, useRef, useEffect } from 'react'

type Props = {
  imageId: string | null
  disabled: boolean
}

type Message = { role: 'user' | 'assistant'; content: string; latency?: number }

export default function ChatPanel({ imageId, disabled }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (question: string) => {
    if (!imageId || !question.trim()) return
    setMessages((m) => [...m, { role: 'user', content: question }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId, question }),
      })
      if (!res.ok) throw new Error('query failed')
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.answer, latency: data.latency_ms }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Error contacting backend.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded border border-slate-800 bg-slate-900 flex flex-col h-[520px]">
      <div className="p-3 border-b border-slate-800 text-sm font-medium">Q&A</div>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-slate-500 text-sm">Upload an image, then ask a question or leave blank to caption.</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === 'user' ? 'text-indigo-300' : 'text-slate-200'}`}>
            <div className="font-medium">{m.role === 'user' ? 'You' : 'Assistant'}</div>
            <div>{m.content}</div>
            {m.latency != null && <div className="text-xs text-slate-500">{m.latency}ms</div>}
          </div>
        ))}
        {loading && <div className="text-sm text-slate-400">Thinking...</div>}
        <div ref={endRef} />
      </div>
      <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/40 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => send("Describe this image in detail.")}
          disabled={disabled || loading}
          className="text-xs px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded disabled:opacity-40"
        >
          📷 Auto Caption
        </button>
        <button
          type="button"
          onClick={() => send("How many buildings or structures are visible in this image?")}
          disabled={disabled || loading}
          className="text-xs px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded disabled:opacity-40"
        >
          🏢 Count Buildings
        </button>
        <button
          type="button"
          onClick={() => send("Analyze the land use and land cover types in this satellite scene.")}
          disabled={disabled || loading}
          className="text-xs px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded disabled:opacity-40"
        >
          🗺️ Land Use
        </button>
      </div>
      <form
        className="p-3 border-t border-slate-800 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          className="flex-1 rounded bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder={disabled ? 'Upload an image first...' : 'Ask a question about the satellite image...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled || loading}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-medium disabled:opacity-50 transition-colors"
          disabled={disabled || loading || !input.trim()}
        >
          Send
        </button>
      </form>

    </div>
  )
}
