const fs = require('node:fs/promises');

const documents = [];

function add(document) {
  documents.push(document);
  return document;
}

function list() {
  return [...documents];
}

function findById(id) {
  return documents.find((document) => document.id === id) || null;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  add,
  list,
  findById,
  fileExists,
};
