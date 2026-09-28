import { useRef, useState } from 'react'

type Meta = { width: number; height: number; filename: string }

type Props = {
  onUploaded: (id: string, url: string, meta: Meta) => void
  currentMeta: Meta | null
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

export default function ImageUpload({ onUploaded, currentMeta }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setProgress(0)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleFile = (f: File) => {
    setError(null)
    if (!isAccepted(f)) {
      setError('Unsupported format. Please upload a GeoTIFF (.tif, .tiff), PNG, or JPEG.')
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const upload = () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    setError(null)

    const fd = new FormData()
    fd.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      setUploading(false)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          const url = data.image_url || '/static/' + data.image_id + '.jpg'
          onUploaded(data.image_id, url, {
            width: data.width,
            height: data.height,
            filename: file.name,
          })
          setProgress(100)
        } catch {
          setError('Server returned an invalid response.')
        }
      } else {
        setError('Upload failed (HTTP ' + xhr.status + ').')
      }
    }
    xhr.onerror = () => {
      setUploading(false)
      setError('Upload failed. Please check your connection.')
    }
    xhr.send(fd)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const openPicker = () => inputRef.current?.click()

  return (
    <div className="bg-canvas-800 border border-canvas-700 rounded-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-stone-50">Upload Satellite Image</h2>
          <p className="text-sm text-stone-400 mt-1">Sentinel-2 L2A scenes or comparable optical imagery</p>
        </div>
        {currentMeta && (
          <span className="text-xs px-2 py-1 rounded bg-canvas-700 text-stone-300 font-mono">
            {currentMeta.filename}
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".tif,.tiff,.png,.jpg,.jpeg,image/*"
        className="hidden"
        onChange={onChange}
      />

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={openPicker}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker() } }}
        role="button"
        tabIndex={0}
        aria-label="Upload satellite image"
        className={
          'min-h-[220px] flex items-center justify-center border-2 border-dashed rounded-card cursor-pointer transition-colors ' +
          (isDragging ? 'border-accent-500 bg-accent-500/5' : 'border-canvas-600 hover:border-accent-500/60 bg-canvas-900/40')
        }
      >
        {file && preview && !uploading ? (
          <div className="flex items-center gap-4 p-4 w-full">
            <img src={preview} alt="Selected preview" className="w-24 h-24 object-cover rounded border border-canvas-700" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-50 truncate">{file.name}</p>
              <p className="text-xs text-stone-400 mt-1">{formatBytes(file.size)}</p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); upload() }}
                  className="px-3 py-1.5 text-xs font-medium bg-accent-500 hover:bg-accent-400 text-canvas-950 rounded transition-colors"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); resetFile() }}
                  className="px-3 py-1.5 text-xs font-medium bg-canvas-700 hover:bg-canvas-600 text-stone-300 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : uploading ? (
          <div className="w-full max-w-md px-6 space-y-3">
            <p className="text-sm font-medium text-stone-50 truncate">{file?.name}</p>
            <div className="w-full h-2 bg-canvas-700 rounded-full overflow-hidden">
              <div className="h-full bg-accent-500 transition-all" style={{ width: progress + '%' }} />
            </div>
            <p className="text-xs text-stone-400 text-right">{progress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
            <svg className="w-12 h-12 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div>
              <p className="text-sm text-stone-200 font-medium">Drag image here or click to browse</p>
              <p className="text-xs text-stone-500 mt-1">GeoTIFF (.tif, .tiff), PNG, JPEG</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded px-3 py-2">{error}</p>
      )}
    </div>
  )
}