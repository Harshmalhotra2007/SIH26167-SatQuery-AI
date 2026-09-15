import { useRef, useState } from 'react'

type Props = {
  onUploaded: (id: string, url: string, meta: { width: number; height: number; filename: string }) => void
  currentMeta: { width: number; height: number; filename: string } | null
}

export default function ImageUpload({ onUploaded, currentMeta }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filename, setFilename] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const onFile = async (file: File) => {
    setUploading(true)
    setFilename(file.name)
    setProgress(0)
    try {
      const fd = new FormData()
      fd.append('file', file)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + Math.random() * 15, 90))
      }, 200)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      clearInterval(progressInterval)
      setProgress(100)

      if (!res.ok) {
        let msg = 'upload failed'
        try {
          const err = await res.json()
          msg = err?.error?.message || msg
        } catch {}
        alert(msg)
        return
      }
      const data = await res.json()
      const imageUrl = data.image_url || `/static/${data.image_id}.jpg`
      onUploaded(data.image_id, imageUrl, {
        width: data.width,
        height: data.height,
        filename: file.name
      })
    } catch (e) {
      console.error(e)
      alert('Upload failed. Please check your connection and try again.')
    } finally {
      setUploading(false)
      setProgress(0)
      setTimeout(() => setFilename(null), 1000)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    dropZoneRef.current?.classList.add('drag-over')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only clear if leaving the actual drop zone, not a child
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
      dropZoneRef.current?.classList.remove('drag-over')
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dropZoneRef.current?.classList.remove('drag-over')
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      await onFile(file)
    }
  }

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await onFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleClick = () => inputRef.current?.click()

  return (
    <div className="panel space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-display-sm font-semibold text-earth-50">Upload Satellite Image</h2>
          {currentMeta && (
            <span className="meta-badge meta-badge-primary">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {currentMeta.filename}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-caption text-earth-400 font-mono">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
            {currentMeta ? `${currentMeta.width}×${currentMeta.height}` : '—'}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <path d="M22 10l-5-5" />
            </svg>
            {currentMeta ? `${(currentMeta.width * currentMeta.height / 1e6).toFixed(1)} MP` : '—'}
          </span>
        </div>
      </div>

      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`drop-zone ${isDragging ? 'drag-over' : ''} ${filename ? 'active' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }}}
        aria-label="Upload satellite image drop zone"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
          aria-label="Choose satellite image file"
        />

        <div className="flex flex-col items-center justify-center space-y-4 min-h-[200px]">
          <div className="relative">
            {uploading ? (
              <>
                <svg className="w-16 h-16 mx-auto spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-vegetation-400/20 border-t-vegetation-400 animate-spin" />
                </div>
              </>
            ) : isDragging ? (
              <svg className="w-16 h-16 mx-auto text-vegetation-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <path d="M22 10l-5-5" />
              </svg>
            ) : (
              <svg className="w-16 h-16 mx-auto text-space-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15 15 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15 15 0 0 1 4-10z" />
                <path d="M2 12h20" />
              </svg>
            )}

            {uploading && filename && (
              <div className="mt-4 w-48 h-2 bg-space-700 rounded-full overflow-hidden">
                <div className="h-full bg-vegetation-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          <div className="text-center space-y-1 px-4">
            {uploading ? (
              <>
                <p className="text-body text-vegetation-400 font-medium">Uploading {filename}...</p>
                <p className="text-caption text-earth-400/70">{Math.round(progress)}%</p>
              </>
            ) : isDragging ? (
              <p className="text-body text-vegetation-400 font-medium">Drop the image here</p>
            ) : filename ? (
              <>
                <p className="text-body text-earth-300 font-medium">{filename}</p>
                <p className="text-caption text-earth-400/60">Ready to analyze</p>
              </>
            ) : (
              <>
                <p className="text-body text-earth-300">
                  <strong className="text-vegetation-400 hover:underline cursor-pointer">Click to upload</strong> or drag & drop
                </p>
                <p className="text-caption text-earth-400/60">PNG, JPG, TIFF — Sentinel-2 L2A scenes</p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-caption text-earth-400/50">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Sentinel-2 L2A
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 3v12M12 3a6 6 0 000 12M12 3a6 6 0 010 12" />
              </svg>
              10 m resolution
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
              </svg>
              Multi-band
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}