const cache = new Map();

// key: string -> { value: any, expire: number }
export async function cacheWrap(key, ttlMs, fetcher) {
  try {
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && hit.expire > now) {
      return hit.value;
    }
    const value = await fetcher();
    cache.set(key, { value, expire: now + ttlMs });
    return value;
  } catch (e) {
    // On cache error, fallback to fetcher
    return await fetcher();
  }
}

export function cacheInvalidate(prefix) {
  try {
    for (const k of cache.keys()) {
      if (k.startsWith(prefix)) cache.delete(k);
    }
  } catch {}
}
