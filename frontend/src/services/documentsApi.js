const API_BASE = '/api';

async function parseError(response) {
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return data.error || 'Erro inesperado na API.';
    }

    const text = await response.text();
    return text || 'Erro inesperado na API.';
  } catch {
    return `Erro inesperado na API (${response.status}).`;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message);
  }

  return response;
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const headers = {};
  if (owner && owner.trim()) {
    headers['x-user-id'] = owner.trim();
  }

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
    headers,
  });

  return response.json();
}

export async function listDocuments(options = {}) {
  const response = await request('/documents', {
    signal: options.signal,
  });
  return response.json();
}

function getFileNameFromDisposition(disposition, fallback) {
  if (!disposition) {
    return fallback;
  }

  const match = disposition.match(/filename="?([^";]+)"?/i);
  if (!match || !match[1]) {
    return fallback;
  }

  return decodeURIComponent(match[1]);
}

export async function downloadDocument(documentId, fallbackName) {
  const response = await request(`/documents/${documentId}/download`);
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition');
  const fileName = getFileNameFromDisposition(disposition, fallbackName || 'documento');

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
