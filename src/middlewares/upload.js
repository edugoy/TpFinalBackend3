const fs = require('fs');
const path = require('path');
const multer = require('multer');
const config = require('../config/env');
const { ALLOWED_FILE_MIME_TYPES } = require('../constants');
const { InvalidFileTypeError } = require('../errors/AppError');

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeBase = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_FILE_MIME_TYPES.includes(file.mimetype)) {
    return cb(new InvalidFileTypeError(`Tipo no permitido: ${file.mimetype}`));
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 }
});
