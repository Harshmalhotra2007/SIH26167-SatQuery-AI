import { useState } from 'react'

interface Props {
  onCrossModalSubmitted: (optId: string, sarId: string, question: string) => void
  loading: boolean
}

const ACCEPTED = ['.tif', '.tiff', '.png', '.jpg', '.jpeg']

function isAccepted(file: File): boolean {
  const name = file.name.toLowerCase()
  return ACCEPTED.some((ext) => name.endsWith(ext)) || file.type.startsWith('image/')
}

function formatBytes(n: number): string {
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}

function uploadWithProgress(file: File, onProgress: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    fd.append('file', file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText).image_id)
        } catch {
          reject(new Error('Invalid response'))
        }
      } else {
        reject(new Error('HTTP ' + xhr.status))
      }
    }
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(fd)
  })
}

type DropzoneProps = {
  id: string
  label: string
  sublabel: string
  file: File | null
  progress: number
  accent: 'light' | 'dark'
  onSelect: (f: File) => void
  onRemove: () => void
}

function Dropzone({ id, label, sublabel, file, progress, accent, onSelect, onRemove }: DropzoneProps) {
  const activeClass = accent === 'light'
    ? 'border-accent-400 bg-accent-400/5'
    : 'border-accent-600 bg-accent-600/5'
  return (
    <div className={'border-2 border-dashed rounded-card p-4 transition-colors ' + (file ? activeClass : 'border-canvas-600 hover:border-accent-500/60 bg-canvas-900/40')}>
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-300 mb-3">{label}</p>
      <input
        type="file"
        accept=".tif,.tiff,.png,.jpg,.jpeg,image/*"
        id={id}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f) }}
      />
      <label htmlFor={id} className="cursor-pointer block text-center">
        {file ? (
          <div className="space-y-2">
            <p className="text-sm text-stone-100 truncate">{file.name}</p>
            <p className="text-xs text-stone-500">{formatBytes(file.size)}</p>
            {progress > 0 && progress < 100 && (
              <div className="h-1 bg-canvas-700 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-accent-500" style={{ width: progress + '%' }} />
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 space-y-1">
            <p className="text-sm text-stone-300">Click to select</p>
            <p className="text-xs text-stone-500">{sublabel}</p>
          </div>
        )}
      </label>
      {file && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 w-full text-xs text-stone-400 hover:text-stone-200 transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  )
}

export default function CrossModalUpload({ onCrossModalSubmitted, loading }: Props) {
  const [opticalFile, setOpticalFile] = useState<File | null>(null)
  const [sarFile, setSarFile] = useState<File | null>(null)
  const [optProgress, setOptProgress] = useState(0)
  const [sarProgress, setSarProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [question, setQuestion] = useState(
    'Cross-reference optical surface reflectance and SAR backscatter penetration for soil and built-up analysis.'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!opticalFile || !sarFile) return
    setError(null)
    setUploading(true)
    setOptProgress(0)
    setSarProgress(0)
    try {
      const optId = await uploadWithProgress(opticalFile, setOptProgress)
      const sarId = await uploadWithProgress(sarFile, setSarProgress)
      onCrossModalSubmitted(optId, sarId, question)
    } catch {
      setError('Failed to upload one or both images. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-canvas-800 border border-canvas-700 rounded-card p-6 space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-stone-50">Cross-Modal Reasoning (Optical + SAR)</h2>
        <p className="text-sm text-stone-400 mt-1">Upload co-registered Optical (Sentinel-2 / Cartosat) and SAR (Sentinel-1 / RISAT) images.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Dropzone
            id="upload-optical"
            label="Optical Image"
            sublabel="Sentinel-2 or Cartosat GeoTIFF/PNG"
            file={opticalFile}
            progress={optProgress}
            accent="light"
            onSelect={(f) => {
              if (!isAccepted(f)) { setError('Unsupported format. Please upload a GeoTIFF (.tif, .tiff), PNG, or JPEG.'); return }
              setError(null)
              setOpticalFile(f)
            }}
            onRemove={() => setOpticalFile(null)}
          />
          <Dropzone
            id="upload-sar"
            label="SAR Image"
            sublabel="Sentinel-1 or RISAT GeoTIFF/PNG"
            file={sarFile}
            progress={sarProgress}
            accent="dark"
            onSelect={(f) => {
              if (!isAccepted(f)) { setError('Unsupported format. Please upload a GeoTIFF (.tif, .tiff), PNG, or JPEG.'); return }
              setError(null)
              setSarFile(f)
            }}
            onRemove={() => setSarFile(null)}
          />
        </div>

        <p className="text-xs text-stone-500 italic">
          Both images must be co-registered to the same geographic area for meaningful comparison.
        </p>

        <div>
          <label className="block text-sm text-stone-300 mb-2">Cross-Modal Question Prompt</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-canvas-900 border border-canvas-700 rounded px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-accent-500"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={!opticalFile || !sarFile || uploading || loading}
          className="w-full bg-accent-500 hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed text-canvas-950 font-medium py-2.5 rounded transition-colors"
        >
          {uploading || loading ? 'Fusing Optical and SAR signatures...' : 'Run Cross-Modal Reasoning'}
        </button>
      </form>
    </div>
  )
}