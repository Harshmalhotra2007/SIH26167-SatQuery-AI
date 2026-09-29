import { useState } from 'react'
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch'

type Layer = { id: string; label: string; src: string }

type Props = {
  src: string
  alt?: string
  layers?: Layer[]
  bbox?: [number, number, number, number]
}

type ToolbarProps = {
  layers?: Layer[]
  activeLayerId: string
  setActiveLayerId: (id: string) => void
  zoomPercent: number
  setZoomPercent: (z: number) => void
}

function Toolbar({ layers, activeLayerId, setActiveLayerId, zoomPercent, setZoomPercent }: ToolbarProps) {
    const { resetTransform, centerView } = useControls()

  const handleZoomIn = () => {
    const next = Math.min(zoomPercent / 100 + 0.25, 4)
    centerView(next, 0)
    setZoomPercent(Math.round(next * 100))
  }

  const handleZoomOut = () => {
    const next = Math.max(zoomPercent / 100 - 0.25, 0.5)
    centerView(next, 0)
    setZoomPercent(Math.round(next * 100))
  }

  const handleReset = () => {
    resetTransform()
    setZoomPercent(100)
  }

  return (
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
          onClick={handleZoomOut}
          disabled={zoomPercent <= 50}
          className="w-7 h-7 flex items-center justify-center rounded bg-canvas-700 hover:bg-canvas-600 text-stone-300 disabled:opacity-40 transition-colors text-sm"
          aria-label="Zoom out"
        >
          -
        </button>
        <span className="text-xs text-stone-400 font-mono w-12 text-center">{zoomPercent}%</span>
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoomPercent >= 400}
          className="w-7 h-7 flex items-center justify-center rounded bg-canvas-700 hover:bg-canvas-600 text-stone-300 disabled:opacity-40 transition-colors text-sm"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-2 py-1 text-xs rounded bg-canvas-700 hover:bg-canvas-600 text-stone-300 transition-colors ml-1"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export default function ImageViewer({ src, alt = 'Satellite imagery', layers, bbox }: Props) {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [brightness, setBrightness] = useState(1)
  const [contrast, setContrast] = useState(1)
  const [sharpen, setSharpen] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [activeLayerId, setActiveLayerId] = useState(layers?.[0]?.id ?? '')
  const [zoomPercent, setZoomPercent] = useState(100)

  const activeSrc = layers && layers.length > 0
    ? (layers.find((l) => l.id === activeLayerId)?.src ?? src)
    : src

  const onContainerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    setCursor({ x, y })
  }

  const filterParts = ['brightness(' + brightness + ')', 'contrast(' + contrast + ')']
  if (sharpen) filterParts.push('url(#sharpen-filter)')
  const filterStyle = filterParts.join(' ')

  return (
    <div className="bg-canvas-800 border border-canvas-700 rounded-card overflow-hidden">
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <filter id="sharpen-filter">
            <feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0" />
          </filter>
        </defs>
      </svg>

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        wheel={{ disabled: true }}
        doubleClick={{ disabled: true }}
        panning={{ velocityDisabled: true, allowLeftClickPan: true }}
        limitToBounds={false}
        centerOnInit={true}
        centerZoomedOut={false}
        alignmentAnimation={{ disabled: true }}
        zoomAnimation={{ disabled: true }}
        onZoom={(ref) => setZoomPercent(Math.round(ref.state.scale * 100))}
        onZoomStart={(ref) => setZoomPercent(Math.round(ref.state.scale * 100))}
        onPanningStop={(ref) => setZoomPercent(Math.round(ref.state.scale * 100))}
      >
          <Toolbar
          layers={layers}
          activeLayerId={activeLayerId}
          setActiveLayerId={setActiveLayerId}
          zoomPercent={zoomPercent}
          setZoomPercent={setZoomPercent}
        />
        <div
          onMouseMove={onContainerMove}
          onMouseLeave={() => setCursor(null)}
          className="relative bg-canvas-950 overflow-hidden select-none min-h-[280px] max-h-[400px] sm:min-h-[480px] sm:max-h-[600px]"
     
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div className="relative" style={{ maxWidth: '100%', maxHeight: '100%' }}>
              <img
                src={activeSrc}
                alt={alt}
                draggable={false}
                onLoad={() => { setImgLoaded(true); setImgError(false) }}
                onError={() => setImgError(true)}
                className="block max-w-full max-h-full object-contain"
                style={{ filter: filterStyle, maxHeight: '600px' }}
              />

              {bbox && imgLoaded && (
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
            </div>
          </TransformComponent>

          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-canvas-600 border-t-accent-500 rounded-full animate-spin"></div>
                <span className="text-xs text-stone-400">Loading image...</span>
              </div>
            </div>
          )}

          {imgError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <svg className="w-10 h-10 text-stone-500 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm text-stone-300 mt-2">Could not load image</p>
                <p className="text-xs text-stone-500 mt-1">The image URL may have expired</p>
              </div>
            </div>
          )}

          {cursor && (
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-canvas-900/85 text-stone-300 text-xs font-mono pointer-events-none">
              x: {cursor.x}  y: {cursor.y}
            </div>
          )}
        </div>
      </TransformWrapper>

            <div className="flex flex-col gap-3 px-3 py-2.5 border-t border-canvas-700 bg-canvas-900/50">
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