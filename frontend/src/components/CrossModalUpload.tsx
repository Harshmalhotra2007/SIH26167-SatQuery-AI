import React, { useState } from 'react'

interface Props {
  onCrossModalSubmitted: (optId: string, sarId: string, question: string) => void
  loading: boolean
}

export default function CrossModalUpload({ onCrossModalSubmitted, loading }: Props) {
  const [opticalFile, setOpticalFile] = useState<File | null>(null)
  const [sarFile, setSarFile] = useState<File | null>(null)
  const [optId, setOptId] = useState<string | null>(null)
  const [sarId, setSarId] = useState<string | null>(null)
  const [question, setQuestion] = useState("Cross-reference optical surface reflectance and SAR backscatter penetration for soil/built-up analysis.")
  const [uploading, setUploading] = useState(false)

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    return data.image_id
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!opticalFile || !sarFile) return

    setUploading(true)
    try {
      let oId = optId
      let sId = sarId

      if (!oId) {
        oId = await uploadFile(opticalFile)
        setOptId(oId)
      }
      if (!sId) {
        sId = await uploadFile(sarFile)
        setSarId(sId)
      }

      onCrossModalSubmitted(oId, sId, question)
    } catch (err) {
      alert('Failed to upload Optical or SAR image.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          Cross-Modal Reasoning (Optical + SAR)
        </h2>
        <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
          Sentinel-1 / Sentinel-2 / GeoTIFF
        </span>
      </div>
      <p className="text-xs text-slate-400">
        Upload co-registered Optical (Sentinel-2 / Cartosat) and SAR (Sentinel-1 / RISAT) image pairs in GeoTIFF (.tif) or standard formats.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Optical Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-lg p-4 text-center bg-slate-950/50 transition-colors">
            <label className="cursor-pointer block space-y-2">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
                1. Optical Image (Sentinel-2 / Cartosat)
              </span>
              <input
                type="file"
                accept="image/*,.tif,.tiff"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setOpticalFile(e.target.files[0])
                    setOptId(null)
                  }
                }}
                className="hidden"
              />
              <div className="text-xs text-slate-300">
                {opticalFile ? (
                  <span className="text-emerald-400 font-medium">✓ {opticalFile.name}</span>
                ) : (
                  <span>Click or drag Optical GeoTIFF/PNG</span>
                )}
              </div>
            </label>
          </div>

          {/* SAR Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-lg p-4 text-center bg-slate-950/50 transition-colors">
            <label className="cursor-pointer block space-y-2">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block">
                2. SAR Image (Sentinel-1 VV/VH / RISAT)
              </span>
              <input
                type="file"
                accept="image/*,.tif,.tiff"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setSarFile(e.target.files[0])
                    setSarId(null)
                  }
                }}
                className="hidden"
              />
              <div className="text-xs text-slate-300">
                {sarFile ? (
                  <span className="text-emerald-400 font-medium">✓ {sarFile.name}</span>
                ) : (
                  <span>Click or drag SAR GeoTIFF/PNG</span>
                )}
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1 font-medium">Cross-Modal Question Prompt</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            placeholder="e.g. Cross-reference optical reflectances and SAR dielectric backscatter"
          />
        </div>

        <button
          type="submit"
          disabled={!opticalFile || !sarFile || uploading || loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white font-medium py-2 rounded text-sm transition-all shadow"
        >
          {uploading || loading ? 'Fusing Optical & SAR Signatures...' : 'Run Cross-Modal Reasoning'}
        </button>
      </form>
    </div>
  )
}
