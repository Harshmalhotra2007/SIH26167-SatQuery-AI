import { useRef, useState } from 'react'

type Props = {
  onUploaded: (id: string, url: string) => void
  currentId: string | null
}

export default function ImageUpload({ onUploaded, currentId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filename, setFilename] = useState<string | null>(null)

  const onFile = async (file: File) => {
    setUploading(true)
    setFilename(file.name)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
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
      onUploaded(data.image_id, imageUrl)
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
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

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <div className="text-sm font-medium text-slate-200 mb-3 flex items-center justify-between">
        <span>Upload Satellite Image</span>
        {currentId && (
          <span className="text-xs text-indigo-400 font-normal bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
            ID: {currentId}
          </span>
        )}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200 scale-[0.99]'
            : 'border-slate-700/80 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-950/80 text-slate-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
            {uploading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            )}
          </div>

          <div className="text-sm">
            {uploading ? (
              <span className="text-indigo-400">Uploading {filename}...</span>
            ) : isDragging ? (
              <span className="text-indigo-400 font-medium">Drop the image here</span>
            ) : (
              <span>
                <strong className="text-indigo-400 hover:underline">Click to upload</strong> or drag & drop image
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">PNG, JPG, WEBP satellite optical scenes</p>
        </div>
      </div>
    </div>
  )
}
