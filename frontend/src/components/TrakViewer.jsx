import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react'

export default function TrakViewer({ trak, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex(i => Math.min((trak.items?.length || 1) - 1, i + 1))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [trak, onClose])

  const item = trak.items?.[index]
  if (!item) return null
  const isImage = item.contentType?.startsWith('image/')

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={(e)=>{ if (e.target === e.currentTarget) onClose() }}>
      <button className="absolute top-4 right-4 btn btn-sm btn-circle" onClick={onClose}><X className="w-5 h-5"/></button>

      {index > 0 && (
        <button className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-lg" onClick={()=> setIndex(i => Math.max(0, i-1))}>
          <ChevronLeft className="w-6 h-6"/>
        </button>
      )}

      {index < (trak.items?.length || 0) - 1 && (
        <button className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-lg" onClick={()=> setIndex(i => Math.min((trak.items?.length || 1)-1, i+1))}>
          <ChevronRight className="w-6 h-6"/>
        </button>
      )}

      <div className="max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
        {isImage ? (
          <img src={item.url} alt={item.filename} className="max-w-full max-h-[80vh] object-contain rounded-lg"/>
        ) : (
          <div className="bg-base-100 p-8 rounded-lg flex flex-col items-center gap-4">
            <div className="text-lg font-medium text-base-content">{item.filename}</div>
            <a href={item.url} download target="_blank" rel="noreferrer" className="btn btn-primary"><Download className="w-4 h-4 mr-2"/>Download</a>
          </div>
        )}
        <div className="mt-4 text-base-content text-center">
          <div className="font-medium">{trak.title || 'Untitled Trak'}</div>
          <div className="text-sm opacity-70">{trak.caption}</div>
          <div className="text-xs opacity-50 mt-2">{index + 1} / {trak.items?.length || 0}</div>
        </div>
      </div>
    </div>
  )
}
