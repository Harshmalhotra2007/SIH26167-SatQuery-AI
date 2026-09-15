import { useState, useRef } from 'react'
import { Analytics } from '@vercel/analytics/react'
import ImageUpload from './components/ImageUpload'
import ChatPanel from './components/ChatPanel'
import ChangeDetection from './components/ChangeDetection'

type Tab = 'vqa' | 'change'

export default function App() {
  const [tab, setTab] = useState<Tab>('vqa')
  const [imageId, setImageId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUploaded = (id: string, url: string) => {
    setImageId(id)
    setImageUrl(url)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">SatQuery AI</h1>
        <nav className="space-x-2">
          <button
            onClick={() => setTab('vqa')}
            className={`px-3 py-1.5 rounded text-sm ${tab === 'vqa' ? 'bg-indigo-500' : 'bg-slate-800'}`}
          >
            VQA / Caption
          </button>
          <button
            onClick={() => setTab('change')}
            className={`px-3 py-1.5 rounded text-sm ${tab === 'change' ? 'bg-indigo-500' : 'bg-slate-800'}`}
          >
            Change Detection
          </button>
        </nav>
      </header>

      <main className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
        <section className="space-y-4">
          {tab === 'vqa' && (
            <ImageUpload onUploaded={handleUploaded} currentId={imageId} />
          )}
          {tab === 'change' && (
            <ChangeDetection onUploaded={handleUploaded} />
          )}

          <div className="rounded border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400">
            {imageUrl ? (
              <img src={imageUrl} className="max-h-[360px] max-w-full rounded object-contain" alt="Uploaded satellite imagery" />
            ) : (
              <div className="aspect-video w-full flex items-center justify-center">
                <span>No image loaded</span>
              </div>
            )}
          </div>
        </section>

        <section>
          <ChatPanel imageId={imageId} disabled={!imageId} />
        </section>
      </main>
      <Analytics />
    </div>
  )
}

