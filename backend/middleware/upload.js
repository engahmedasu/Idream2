/**
 * Upload middleware: diskStorage only (no memory buffering).
 * Image: 5MB max, jpg/jpeg/png/webp → temp; then processed by mediaProcessor to WebP sizes.
 * Video: 100MB max (configurable), mp4/mov/avi → temp; then FFmpeg processing.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
const tempDir = path.join(uploadDir, '_temp');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// --- Image upload (products/shops): 5MB, jpg/jpeg/png/webp → _temp
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let sub = 'images';
    if (file.fieldname === 'productImage') sub = 'products';
    else if (file.fieldname === 'shopImage') sub = 'shops';
    const dest = path.join(tempDir, sub);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase().replace('.', '') || 'jpg';
    const safe = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}.${safe}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname || '').toLowerCase().replace('.', '');
  const mimetype = (file.mimetype || '').toLowerCase();
  const ok = allowed.test(ext) && (mimetype === 'image/jpeg' || mimetype === 'image/png' || mimetype === 'image/webp');
  if (ok) cb(null, true);
  else cb(new Error('Only image files are allowed (jpg, jpeg, png, webp). Max 5MB.'), false);
};

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

// --- Video upload: 100MB (configurable), mp4/mov/avi → _temp
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(tempDir, 'videos');
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase().replace('.', '') || 'mp4';
    const safe = ['mp4', 'mov', 'avi'].includes(ext) ? ext : 'mp4';
    cb(null, `video-${Date.now()}-${Math.round(Math.random() * 1e9)}.${safe}`);
  },
});

const videoFileFilter = (req, file, cb) => {
  const allowed = /mp4|mov|avi/;
  const ext = path.extname(file.originalname || '').toLowerCase().replace('.', '');
  const mimetype = (file.mimetype || '').toLowerCase();
  const ok = allowed.test(ext) && (mimetype.startsWith('video/'));
  if (ok) cb(null, true);
  else cb(new Error('Only video files are allowed (mp4, mov, avi). Max 100MB.'), false);
};

const maxVideoSize = parseInt(process.env.MAX_VIDEO_UPLOAD_MB || '100', 10) * 1024 * 1024;
const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: maxVideoSize },
  fileFilter: videoFileFilter,
});

// --- Legacy / other uploads (categories, advertisements, documents, etc.): keep existing behavior
const legacyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDir;
    if (file.fieldname === 'image') uploadPath = path.join(uploadDir, 'categories');
    else if (file.fieldname === 'video') uploadPath = path.join(uploadDir, 'videos');
    else if (file.fieldname === 'thumbnail') uploadPath = path.join(uploadDir, 'videos', 'thumbnails');
    else if (file.fieldname === 'document' || file.fieldname === 'requestDocument') uploadPath = path.join(uploadDir, 'requests');
    else if (file.fieldname === 'advertisementImage' || file.fieldname === 'advertisement') uploadPath = path.join(uploadDir, 'advertisements');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let name = file.fieldname === 'image' ? 'category' : file.fieldname;
    if (file.fieldname === 'video') name = 'video';
    else if (file.fieldname === 'thumbnail') name = 'thumbnail';
    else if (file.fieldname === 'advertisementImage' || file.fieldname === 'advertisement') name = 'advertisement';
    cb(null, name + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const legacyFileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    const ok = /mp4|webm|ogg|mov|avi/.test(path.extname(file.originalname).toLowerCase()) && file.mimetype.startsWith('video/');
    return cb(ok ? null : new Error('Only video files allowed'), ok);
  }
  if (file.fieldname === 'thumbnail' || file.fieldname === 'image' || file.fieldname === 'advertisementImage' || file.fieldname === 'advertisement') {
    const ok = /jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase());
    return cb(ok ? null : new Error('Only image files allowed'), ok);
  }
  if (file.fieldname === 'document' || file.fieldname === 'requestDocument') {
    const ok = /doc|docx|pdf/.test(path.extname(file.originalname).toLowerCase());
    return cb(ok ? null : new Error('Only .doc, .docx, .pdf allowed'), ok);
  }
  cb(null, true);
};

const upload = multer({
  storage: legacyStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: legacyFileFilter,
});

const documentUpload = multer({
  storage: legacyStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: legacyFileFilter,
});

module.exports = upload;
module.exports.imageUpload = imageUpload;
module.exports.videoUpload = videoUpload;
module.exports.documentUpload = documentUpload;
