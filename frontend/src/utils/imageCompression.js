import imageCompression from 'browser-image-compression';

/**
 * Compress file (image or video) automatically
 * Detects file type and uses appropriate compression
 */
export async function compressFile(file, options = {}) {
  if (file.type.startsWith('image/')) {
    return compressImage(file, options);
  } else if (file.type.startsWith('video/')) {
    // Lazy load video compression
    const { compressVideo } = await import('./videoCompression');
    return compressVideo(file, options);
  }
  return file;
}

/**
 * Silently compress image in background
 * No user notification - just works
 */
export async function compressImage(file, options = {}) {
  // Skip if not an image
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Skip if already small (< 500KB)
  if (file.size < 500 * 1024) {
    return file;
  }

  const defaultOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8,
    ...options
  };

  try {
    const compressed = await imageCompression(file, defaultOptions);
    
    // Only use compressed if it's actually smaller
    if (compressed.size < file.size) {
      return compressed;
    }
    return file;
  } catch (error) {
    // Silent fail - return original
    console.warn('Compression failed, using original:', error.message);
    return file;
  }
}

/**
 * Compress image and convert to base64
 * Silent operation - no user notification
 */
export async function compressImageToBase64(file, options = {}) {
  const compressed = await compressImage(file, options);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(compressed);
  });
}

/**
 * Compress multiple files (images/videos) in parallel
 */
export async function compressFiles(files, options = {}) {
  return Promise.all(
    Array.from(files).map(file => compressFile(file, options))
  );
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(files, options = {}) {
  return Promise.all(
    Array.from(files).map(file => compressImage(file, options))
  );
}
