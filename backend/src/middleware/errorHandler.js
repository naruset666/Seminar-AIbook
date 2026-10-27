const multer = require('multer');
const { nodeEnv, maxFileSizeBytes } = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ message: `ไม่พบ ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? `ไฟล์ใหญ่เกิน ${Math.round(maxFileSizeBytes / 1024 / 1024)} MB`
      : `อัปโหลดไม่สำเร็จ: ${err.message}`;
    return res.status(400).json({ message });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({
    message: status >= 500 ? 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' : err.message,
    ...(nodeEnv === 'development' && status >= 500 && { detail: err.message }),
  });
}

module.exports = { notFound, errorHandler };
