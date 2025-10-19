import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

function ImagePreviewModal({ src, alt, onClose }) {
  const [zoom, setZoom] = useState(1);

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = alt || 'image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="btn btn-circle btn-sm bg-base-100/90 hover:bg-base-100"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="btn btn-circle btn-sm bg-base-100/90 hover:bg-base-100"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="btn btn-circle btn-sm bg-base-100/90 hover:bg-base-100"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="btn btn-circle btn-sm bg-base-100/90 hover:bg-base-100"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Image */}
      <div className="max-w-full max-h-full overflow-auto" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt || 'Preview'}
          className="max-w-none transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        />
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-base-100/90 px-3 py-1 rounded-full text-sm">
        {Math.round(zoom * 100)}%
      </div>
    </div>,
    document.body
  );
}

export default ImagePreviewModal;
