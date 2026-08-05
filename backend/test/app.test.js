const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const app = require('../src/app');
const { STORAGE_DIRECTORY, MAX_UPLOAD_SIZE_BYTES } = require('../src/config/storage.config');

let server;
let baseUrl;
const uploadedFileNames = [];

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => {
    server.once('listening', resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await Promise.all(
    uploadedFileNames.map(async (fileName) => {
      try {
        await fs.unlink(`${STORAGE_DIRECTORY}/${fileName}`);
      } catch {
        // Ignora limpeza de arquivo já removido.
      }
    })
  );
});

test('GET /health responde status ok', async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.strictEqual(response.status, 200);
  const payload = await response.json();
  assert.deepStrictEqual(payload, { status: 'ok' });
});

test('POST /upload envia arquivo e retorna metadados', async () => {
  const formData = new FormData();
  const content = 'conteudo de teste';
  formData.append('file', new Blob([content], { type: 'text/plain' }), 'teste.txt');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: {
      'x-user-id': 'qa-user',
    },
    body: formData,
  });

  assert.strictEqual(response.status, 201);
  const payload = await response.json();
  assert.ok(payload.id);
  assert.strictEqual(payload.owner, 'qa-user');
  assert.strictEqual(payload.originalName, 'teste.txt');
  assert.ok(payload.fileName);
  uploadedFileNames.push(payload.fileName);
});

test('GET /documents lista documentos enviados', async () => {
  const response = await fetch(`${baseUrl}/documents`);

  assert.strictEqual(response.status, 200);
  const payload = await response.json();
  assert.ok(Array.isArray(payload));
  assert.ok(payload.length >= 1);
});

test('GET /documents/:id/download baixa arquivo existente', async () => {
  const documentsResponse = await fetch(`${baseUrl}/documents`);
  const documents = await documentsResponse.json();
  const firstDocument = documents[0];

  assert.ok(firstDocument?.id);

  const response = await fetch(`${baseUrl}/documents/${firstDocument.id}/download`);

  assert.strictEqual(response.status, 200);
  const body = await response.text();
  assert.ok(body.length > 0);
});

test('POST /upload retorna 400 sem arquivo', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });

  assert.strictEqual(response.status, 400);
  const payload = await response.json();
  assert.strictEqual(payload.error, 'Nenhum arquivo enviado.');
});

test('POST /upload bloqueia tipo não permitido', async () => {
  const formData = new FormData();
  formData.append('file', new Blob(['#!/bin/bash\necho test'], { type: 'application/x-sh' }), 'script.sh');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  assert.strictEqual(response.status, 400);
  const payload = await response.json();
  assert.strictEqual(payload.error, 'Tipo de arquivo não permitido.');
});

test('POST /upload bloqueia arquivo acima do limite', async () => {
  const oversizedContent = 'a'.repeat(MAX_UPLOAD_SIZE_BYTES + 1024);
  const formData = new FormData();
  formData.append('file', new Blob([oversizedContent], { type: 'text/plain' }), 'grande.txt');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  assert.strictEqual(response.status, 413);
  const payload = await response.json();
  assert.strictEqual(payload.error, 'Arquivo excede o limite de tamanho permitido.');
});

test('GET /documents/:id/download retorna 404 para id inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/id-inexistente/download`);

  assert.strictEqual(response.status, 404);
  const payload = await response.json();
  assert.strictEqual(payload.error, 'Documento não encontrado.');
});
