const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: Number(process.env.PORT) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  maxFileSizeBytes: (Number(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024,
  storageDir: path.resolve(__dirname, '../..', process.env.STORAGE_DIR || './storage/pdfs'),
};
