const documentsService = require('../services/documents.service');

function getOwnerFromRequest(req) {
  const ownerHeader = req.header('x-user-id');
  return ownerHeader && ownerHeader.trim() ? ownerHeader.trim() : 'anonymous';
}

function uploadDocument(req, res, next) {
  try {
    const owner = getOwnerFromRequest(req);
    const savedDocument = documentsService.saveUploadedDocument(req.file, owner);

    res.status(201).json(savedDocument);
  } catch (error) {
    next(error);
  }
}

function listDocuments(req, res, next) {
  try {
    const documents = documentsService.listDocuments();
    res.json(documents);
  } catch (error) {
    next(error);
  }
}

async function downloadDocument(req, res, next) {
  try {
    const { id } = req.params;
    const downloadData = await documentsService.getDocumentDownloadData(id);

    res.download(downloadData.filePath, downloadData.originalName);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};
