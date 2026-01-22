# Media Cache System

The frontend portal includes a media cache system that automatically caches images and videos in the browser for faster loading and offline access.

## Features

- **Automatic caching**: Images and videos are cached automatically when first loaded
- **Configurable expiration**: Cache duration can be configured via environment variables
- **Automatic cleanup**: Expired entries are automatically removed
- **IndexedDB storage**: Uses IndexedDB for large files (videos, high-res images)
- **localStorage fallback**: Small images (< 1MB) can fall back to localStorage
- **Preloading**: Videos and images can be preloaded in the background

## Configuration

### Environment Variables

Add to your `.env` or `.env.prod` file:

```env
# Cache duration in hours (default: 168 = 7 days)
REACT_APP_CACHE_DURATION_HOURS=168

# Or use this alternative name
REACT_APP_MEDIA_CACHE_HOURS=168
```

### Cache Duration Examples

- `24` = 1 day
- `168` = 7 days (default)
- `720` = 30 days
- `2160` = 90 days

## Usage

### Images

The cache is automatically used when you use `getCachedImageUrl()`:

```javascript
import { getCachedImageUrl } from '../utils/imageUrl';

// In your component
const imageUrl = await getCachedImageUrl('/uploads/products/image.jpg');
// Returns cached URL (object URL or base64) or fetches and caches if not available
```

Or use the React hook:

```javascript
import { useCachedImage } from '../hooks/useCachedImage';

function MyComponent() {
  const { cachedUrl, loading } = useCachedImage('/uploads/products/image.jpg');
  
  return loading ? <div>Loading...</div> : <img src={cachedUrl} alt="Product" />;
}
```

### Videos

Videos are automatically cached in `VideoBanner` component. Local video files (not YouTube/Vimeo) are cached when loaded.

### Preloading

Preload multiple images/videos:

```javascript
import { preloadMedia } from '../utils/mediaCache';

const urls = [
  'https://api.idreamegypt.com/uploads/products/1.jpg',
  'https://api.idreamegypt.com/uploads/products/2.jpg',
];

await preloadMedia(urls);
```

## Cache Management

### Cleanup Expired Entries

```javascript
import { cleanupExpired } from '../utils/mediaCache';

// Manually cleanup expired entries
await cleanupExpired();
```

### Clear All Cache

```javascript
import { clearCache } from '../utils/mediaCache';

// Clear all cached media
await clearCache();
```

### Get Cache Statistics

```javascript
import { getCacheStats } from '../utils/mediaCache';

const stats = await getCacheStats();
console.log(stats);
// {
//   indexedDB: { count: 10, size: 0 },
//   localStorage: { count: 5 },
//   cacheDurationHours: 168
// }
```

## How It Works

1. **First Load**: When an image/video is requested, it's fetched from the server and stored in IndexedDB (or localStorage for small images)

2. **Subsequent Loads**: The cached version is retrieved from IndexedDB/localStorage and returned as an object URL or base64 data URL

3. **Expiration**: Each cached item has an expiration timestamp. Expired items are automatically cleaned up:
   - On app start
   - Every hour (periodic cleanup)
   - When storage quota is exceeded

4. **Storage Strategy**:
   - **IndexedDB**: Used for all media files (no size limit, better for large files)
   - **localStorage**: Fallback for small images (< 1MB) if IndexedDB is unavailable

## Browser Support

- **IndexedDB**: Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- **localStorage**: Supported in all browsers
- **Fallback**: If IndexedDB is not available, the system falls back to localStorage for small images

## Storage Limits

- **IndexedDB**: Typically 50% of available disk space (varies by browser)
- **localStorage**: Usually 5-10MB per domain

The cache system automatically handles quota exceeded errors by cleaning up expired entries.

## Notes

- YouTube and Vimeo videos are **not cached** (they use iframes)
- Only local video files (`/uploads/videos/...`) are cached
- Images from external domains are cached if CORS allows
- Cache is domain-specific (per browser/domain)
