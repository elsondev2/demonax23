import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';

const ImageUpload = ({
  onImageSelect,
  onImageRemove,
  currentImage = null,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(currentImage);
  const fileInputRef = useRef(null);

  const validateFile = useCallback((file) => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPG, PNG, GIF, WebP)';
    }

    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
    }

    return null;
  }, [acceptedTypes, maxSize]);

  const processFile = useCallback(async (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Call the parent callback with the file
      await onImageSelect(file);

    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error('Image processing error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, onImageSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleRemove = useCallback(async () => {
    try {
      setIsUploading(true);
      setPreview(null);
      setError('');

      // Clean up object URL
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }

      await onImageRemove();
    } catch (err) {
      setError('Failed to remove image. Please try again.');
      console.error('Image removal error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [preview, onImageRemove]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Upload Area */}
      {!preview ? (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-all duration-200 hover:border-primary/50
            ${isDragOver ? 'border-primary bg-primary/5' : 'border-base-300'}
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-base-content/70">Processing image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-base-content">
                  Drop banner image here or click to browse
                </p>
                <p className="text-sm text-base-content/60 mt-1">
                  Supports JPG, PNG, GIF, WebP (max {Math.round(maxSize / 1024 / 1024)}MB)
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Image Preview */
        <div className="relative group">
          <div className="relative overflow-hidden rounded-lg border border-base-300">
            <img
              src={preview}
              alt="Banner preview"
              className="w-full h-48 object-cover"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              <button
                onClick={openFileDialog}
                className="btn btn-sm btn-primary"
                disabled={isUploading}
              >
                <ImageIcon className="w-4 h-4" />
                Change
              </button>

              <button
                onClick={handleRemove}
                className="btn btn-sm btn-error"
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
                Remove
              </button>
            </div>

            {/* Loading overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-white">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-sm">Processing...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2 text-error text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto btn btn-xs btn-ghost btn-circle"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;