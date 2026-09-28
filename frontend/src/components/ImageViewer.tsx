import { useEffect, useRef, useState } from 'react'

type Layer = { id: string; label: string; src: string }

type Props = {
  src: string
  alt?: string
  layers?: Layer[]
  bbox?: [number, number, number, number]
}

const MIN_ZOOM = 0.5
const MAX_ZOOM = 4
const ZOOM_STEP = 0.25

export default function ImageViewer({ src, alt = 'Satellite imagery', layers, bbox }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const draggingRef = useRef(false)

  const [zoom, setZoom] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [brightness, setBrightness] = useState(1)
  const [contrast, setContrast] = useState(1)
  const [sharpen, setSharpen] = useState(false)
  const [activeLayerId, setActiveLayerId] = useState(layers?.[0]?.id ?? '')

  const activeSrc = layers && layers.length > 0
    ? (layers.find((l) => l.id === activeLayerId)?.src ?? src)
    : src

  const applyTransform = () => {
    const img = imgRef.current
    if (!img) return
    const o = offsetRef.current
    img.style.transform =
      'translate(' + o.x + 'px, ' + o.y + 'px) scale(' + zoomRef.current + ')'
  }

  useEffect(() => {
    zoomRef.current = zoom
    if (zoom <= 1) offsetRef.current = { x: 0, y: 0 }
    applyTransform()
  }, [zoom])

  useEffect(() => {
    applyTransform()
  }, [activeSrc])

  const reset = () => {
    offsetRef.current = { x: 0, y: 0 }
    setZoom(1)
    applyTransform()
  }

  const zoomIn = () => setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM))

  const zoomOut = () => setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM))

  const onMouseDown = (e: React.MouseEvent) => {
    if (zoomRef.current <= 1) return
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const origX = offsetRef.current.x
    const origY = offsetRef.current.y

    draggingRef.current = true
    setDragging(true)

    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return
      offsetRef.current = {
        x: origX + (ev.clientX - startX),
        y: origY + (ev.clientY - startY),
      }
      applyTransform()
    }

    const onUp = () => {
      draggingRef.current = false
      setDragging(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const onContainerMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
      setCursor({ x, y })
    }
  }

  const onContainerLeave = () => setCursor(null)

  const filterParts = ['brightness(' + brightness + ')', 'contrast(' + contrast + ')']
  if (sharpen) filterParts.push('url(#sharpen-filter)')
  const filterStyle = filterParts.join(' ')

  return (
    <div className="bg-canvas-800 border border-canvas-700 rounded-card overflow-hidden">
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <filter id="sharpen-filter">
            <feConvolveMatrix
              order="3"
              preserveAlpha="true"
              kernelMatrix="0 -1 0 -1 5 -1 0 -1 0"
            />
          </filter>
        </defs>
      </svg>

      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-canvas-700 bg-canvas-900/50">
        <div className="flex items-center gap-1">
          {layers && layers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayerId(layer.id)}
              className={
                'px-2.5 py-1 text-xs rounded transition-colors ' +
                (layer.id === activeLayerId
                  ? 'bg-accent-500 text-canvas-950 font-medium'
                  : 'bg-canvas-700 text-stone-300 hover:bg-canvas-600')
              }
            >
              {layer.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="w-7 h-7 flex items-center justify-center rounded bg-canvas-700 hover:bg-canvas-600 text-stone-300 disabled:opacity-40 transition-colors text-sm"
            aria-label="Zoom out"
          >
            -
          </button>
          <span className="text-xs text-stone-400 font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="w-7 h-7 flex items-center justify-center rounded bg-canvas-700 hover:bg-canvas-600 text-stone-300 disabled:opacity-40 transition-colors text-sm"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-2 py-1 text-xs rounded bg-canvas-700 hover:bg-canvas-600 text-stone-300 transition-colors ml-1"
          >
            Reset
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onContainerMove}
        onMouseLeave={onContainerLeave}
        className={
          'relative bg-canvas-950 overflow-hidden select-none ' +
          (zoom > 1 ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair')
        }
        style={{ minHeight: '480px', maxHeight: '600px' }}
      >
        <img
          ref={imgRef}
          src={activeSrc}
          alt={alt}
          draggable={false}
          className="w-full h-full object-contain pointer-events-none"
          style={{
            transformOrigin: 'center center',
            filter: filterStyle,
          }}
        />

        {bbox && (
          <div
            className="absolute border-2 border-accent-400 bg-accent-400/15 pointer-events-none"
            style={{
              left: (bbox[0] * 100) + '%',
              top: (bbox[1] * 100) + '%',
              width: ((bbox[2] - bbox[0]) * 100) + '%',
              height: ((bbox[3] - bbox[1]) * 100) + '%',
            }}
          />
        )}

        {cursor && (
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-canvas-900/85 text-stone-300 text-xs font-mono pointer-events-none">
            x: {cursor.x}  y: {cursor.y}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 px-3 py-2.5 border-t border-canvas-700 bg-canvas-900/50">
        <label className="flex items-center gap-2 text-xs text-stone-400">
          <span className="w-16 flex-shrink-0">Brightness</span>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
            className="flex-1 accent-amber-500"
          />
          <span className="font-mono w-9 text-right text-stone-300">{brightness.toFixed(2)}</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-stone-400">
          <span className="w-16 flex-shrink-0">Contrast</span>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.05"
            value={contrast}
            onChange={(e) => setContrast(parseFloat(e.target.value))}
            className="flex-1 accent-amber-500"
          />
          <span className="font-mono w-9 text-right text-stone-300">{contrast.toFixed(2)}</span>
        </label>
        <div className="col-span-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setSharpen((s) => !s)}
            className={
              'px-3 py-1 text-xs rounded transition-colors ' +
              (sharpen
                ? 'bg-accent-500 text-canvas-950 font-medium'
                : 'bg-canvas-700 text-stone-300 hover:bg-canvas-600')
            }
          >
            {sharpen ? 'Sharpen: On' : 'Sharpen: Off'}
          </button>
        </div>
      </div>
    </div>
  )
}