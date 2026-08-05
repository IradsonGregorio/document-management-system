// Repositório em memória para metadados dos documentos.
const documents = [];
let nextId = 1;

function save(metadata) {
  const doc = { id: nextId++, ...metadata };
  documents.push(doc);
  return doc;
}

function findAll() {
  return [...documents];
}

function findById(id) {
  return documents.find((d) => d.id === Number(id)) || null;
}

// Limpa o estado em memória (usado em testes).
function clear() {
  documents.length = 0;
  nextId = 1;
}

module.exports = { save, findAll, findById, clear };
