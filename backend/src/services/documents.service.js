const { randomUUID } = require('node:crypto');
const path = require('node:path');
const documentsRepository = require('../repositories/documents.repository');
const { STORAGE_DIRECTORY } = require('../config/storage.config');

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function raiseHttpError(statusCode, message) {
  throw createHttpError(statusCode, message);
}

function assertUploadedFile(file) {
  if (!file) {
    raiseHttpError(400, 'Nenhum arquivo enviado.');
  }
}

function createDocumentMetadata(file, owner) {
  return {
    id: randomUUID(),
    originalName: file.originalname,
    fileName: file.filename,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };
}

function assertDocumentId(documentId) {
  if (!documentId) {
    raiseHttpError(400, 'ID do documento é obrigatório.');
  }
}

function getDocumentByIdOrFail(documentId) {
  const document = documentsRepository.findById(documentId);
  if (!document) {
    raiseHttpError(404, 'Documento não encontrado.');
  }

  return document;
}

function saveUploadedDocument(file, owner) {
  assertUploadedFile(file);
  const document = createDocumentMetadata(file, owner);

  return documentsRepository.add(document);
}

function listDocuments() {
  return documentsRepository.list();
}

function resolveStoragePath(fileName) {
  const baseDirectory = path.resolve(STORAGE_DIRECTORY);
  const resolvedPath = path.resolve(baseDirectory, fileName || '');

  if (!resolvedPath.startsWith(`${baseDirectory}${path.sep}`)) {
    raiseHttpError(400, 'Nome de arquivo inválido para download.');
  }

  return resolvedPath;
}

function sanitizeDownloadName(name) {
  return (name || 'documento')
    .replace(/[\r\n]/g, '')
    .replace(/[\\/]/g, '_')
    .trim() || 'documento';
}

async function getDocumentDownloadData(documentId) {
  assertDocumentId(documentId);

  const document = getDocumentByIdOrFail(documentId);

  const filePath = resolveStoragePath(document.fileName);
  const exists = await documentsRepository.fileExists(filePath);

  if (!exists) {
    raiseHttpError(404, 'Arquivo do documento não encontrado.');
  }

  return {
    filePath,
    originalName: sanitizeDownloadName(document.originalName),
  };
}

module.exports = {
  saveUploadedDocument,
  listDocuments,
  getDocumentDownloadData,
};
