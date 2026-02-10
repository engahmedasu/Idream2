/**
 * Media processing service: images (Sharp) and videos (FFmpeg).
 * Production-grade, non-blocking where possible. Local disk only.
 */

const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const config = require('../config/app');

const UPLOAD_DIR = config.upload.uploadDir;
const IMAGE_MAX_WIDTH_ORIGINAL = 1920;
const IMAGE_WIDTH_MEDIUM = 800;
const IMAGE_WIDTH_THUMB = 300;
const WEBP_QUALITY = 85;

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Process uploaded image: convert to WebP, generate thumb / medium / original.
 * Removes the original file after processing.
 * @param {string} tempFilePath - Full path to uploaded file
 * @param {string} entityType - 'product' | 'shop'
 * @param {string} entityId - productId or shopId
 * @returns {Promise<{ thumbnailUrl: string, mediumUrl: string, originalUrl: string }>}
 */
async function processImage(tempFilePath, entityType, entityId) {
  const sharp = require('sharp');
  const baseDir = path.join(UPLOAD_DIR, entityType === 'product' ? 'products' : 'shops', String(entityId), 'images');
  await ensureDir(baseDir);

  const thumbPath = path.join(baseDir, 'thumb.webp');
  const mediumPath = path.join(baseDir, 'medium.webp');
  const originalPath = path.join(baseDir, 'original.webp');

  const pipeline = sharp(tempFilePath);
  const metadata = await pipeline.metadata();
  const width = metadata.width || 1920;

  const toWidth = (w) => Math.min(w, width);

  await Promise.all([
    pipeline
      .clone()
      .resize(toWidth(IMAGE_WIDTH_THUMB), null, { withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(thumbPath),
    sharp(tempFilePath)
      .resize(toWidth(IMAGE_WIDTH_MEDIUM), null, { withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(mediumPath),
    sharp(tempFilePath)
      .resize(toWidth(IMAGE_MAX_WIDTH_ORIGINAL), null, { withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(originalPath),
  ]);

  try {
    await fs.unlink(tempFilePath);
  } catch (e) {
    console.warn('Could not remove temp image:', tempFilePath, e.message);
  }

  const prefix = '/uploads';
  const rel = (p) => path.relative(UPLOAD_DIR, p).replace(/\\/g, '/');
  return {
    thumbnailUrl: prefix + '/' + rel(thumbPath),
    mediumUrl: prefix + '/' + rel(mediumPath),
    originalUrl: prefix + '/' + rel(originalPath),
  };
}

/**
 * Run FFmpeg command; returns a promise that resolves when process exits 0.
 */
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited ${code}: ${stderr.slice(-500)}`));
    });
    proc.on('error', (err) => reject(err));
  });
}

/**
 * Process uploaded video: convert to MP4 (H.264 + AAC), 480p + 720p, thumbnail at 3s.
 * Deletes original after processing. Runs async (non-blocking).
 * @param {string} tempFilePath - Full path to uploaded file
 * @param {string} entityType - 'product' | 'shop'
 * @param {string} entityId - productId or shopId
 * @param {function} onComplete - (err, { video480Url, video720Url, thumbnailUrl }) => {}
 */
function processVideo(tempFilePath, entityType, entityId, onComplete) {
  const baseDir = path.join(UPLOAD_DIR, entityType === 'product' ? 'products' : 'shops', String(entityId), 'video');
  const dirRel = path.join(entityType === 'product' ? 'products' : 'shops', String(entityId), 'video');
  const prefix = '/uploads';

  (async () => {
    try {
      await ensureDir(baseDir);
      const out480 = path.join(baseDir, '480p.mp4');
      const out720 = path.join(baseDir, '720p.mp4');
      const thumbPath = path.join(baseDir, 'thumbnail.jpg');

      // 480p: H.264, AAC, web-optimized
      await runFfmpeg([
        '-i', tempFilePath,
        '-vf', 'scale=-2:480',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', 23,
        '-c:a', 'aac', '-b:a', '128k',
        '-movflags', '+faststart',
        '-y', out480,
      ]);

      // 720p
      await runFfmpeg([
        '-i', tempFilePath,
        '-vf', 'scale=-2:720',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', 23,
        '-c:a', 'aac', '-b:a', '128k',
        '-movflags', '+faststart',
        '-y', out720,
      ]);

      // Thumbnail at 3 seconds
      await runFfmpeg([
        '-i', tempFilePath,
        '-ss', '3',
        '-vframes', '1',
        '-vf', 'scale=-2:360',
        '-y', thumbPath,
      ]);

      try {
        await fs.unlink(tempFilePath);
      } catch (e) {
        console.warn('Could not remove temp video:', tempFilePath, e.message);
      }

      const rel = (p) => path.relative(UPLOAD_DIR, p).replace(/\\/g, '/');
      onComplete(null, {
        video480Url: prefix + '/' + rel(out480),
        video720Url: prefix + '/' + rel(out720),
        thumbnailUrl: prefix + '/' + rel(thumbPath),
      });
    } catch (err) {
      onComplete(err, null);
    }
  })();
}

module.exports = {
  processImage,
  processVideo,
  ensureDir,
};
