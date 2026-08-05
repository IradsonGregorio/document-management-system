const path = require('node:path');
const fs = require('node:fs');

const STORAGE_DIRECTORY = path.resolve(__dirname, '../../storage');
const MAX_UPLOAD_SIZE_BYTES = Number.parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || '', 10) || 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
]);

function ensureStorageDirectory() {
  if (!fs.existsSync(STORAGE_DIRECTORY)) {
    fs.mkdirSync(STORAGE_DIRECTORY, { recursive: true });
  }
}

module.exports = {
  STORAGE_DIRECTORY,
  MAX_UPLOAD_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  ensureStorageDirectory,
};
