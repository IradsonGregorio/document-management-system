const documentsService = require('../services/documents.service');

function getOwnerFromRequest(req) {
  const ownerHeader = req.header('x-user-id');
  return ownerHeader && ownerHeader.trim() ? ownerHeader.trim() : 'anonymous';
}

function handleError(res, error) {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Erro interno no servidor.' : error.message;
  res.status(statusCode).json({ error: message });
}

function uploadDocument(req, res) {
  try {
    const owner = getOwnerFromRequest(req);
    const savedDocument = documentsService.saveUploadedDocument(req.file, owner);

    res.status(201).json(savedDocument);
  } catch (error) {
    handleError(res, error);
  }
}

function listDocuments(req, res) {
  try {
    const documents = documentsService.listDocuments();
    res.json(documents);
  } catch (error) {
    handleError(res, error);
  }
}

async function downloadDocument(req, res) {
  try {
    const { id } = req.params;
    const downloadData = await documentsService.getDocumentDownloadData(id);

    res.download(downloadData.filePath, downloadData.originalName);
  } catch (error) {
    handleError(res, error);
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};
