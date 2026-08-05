const { randomUUID } = require('node:crypto');
const path = require('node:path');
const documentsRepository = require('../repositories/documents.repository');

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function saveUploadedDocument(file, owner) {
  if (!file) {
    throw createHttpError(400, 'Nenhum arquivo enviado.');
  }

  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    fileName: file.filename,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };

  return documentsRepository.add(document);
}

function listDocuments() {
  return documentsRepository.list();
}

async function getDocumentDownloadData(documentId) {
  if (!documentId) {
    throw createHttpError(400, 'ID do documento é obrigatório.');
  }

  const document = documentsRepository.findById(documentId);
  if (!document) {
    throw createHttpError(404, 'Documento não encontrado.');
  }

  const filePath = path.resolve(__dirname, '../../storage', document.fileName);
  const exists = await documentsRepository.fileExists(filePath);

  if (!exists) {
    throw createHttpError(404, 'Arquivo do documento não encontrado.');
  }

  return {
    filePath,
    originalName: document.originalName,
  };
}

module.exports = {
  saveUploadedDocument,
  listDocuments,
  getDocumentDownloadData,
};
