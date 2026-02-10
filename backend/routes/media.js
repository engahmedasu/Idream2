/**
 * Media streaming: HTTP Range support for video (206 Partial Content).
 * Use fs.createReadStream with start/end; set Content-Range, Accept-Ranges, Content-Type.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('../config/app');

const router = express.Router();
const uploadDir = config.upload.uploadDir;

/**
 * GET /api/media/stream
 * Query: path = relative path under uploads (e.g. products/123/video/480p.mp4)
 * Supports Range header for partial content (206).
 */
router.get('/stream', (req, res) => {
  const relativePath = req.query.path;
  if (!relativePath || relativePath.includes('..') || path.isAbsolute(relativePath)) {
    return res.status(400).json({ message: 'Invalid path' });
  }
  const filePath = path.resolve(path.join(uploadDir, relativePath));
  const uploadDirResolved = path.resolve(uploadDir);
  if (!filePath.startsWith(uploadDirResolved) || filePath === uploadDirResolved) {
    return res.status(400).json({ message: 'Invalid path' });
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return res.status(404).json({ message: 'Not found' });
    }
    const total = stat.size;
    const range = req.headers.range;
    const isMp4 = filePath.toLowerCase().endsWith('.mp4');

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', isMp4 ? 'video/mp4' : 'application/octet-stream');

    if (!range) {
      res.setHeader('Content-Length', total);
      res.status(200);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      return;
    }

    const match = range.match(/bytes=(\d*)-(\d*)/);
    if (!match) {
      res.setHeader('Content-Length', total);
      res.status(200);
      return fs.createReadStream(filePath).pipe(res);
    }
    const start = parseInt(match[1], 10) || 0;
    const end = match[2] ? parseInt(match[2], 10) : total - 1;
    const len = end - start + 1;

    res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
    res.setHeader('Content-Length', len);
    res.status(206);
    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);
  });
});

module.exports = router;
