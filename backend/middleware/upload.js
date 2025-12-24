const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDir;
    
    if (file.fieldname === 'shopImage') {
      uploadPath = path.join(uploadDir, 'shops');
    } else if (file.fieldname === 'productImage') {
      uploadPath = path.join(uploadDir, 'products');
    } else if (file.fieldname === 'image') {
      uploadPath = path.join(uploadDir, 'categories');
    } else if (file.fieldname === 'video') {
      uploadPath = path.join(uploadDir, 'videos');
    } else if (file.fieldname === 'thumbnail') {
      uploadPath = path.join(uploadDir, 'videos', 'thumbnails');
    }
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let fieldName = file.fieldname === 'image' ? 'category' : file.fieldname;
    if (file.fieldname === 'video') {
      fieldName = 'video';
    } else if (file.fieldname === 'thumbnail') {
      fieldName = 'thumbnail';
    }
    cb(null, fieldName + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // For video uploads, allow video files
  if (file.fieldname === 'video') {
    const allowedVideoTypes = /mp4|webm|ogg|mov|avi/;
    const extname = allowedVideoTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('video/');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed (mp4, webm, ogg, mov, avi)'));
    }
  } 
  // For thumbnail uploads, allow image files
  else if (file.fieldname === 'thumbnail') {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for thumbnails'));
    }
  }
  // For other uploads (images), use the original filter
  else {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for images
  fileFilter: fileFilter
});

// Separate upload config for videos (larger file size limit)
const videoUpload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for videos
  fileFilter: fileFilter
});

module.exports = upload;
module.exports.videoUpload = videoUpload;

