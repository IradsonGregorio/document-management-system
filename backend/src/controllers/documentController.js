const path = require('path');
const documentService = require('../services/documentService');

const STORAGE_DIR = path.resolve(__dirname, '../../storage');

function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const doc = documentService.saveDocument({
    originalname: req.file.originalname,
    filename: req.file.filename,
    size: req.file.size,
    owner: req.body.owner,
  });

  return res.status(201).json(doc);
}

function listDocuments(req, res) {
  const docs = documentService.listDocuments();
  return res.json(docs);
}

function downloadDocument(req, res) {
  const doc = documentService.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  const filePath = path.join(STORAGE_DIR, doc.filename);
  return res.download(filePath, doc.originalname);
}

module.exports = { upload, listDocuments, downloadDocument };
