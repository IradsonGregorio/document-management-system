const documentRepository = require('../repositories/documentRepository');

function listDocuments() {
  return documentRepository.findAll();
}

function saveDocument({ originalname, filename, size, owner }) {
  return documentRepository.save({
    originalname,
    filename,
    size,
    owner: owner || 'anonymous',
    uploadedAt: new Date().toISOString(),
  });
}

function getDocumentById(id) {
  return documentRepository.findById(id);
}

module.exports = { listDocuments, saveDocument, getDocumentById };
