/**
 * Media Cache Utility
 * Caches images and videos in IndexedDB with expiration
 * Uses localStorage for metadata and as fallback for small images
 */

const CACHE_PREFIX = 'idream_media_';
const METADATA_KEY = `${CACHE_PREFIX}metadata`;
const DB_NAME = 'idream_media_cache';
const DB_VERSION = 1;
const STORE_NAME = 'media';

// Default cache duration: 7 days (in milliseconds)
const DEFAULT_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// Get cache duration from config or env (in hours, converted to ms)
const getCacheDuration = () => {
  const hours = parseInt(
    process.env.REACT_APP_CACHE_DURATION_HOURS || 
    process.env.REACT_APP_MEDIA_CACHE_HOURS || 
    '168', // 7 days default
    10
  );
  return hours * 60 * 60 * 1000;
};

let db = null;
let dbPromise = null;

/**
 * Initialize IndexedDB
 */
const initDB = () => {
  if (dbPromise) return dbPromise;
  
  if (!window.indexedDB) {
    console.warn('IndexedDB not supported, using localStorage fallback');
    return Promise.resolve(null);
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open failed:', request.error);
      resolve(null); // Fallback to localStorage
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });

  return dbPromise;
};

/**
 * Get metadata from localStorage
 */
const getMetadata = () => {
  try {
    const data = localStorage.getItem(METADATA_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Failed to read cache metadata:', e);
    return {};
  }
};

/**
 * Save metadata to localStorage
 */
const saveMetadata = (metadata) => {
  try {
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  } catch (e) {
    console.error('Failed to save cache metadata:', e);
    // If quota exceeded, try to clean up old entries
    if (e.name === 'QuotaExceededError') {
      cleanupExpired();
    }
  }
};

/**
 * Store blob in IndexedDB
 */
const storeInIndexedDB = async (url, blob, expiresAt) => {
  const db = await initDB();
  if (!db) return false;

  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const item = {
      url,
      blob,
      expiresAt,
      cachedAt: Date.now()
    };

    const request = store.put(item);
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    request.onerror = () => {
      console.error('Failed to store in IndexedDB:', request.error);
      resolve(false);
    };
  });
};

/**
 * Get blob from IndexedDB
 */
const getFromIndexedDB = async (url) => {
  const db = await initDB();
  if (!db) return null;

  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);

    request.onsuccess = () => {
      const result = request.result;
      if (result && result.expiresAt > Date.now()) {
        resolve(result.blob);
      } else {
        // Expired, delete it
        if (result) {
          deleteFromIndexedDB(url);
        }
        resolve(null);
      }
    };

    request.onerror = () => {
      resolve(null);
    };
  });
};

/**
 * Delete from IndexedDB
 */
const deleteFromIndexedDB = async (url) => {
  const db = await initDB();
  if (!db) return;

  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(url);

    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
  });
};

/**
 * Store small image in localStorage as base64 (fallback)
 */
const storeInLocalStorage = (url, base64, expiresAt) => {
  try {
    const metadata = getMetadata();
    metadata[url] = {
      type: 'base64',
      data: base64,
      expiresAt,
      cachedAt: Date.now()
    };
    saveMetadata(metadata);
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, trying cleanup');
      cleanupExpired();
      return false;
    }
    return false;
  }
};

/**
 * Get from localStorage
 */
const getFromLocalStorage = (url) => {
  const metadata = getMetadata();
  const item = metadata[url];
  
  if (!item) return null;
  
  if (item.expiresAt <= Date.now()) {
    // Expired
    delete metadata[url];
    saveMetadata(metadata);
    return null;
  }
  
  return item;
};

/**
 * Convert blob to base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Fetch and cache media
 */
const fetchAndCache = async (url, useLocalStorageFallback = false) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const blob = await response.blob();
    const expiresAt = Date.now() + getCacheDuration();
    
    // Try IndexedDB first (preferred for larger files)
    const stored = await storeInIndexedDB(url, blob, expiresAt);
    
    if (!stored && useLocalStorageFallback && blob.size < 1024 * 1024) {
      // Fallback to localStorage for small images (< 1MB)
      const base64 = await blobToBase64(blob);
      storeInLocalStorage(url, base64, expiresAt);
    }
    
    return blob;
  } catch (error) {
    console.error('Failed to fetch and cache:', url, error);
    throw error;
  }
};

/**
 * Get cached media URL (creates object URL from blob)
 */
const getCachedUrl = async (url) => {
  // Try IndexedDB first
  const blob = await getFromIndexedDB(url);
  if (blob) {
    return URL.createObjectURL(blob);
  }
  
  // Try localStorage fallback
  const item = getFromLocalStorage(url);
  if (item && item.type === 'base64') {
    return item.data; // base64 data URL
  }
  
  return null;
};

/**
 * Check if URL is cached and not expired
 */
export const isCached = async (url) => {
  const blob = await getFromIndexedDB(url);
  if (blob) return true;
  
  const item = getFromLocalStorage(url);
  return item !== null;
};

/**
 * Get cached media or fetch and cache it
 * Returns a URL (object URL or base64 data URL) that can be used in img/video src
 */
export const getCachedMedia = async (url, options = {}) => {
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:'))) {
    return url; // Not a cacheable URL
  }
  
  // Check cache first
  const cachedUrl = await getCachedUrl(url);
  if (cachedUrl) {
    return cachedUrl;
  }
  
  // Not cached or expired, fetch and cache
  try {
    await fetchAndCache(url, options.useLocalStorageFallback !== false);
    // Return the cached version
    return await getCachedUrl(url) || url;
  } catch (error) {
    // If fetch fails, return original URL
    return url;
  }
};

/**
 * Preload and cache media
 */
export const preloadMedia = async (urls) => {
  const promises = urls
    .filter(url => url && (url.startsWith('http://') || url.startsWith('https://')))
    .map(url => getCachedMedia(url).catch(() => url));
  
  await Promise.all(promises);
};

/**
 * Clean up expired entries
 */
export const cleanupExpired = async () => {
  const now = Date.now();
  
  // Clean IndexedDB
  const db = await initDB();
  if (db) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('expiresAt');
    
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }
  
  // Clean localStorage metadata
  const metadata = getMetadata();
  let cleaned = false;
  for (const url in metadata) {
    if (metadata[url].expiresAt <= now) {
      delete metadata[url];
      cleaned = true;
    }
  }
  if (cleaned) {
    saveMetadata(metadata);
  }
};

/**
 * Clear all cached media
 */
export const clearCache = async () => {
  // Clear IndexedDB
  const db = await initDB();
  if (db) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    await new Promise((resolve) => {
      request.onsuccess = resolve;
      request.onerror = resolve;
    });
  }
  
  // Clear localStorage metadata
  try {
    localStorage.removeItem(METADATA_KEY);
    // Also remove any base64 entries
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error('Failed to clear localStorage cache:', e);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  const metadata = getMetadata();
  let indexedDBCount = 0;
  let indexedDBSize = 0;
  
  const db = await initDB();
  if (db) {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();
    
    await new Promise((resolve) => {
      request.onsuccess = () => {
        indexedDBCount = request.result;
        resolve();
      };
      request.onerror = resolve;
    });
  }
  
  return {
    indexedDB: {
      count: indexedDBCount,
      size: indexedDBSize
    },
    localStorage: {
      count: Object.keys(metadata).length
    },
    cacheDurationHours: getCacheDuration() / (60 * 60 * 1000)
  };
};

// Initialize DB and cleanup on module load
if (typeof window !== 'undefined') {
  initDB().then(() => {
    // Cleanup expired entries on app start
    cleanupExpired();
    
    // Periodic cleanup every hour
    setInterval(cleanupExpired, 60 * 60 * 1000);
  });
}

export default {
  getCachedMedia,
  preloadMedia,
  isCached,
  cleanupExpired,
  clearCache,
  getCacheStats
};
