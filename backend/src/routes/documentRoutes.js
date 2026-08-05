const express = require('express');
const multer = require('multer');
const path = require('path');
const documentController = require('../controllers/documentController');

const router = express.Router();

const STORAGE_DIR = path.resolve(__dirname, '../../storage');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, STORAGE_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

module.exports = router;
