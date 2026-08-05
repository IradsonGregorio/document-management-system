const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const path = require('path');
const fs = require('node:fs');

const app = require('../src/app');
const documentRepository = require('../src/repositories/documentRepository');

// Diretório de armazenamento usado pelo multer
const STORAGE_DIR = path.resolve(__dirname, '../storage');

let server;
let baseUrl;

before(() => new Promise((resolve) => {
  server = http.createServer(app);
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
    resolve();
  });
}));

after(() => new Promise((resolve) => {
  server.close(resolve);
}));

beforeEach(() => {
  // Reseta metadados em memória entre testes
  documentRepository.clear();
});

// Auxiliar: faz multipart/form-data com um arquivo de texto simples
function uploadFile(url, filename, content) {
  return new Promise((resolve, reject) => {
    const boundary = '----TestBoundary' + Date.now();
    const body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="${filename}"`,
      'Content-Type: text/plain',
      '',
      content,
      `--${boundary}--`,
    ].join('\r\n');

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

test('POST /upload - retorna 400 sem arquivo', async () => {
  const boundary = '----Empty' + Date.now();
  const body = `--${boundary}--\r\n`;
  const res = await new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = http.request(`${baseUrl}/upload`, options, (r) => {
      let data = '';
      r.on('data', (c) => (data += c));
      r.on('end', () => resolve({ status: r.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  assert.strictEqual(res.status, 400);
  const json = JSON.parse(res.body);
  assert.ok(json.error);
});

test('POST /upload - faz upload de um arquivo e retorna metadados', async () => {
  const res = await uploadFile(`${baseUrl}/upload`, 'teste.txt', 'conteúdo de teste');

  assert.strictEqual(res.status, 201);
  const doc = JSON.parse(res.body);
  assert.ok(doc.id, 'deve ter um id');
  assert.strictEqual(doc.originalname, 'teste.txt');
  assert.ok(doc.filename, 'deve ter um filename gerado');
  assert.ok(doc.uploadedAt, 'deve ter uploadedAt');

  // Limpa o arquivo gravado no storage
  const filePath = path.join(STORAGE_DIR, doc.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
});

test('GET /documents - retorna lista vazia inicialmente', async () => {
  const res = await get(`${baseUrl}/documents`);

  assert.strictEqual(res.status, 200);
  const docs = JSON.parse(res.body);
  assert.ok(Array.isArray(docs));
  assert.strictEqual(docs.length, 0);
});

test('GET /documents - lista documentos após upload', async () => {
  const upload = await uploadFile(`${baseUrl}/upload`, 'lista.txt', 'conteúdo');
  const doc = JSON.parse(upload.body);

  const res = await get(`${baseUrl}/documents`);
  assert.strictEqual(res.status, 200);
  const docs = JSON.parse(res.body);
  assert.strictEqual(docs.length, 1);
  assert.strictEqual(docs[0].originalname, 'lista.txt');

  // Limpa arquivo
  const filePath = path.join(STORAGE_DIR, doc.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
});

test('GET /documents/:id/download - retorna 404 para id inexistente', async () => {
  const res = await get(`${baseUrl}/documents/9999/download`);
  assert.strictEqual(res.status, 404);
});

test('GET /documents/:id/download - faz download do arquivo enviado', async () => {
  const content = 'arquivo para download';
  const upload = await uploadFile(`${baseUrl}/upload`, 'download.txt', content);
  const doc = JSON.parse(upload.body);

  const res = await get(`${baseUrl}/documents/${doc.id}/download`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.headers['content-disposition']);
  assert.ok(res.body.includes('arquivo para download'));

  // Limpa arquivo
  const filePath = path.join(STORAGE_DIR, doc.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
});
