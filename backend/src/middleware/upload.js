const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { storageDir, maxFileSizeBytes } = require('../config/env');

// Files go to storage/pdfs/{user_id}/{random}.pdf
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(storageDir, String(req.userId));
    fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
  },
  filename(req, file, cb) {
    cb(null, `${crypto.randomUUID()}.pdf`);
  },
});

function pdfOnly(req, file, cb) {
  const isPdfName = path.extname(file.originalname).toLowerCase() === '.pdf';
  const isPdfMime = file.mimetype === 'application/pdf';
  if (isPdfName && isPdfMime) return cb(null, true);
  const err = new Error(`"${file.originalname}" ไม่ใช่ไฟล์ PDF`);
  err.status = 400;
  return cb(err);
}

const uploadPdfs = multer({
  storage,
  fileFilter: pdfOnly,
  limits: { fileSize: maxFileSizeBytes, files: 20 },
}).array('files', 20);

module.exports = { uploadPdfs };
