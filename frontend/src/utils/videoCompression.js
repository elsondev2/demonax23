// Singleton FFmpeg instance
let ffmpegInstance = null;
let isLoading = false;
let loadPromise = null;
let ffmpegModule = null;

/**
 * Dynamically import FFmpeg to avoid build issues
 */
async function loadFFmpegModule() {
  if (ffmpegModule) return ffmpegModule;

  try {
    ffmpegModule = await import('@ffmpeg/ffmpeg');
    return ffmpegModule;
  } catch (error) {
    console.warn('Failed to import FFmpeg module:', error.message);
    throw error;
  }
}

/**
 * Get or create FFmpeg instance
 * Lazy loading - only loads when first video needs compression
 */
async function getFFmpeg() {
  if (ffmpegInstance && ffmpegInstance.isLoaded()) {
    return ffmpegInstance;
  }

  // If already loading, wait for it
  if (isLoading && loadPromise) {
    await loadPromise;
    return ffmpegInstance;
  }

  // Start loading
  isLoading = true;
  loadPromise = (async () => {
    try {
      const { createFFmpeg } = await loadFFmpegModule();

      ffmpegInstance = createFFmpeg({
        log: false, // Silent operation
        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
      });

      await ffmpegInstance.load();
      console.log('🎬 Video compression ready');
      return ffmpegInstance;
    } catch (error) {
      console.warn('Failed to load FFmpeg:', error.message);
      ffmpegInstance = null;
      throw error;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

/**
 * Compress video file
 * Silent operation - no user notification
 */
export async function compressVideo(file, options = {}) {
  // Skip if not a video
  if (!file.type.startsWith('video/')) {
    return file;
  }

  // Skip if already small (< 5MB)
  if (file.size < 5 * 1024 * 1024) {
    return file;
  }

  const {
    quality = 28, // CRF value (lower = better quality, 18-28 recommended)
    maxWidth = 1280,
    maxHeight = 720,
  } = options;

  try {
    const ffmpeg = await getFFmpeg();
    const { fetchFile } = await loadFFmpegModule();

    // Write input file
    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    ffmpeg.FS('writeFile', inputName, await fetchFile(file));

    // Compress video with smart settings
    await ffmpeg.run(
      '-i', inputName,
      '-c:v', 'libx264',        // H.264 codec
      '-crf', String(quality),   // Quality (18-28)
      '-preset', 'fast',         // Encoding speed
      '-vf', `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`, // Scale down if needed
      '-c:a', 'aac',            // Audio codec
      '-b:a', '128k',           // Audio bitrate
      '-movflags', '+faststart', // Web optimization
      outputName
    );

    // Read compressed file
    const data = ffmpeg.FS('readFile', outputName);
    const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });

    // Clean up
    try {
      ffmpeg.FS('unlink', inputName);
      ffmpeg.FS('unlink', outputName);
    } catch {
      // Ignore cleanup errors
    }

    // Only use compressed if it's smaller
    if (compressedBlob.size < file.size) {
      // Convert to File object
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'video/mp4',
        lastModified: Date.now(),
      });

      return compressedFile;
    }

    return file;
  } catch (error) {
    // Silent fail - return original
    console.warn('Video compression failed, using original:', error.message);
    return file;
  }
}

/**
 * Compress video and convert to base64
 * Silent operation with progress callback
 */
export async function compressVideoToBase64(file, options = {}) {
  const { onProgress } = options;

  if (onProgress) onProgress(10);

  const compressed = await compressVideo(file, options);

  if (onProgress) onProgress(80);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (onProgress) onProgress(100);
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(compressed);
  });
}

/**
 * Check if video compression is available
 */
export async function isVideoCompressionAvailable() {
  try {
    await getFFmpeg();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get video duration
 */
export function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Get video dimensions
 */
export function getVideoDimensions(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}
