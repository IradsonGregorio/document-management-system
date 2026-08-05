const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const express = require('express');
const documentsController = require('../controllers/documents.controller');
const {
  STORAGE_DIRECTORY,
  MAX_UPLOAD_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  ensureStorageDirectory,
} = require('../config/storage.config');

const router = express.Router();
ensureStorageDirectory();

function getSafeExtension(fileName) {
  const extension = path.extname(fileName || '').toLowerCase();
  return /^[.][a-z0-9]{1,10}$/.test(extension) ? extension : '';
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, STORAGE_DIRECTORY);
  },
  filename: (req, file, cb) => {
    const extension = getSafeExtension(file.originalname);
    cb(null, `${randomUUID()}${extension}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error('Tipo de arquivo não permitido.');
    error.statusCode = 400;
    cb(error);
    return;
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 1,
  },
});

router.post('/upload', upload.single('file'), documentsController.uploadDocument);
router.get('/documents', documentsController.listDocuments);
router.get('/documents/:id/download', documentsController.downloadDocument);

module.exports = router;
