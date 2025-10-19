/**
 * Image Cache Utility
 * Caches profile pictures and other images for faster loading
 */

class ImageCache {
  constructor() {
    this.cache = new Map();
    this.loading = new Set();
    this.maxCacheSize = 1000; // Maximum number of images to cache (increased from 500)
    this.stats = {
      hits: 0,
      misses: 0,
      preloaded: 0,
      failed: 0
    };
    
    // Preload default avatar to avoid flashing
    this.preload('/avatar.png').catch(() => {});
  }

  /**
   * Preload and cache an image
   * @param {string} url - Image URL to cache
   * @returns {Promise<string>} - Resolves with the URL when loaded
   */
  async preload(url) {
    if (!url || url === '/avatar.png') return url;

    // Already cached
    if (this.cache.has(url)) {
      this.stats.hits++;
      return url;
    }

    this.stats.misses++;

    // Already loading
    if (this.loading.has(url)) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.cache.has(url) || !this.loading.has(url)) {
            clearInterval(checkInterval);
            resolve(url);
          }
        }, 50);
      });
    }

    // Start loading
    this.loading.add(url);

    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        this.loading.delete(url);
        this.cache.set(url, true);
        this.stats.preloaded++;

        // Enforce cache size limit (LRU - remove oldest)
        if (this.cache.size > this.maxCacheSize) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }

        resolve(url);
      };

      img.onerror = () => {
        this.loading.delete(url);
        this.stats.failed++;
        // Don't reject - just resolve with URL so app continues working
        resolve(url);
      };

      img.src = url;
    });
  }

  /**
   * Preload multiple images
   * @param {string[]} urls - Array of image URLs
   * @returns {Promise<void>}
   */
  async preloadBatch(urls) {
    const uniqueUrls = [...new Set(urls)].filter(url => url && url !== '/avatar.png');

    if (uniqueUrls.length === 0) return;

    console.log(`🖼️ Preloading ${uniqueUrls.length} images...`);
    const startTime = Date.now();

    // Load in batches of 20 to optimize performance (increased from 15)
    const batchSize = 20;
    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
      const batch = uniqueUrls.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(url => this.preload(url)));
    }

    const duration = Date.now() - startTime;
    const successCount = uniqueUrls.filter(url => this.cache.has(url)).length;
    console.log(`✅ Preloaded ${successCount}/${uniqueUrls.length} images in ${duration}ms`);
    console.log(`📊 Cache stats:`, this.getStats());
  }

  /**
   * Check if an image is cached
   * @param {string} url - Image URL
   * @returns {boolean}
   */
  isCached(url) {
    return this.cache.has(url);
  }

  /**
   * Clear the cache
   */
  clear() {
    this.cache.clear();
    this.loading.clear();
  }

  /**
   * Get cache statistics
   * @returns {object}
   */
  getStats() {
    return {
      cached: this.cache.size,
      loading: this.loading.size,
      maxSize: this.maxCacheSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      preloaded: this.stats.preloaded,
      failed: this.stats.failed,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? `${Math.round((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100)}%`
        : '0%'
    };
  }
}

// Export singleton instance
export const imageCache = new ImageCache();

/**
 * Hook to preload images when component mounts
 * @param {string[]} urls - Array of image URLs to preload
 */
export const useImagePreload = (urls) => {
  if (typeof window !== 'undefined') {
    // Preload on next tick to avoid blocking render
    setTimeout(() => {
      imageCache.preloadBatch(urls).catch(() => {
        // Silent fail - images will load normally if preload fails
      });
    }, 0);
  }
};

export default imageCache;
