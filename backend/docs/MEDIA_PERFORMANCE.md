# Media Handling – Performance & Scalability

## Part 5 — Performance Checklist

### Image pipeline
- [x] Multer uses `diskStorage` (no memory buffering)
- [x] Image max size 5MB; types: jpg, jpeg, png, webp
- [x] Sharp converts to WebP; thumb (300px), medium (800px), original (max 1920px)
- [x] Original file removed after processing
- [x] Folder structure: `/uploads/products/{id}/images/`, `/uploads/shops/{id}/images/`
- [x] Schema stores only URLs: `thumbnailUrl`, `mediumUrl`, `originalUrl` (+ `image` for compat)
- [x] Static serving: 30 days cache, etag, lastModified

### Video pipeline
- [x] Multer diskStorage for video; max 100MB (configurable via `MAX_VIDEO_UPLOAD_MB`)
- [x] Allowed types: mp4, mov, avi
- [x] FFmpeg processing (async) in `mediaProcessor.processVideo()`: 480p + 720p MP4 (H.264 + AAC), thumbnail at 3s
- [x] Original deleted after processing
- [x] Folder structure: `/uploads/products/{id}/video/`, `/uploads/shops/{id}/video/`
- [x] Streaming endpoint: `GET /api/media/stream?path=...` with Range (206), `Accept-Ranges`, `Content-Length`, `Content-Type: video/mp4`
- [ ] Product/Shop schema video fields and admin upload routes can be wired when needed (processor and streaming are ready)

### API
- [x] `lean()` on product/shop queries where appropriate
- [x] `select()` to limit fields (listing vs detail)
- [x] Pagination: `page`, `limit` (optional; when used, response is `{ data, pagination }`)
- [x] Listing returns `thumbnailUrl` (and `image` for backward compat)
- [x] Detail returns `mediumUrl` / `originalUrl`
- [x] Indexes: `shop`, `category`, `isActive` on Product/Shop

### Frontend
- [x] `<img loading="lazy" />` via OptimizedImage
- [x] Thumbnail in listing (OptimizedImage size="thumbnail")
- [x] Medium/original in detail (OptimizedImage size="medium")
- [x] Skeleton loaders in OptimizedImage
- [x] OptimizedVideo: thumbnail + play; load on click; `preload="metadata"`; 480p default; optional 720p toggle

### Targets
- Image upload & process: aim &lt; 2s for ~3MB
- Video processing: async (non-blocking)
- Video streaming: first byte &lt; 1s with Range
- Product listing API: aim &lt; 300ms (indexes + lean + select)
- No full-file buffering in memory; stable CPU under concurrent uploads

---

## Scalability – When to Move to Cloud Storage

Stay on **local disk** when:
- Single server or small cluster
- Upload volume is low/medium
- Backup/restore of `uploads/` is acceptable
- You can scale disk I/O (SSD, enough disk space)

**Move to object storage (S3, GCS, etc.) when:**
- Multiple app servers (no shared filesystem)
- High upload/concurrent request volume
- Need CDN in front of media (faster global delivery)
- Need durability/replication and lifecycle policies
- Disk space or I/O becomes a bottleneck

**Migration outline:**
1. Add a storage abstraction (e.g. `services/storage.js`) with `upload(localPath, key)`, `getStream(key)`, `getSignedUrl(key)`.
2. After Sharp/FFmpeg write to a temp path, call `storage.upload(tempPath, key)` and store the returned URL in DB.
3. For streaming, use `storage.getStream(key)` or redirect to signed/CDN URL.
4. Keep the same API shape (thumbnailUrl, mediumUrl, originalUrl); only the base URL changes.

---

## Quick reference

| Item        | Location |
|------------|----------|
| Image process | `backend/services/mediaProcessor.js` (Sharp) |
| Video process | `backend/services/mediaProcessor.js` (FFmpeg) |
| Upload config | `backend/middleware/upload.js` (imageUpload, videoUpload) |
| Streaming | `GET /api/media/stream?path=<relative path>` |
| Static cache | `server.js`: express.static maxAge 30d, etag, lastModified |
| Frontend image | `OptimizedImage.js` (lazy, skeleton, size) |
| Frontend video | `OptimizedVideo.js` (poster, play-on-click, 480p/720p) |

### Optional: migrate existing images

To backfill `thumbnailUrl`, `mediumUrl`, `originalUrl` for products/shops that only have the legacy `image` field:

```bash
cd backend
node scripts/migrateProductShopImages.js
```

Or with env file: `ENV_FILE=.env.prod node scripts/migrateProductShopImages.js`

The script finds documents with `image` but no `thumbnailUrl`, checks that the file exists on disk, runs Sharp to generate the three WebP sizes in the new folder structure, updates the document, and removes the old file. Documents whose image file is missing are skipped (and logged).
