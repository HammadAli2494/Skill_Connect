import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(req, file, cb) {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new ApiError(400, 'Upload a JPG, PNG, or WEBP image under 5 MB.'));
      return;
    }
    cb(null, true);
  },
});
