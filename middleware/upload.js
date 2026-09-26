// middleware/upload.js
const multer = require('multer');
const path = require('path');

const maxMb = parseInt(process.env.MAX_UPLOAD_MB, 10) || 10;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
    cb(null, unique);
  }
});

function fileFilter(req, file, cb) {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxMb * 1024 * 1024 }
});

module.exports = upload;
